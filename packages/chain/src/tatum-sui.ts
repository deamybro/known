/**
 * Tatum Sui Gateway Integration
 * Queries Sui transaction history and balance changes using Tatum's Sui GraphQL gateway.
 */

import { isDustTransfer, isZeroValueTransfer, normalizeAddress, TransferRecord } from "@known/core";
import { defaultPacer } from "./pacer.js";

export interface SuiBalanceChangeNode {
  coinType: {
    repr: string;
  };
  amount: string; // Negative if outgoing, positive if incoming
  owner?: {
    asAddress?: {
      address: string;
    };
  };
}

export async function fetchTatumSuiHistory(
  walletAddress: string,
  apiKey: string,
  gatewayUrl = "https://sui-mainnet.gateway.tatum.io/graphql",
  limit = 20
): Promise<TransferRecord[]> {
  const normWatched = normalizeAddress("sui", walletAddress);
  if (!normWatched.isValid) {
    throw new Error(`Invalid Sui address: ${walletAddress}`);
  }

  const query = `
    query GetAddressTransactions($address: SuiAddress!, $limit: Int!) {
      transactions(
        last: $limit
        filter: { affectedAddress: $address }
      ) {
        nodes {
          digest
          sender {
            asAddress {
              address
            }
          }
          effects {
            timestamp
            status
            balanceChanges {
              nodes {
                coinType {
                  repr
                }
                amount
                owner {
                  asAddress {
                    address
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    address: normWatched.normalized,
    limit,
  };

  const response = await defaultPacer.fetchWithRetry(gatewayUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tatum Sui Gateway error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const txNodes = result?.data?.transactions?.nodes || [];

  const transfers: TransferRecord[] = [];

  for (const node of txNodes) {
    const digest = node.digest;
    const timestamp = node.effects?.timestamp || new Date().toISOString();
    const balanceNodes: SuiBalanceChangeNode[] = node.effects?.balanceChanges?.nodes || [];

    // Find the balance change for the watched wallet
    const myChange = balanceNodes.find((b) => {
      const ownerAddr = b.owner?.asAddress?.address;
      if (!ownerAddr) return false;
      const norm = normalizeAddress("sui", ownerAddr);
      return norm.normalized === normWatched.normalized;
    });

    if (!myChange) continue;

    const myAmount = BigInt(myChange.amount || "0");
    if (myAmount === 0n) continue;

    const direction: "in" | "out" = myAmount < 0n ? "out" : "in";
    const absAmount = myAmount < 0n ? -myAmount : myAmount;
    const amountRaw = absAmount.toString();

    // Find the counterparty (another address whose balance changed with opposite sign)
    let counterpartyAddress = "";
    for (const b of balanceNodes) {
      const ownerAddr = b.owner?.asAddress?.address;
      if (!ownerAddr) continue;
      const norm = normalizeAddress("sui", ownerAddr);
      if (norm.normalized !== normWatched.normalized) {
        counterpartyAddress = norm.normalized;
        break;
      }
    }

    // If no counterparty found from balance changes, fall back to sender or watched address
    if (!counterpartyAddress) {
      if (direction === "in" && node.sender?.asAddress?.address) {
        counterpartyAddress = normalizeAddress("sui", node.sender.asAddress.address).normalized;
      } else {
        counterpartyAddress = "0x0000000000000000000000000000000000000000000000000000000000000000";
      }
    }

    const coinTypeRepr = myChange.coinType?.repr || "0x2::sui::SUI";
    const isNative = coinTypeRepr.includes("::sui::SUI");
    const asset = isNative ? "native" : coinTypeRepr;
    const assetSymbol = isNative ? "SUI" : coinTypeRepr.split("::").pop() || "COIN";
    const decimals = isNative ? 9 : 6;

    const isZero = isZeroValueTransfer(amountRaw);
    const isDust = isDustTransfer("sui", amountRaw, asset, decimals);

    transfers.push({
      id: `sui:${digest}:${counterpartyAddress}:${asset}:${direction}`,
      userId: "", // Set by importer
      chain: "sui",
      txHash: digest,
      direction,
      counterparty: counterpartyAddress,
      counterpartyNormalized: counterpartyAddress,
      asset,
      assetSymbol,
      amountRaw,
      decimals,
      timestamp,
      isZeroValue: isZero,
      isDust,
      source: "tatum",
    });
  }

  return transfers;
}
