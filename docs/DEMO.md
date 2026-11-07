# Known — 3-Minute Hackathon Demo Script & Storyboard

*Total Recall: Tatum × Walrus Memory Hackathon*  
*Track 03: Consumer Finance Apps | Best Walrus Memory | Best Use of Agent Payments*  
*Project URL:* `http://localhost:3000` | *Repository:* `https://github.com/Stella112/WALRUS`

---

## 🎬 Video Overview

* **Target Length:** Exactly 3 minutes (180 seconds).
* **Tone:** Authoritative, high-energy, technical yet accessible.
* **Format:** Screen recording with picture-in-picture webcam (or crisp voiceover) showing the Next.js UI, the terminal, and live telemetry.

---

## ⏱️ Scene-by-Scene Storyboard

```
[0:00 - 0:30]  Scene 1: The $50 Million Memory Failure
[0:30 - 1:00]  Scene 2: Ingesting Real History & Bootstrapping Memory
[1:00 - 1:40]  Scene 3: The Live Poisoning Attack (RED ALERT)
[1:40 - 2:10]  Scene 4: The Real Payee (GREEN SAFE VERDICT)
[2:10 - 2:40]  Scene 5: AI Agent Pre-Flight Check (Agent Payments Track)
[2:40 - 3:00]  Scene 6: Zero-DB Sovereign Restoration (Walrus Memory Track)
```

---

### Scene 1: The $50 Million Memory Failure (0:00 – 0:30)

* **Visual on Screen:** 
  * Open browser on Known's landing page (`/`).
  * Headline visible: *"Your transaction history can be poisoned. Your memory can't."*
  * Quick flash of headlines: Cointelegraph $50M copy-paste USDT loss, Trust Wallet 225M poisoning attacks alert.
* **Voiceover:**
  > *"In December 2025, a crypto trader lost fifty million dollars in a single click after copying an address from their own transaction history. In January 2026, another user lost twelve million dollars.*
  > 
  > *Address poisoning has stolen over five hundred million dollars because people treat their transaction history as their address book. But anyone can send you a dust transaction from an address that looks almost identical to your friends. Your transaction history can be poisoned. Your memory can't.*
  > 
  > *This is Known: personal payment memory powered by Tatum and Walrus Memory."*

---

### Scene 2: Ingesting Real History & Bootstrapping Memory (0:30 – 1:00)

* **Visual on Screen:** 
  * Navigate to `/wallets`. Click **"Import Multi-Chain History via Tatum"**.
  * Show transfers populating across Ethereum and Sui with live transaction hashes.
  * Navigate to `/payees`. Show suggested payees derived from genuine **outgoing** transfers.
  * Point out that unsolicited incoming dust transfers are nowhere to be seen.
  * Click **"Confirm Payee"** on `Ada Sister` (`0x565c...64a38`). Show outbox sync toast.
* **Voiceover:**
  > *"Known starts by learning who you actually pay. Connecting through Tatum's Data APIs and Sui Gateway, Known pulls your real multi-chain history.*
  > 
  > *Notice our core safety rule: inbound-only addresses are strictly quarantined. Attackers who only ever send you dust can never enter your payee list.*
  > 
  > *We confirm our real payee: Ada, our sister. That confirmation is instantly enqueued and written to our decentralized Walrus Memory account on Sui mainnet."*

---

### Scene 3: The Live Poisoning Attack (1:00 – 1:40)

* **Visual on Screen:** 
  * Switch to split-screen: Browser on the left, Terminal on the right.
  * Run in terminal: `pnpm tsx scripts/make-lookalike.ts 0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38 3 1`
  * Show the grinder finding `0x565efb...5998` in seconds.
  * Run in terminal: `pnpm tsx scripts/send-dust.ts` (injecting a 1 MIST dust transfer).
  * Copy the lookalike address, switch to `/`, paste it into the check box, and click **"Check Address"**.
  * **Screen turns dramatic RED.**
  * Highlight the visual character comparison box showing matching green prefix `0x565` and suffix `8`, with the fake middle highlighted in red.
* **Voiceover:**
  > *"Now watch what happens during an actual attack. An attacker uses a key grinder to generate a lookalike address matching the first characters of Ada's wallet, then sends a 1 MIST dust transaction into our history.*
  > 
  > *If I were copying from my wallet history, I would lose everything right now. But I paste it into Known.*
  > 
  > *Instant RED alert! Known catches the lookalike: 'This imitates Ada Sister. Same start and end characters, fake middle. It sent you an inbound dust transaction.' The scam is caught before the money ever leaves."*

---

### Scene 4: The Real Payee (1:40 – 2:10)

* **Visual on Screen:** 
  * Paste Ada's genuine address (`0x565c34749525e936c4e43615f48c15f34031f18061d2f85df923032ca5864a38`).
  * Enter Amount: `50` SUI. Click **"Check Address"**.
  * **Screen turns bright GREEN.**
  * Highlight the **Walrus Memory Recall Context** card with the pulsing green indicator: *"Ada Sister on SUI: confirmed payee. Paid 14 times, usually 50–200 USDC."*
  * Change amount to `5000` SUI. Show the amber anomaly warning: *"Amount ($5,000) is far outside your typical pattern for Ada."*
* **Voiceover:**
  > *"Now we paste Ada's real address. Instant GREEN!*
  > 
  > *Notice the Walrus Memory recall box: 'This is Ada Sister. You have paid her 14 times.'*
  > 
  > *Known also performs pure BigInt anomaly detection: if an attacker tries to trick you into sending $5,000 when you usually send under $200, Known flags the unusual amount immediately."*

---

### Scene 5: AI Agent Pre-Flight Check (2:10 – 2:40)

* **Visual on Screen:** 
  * Switch to terminal. Run: `pnpm tsx scripts/agent-demo.ts`
  * Show the autonomous AI payment agent executing its pre-flight check.
  * Step 1: Agent checks copied lookalike address -> `POST /api/agent/check` returns `allowed: false, verdict: "red"` -> Agent aborts payment with red alert.
  * Step 2: Agent checks genuine address -> `allowed: true, verdict: "green"` -> Agent approves payment.
* **Voiceover:**
  > *"For our submission to the Best Use of Agent Payments track: AI agents moving treasury funds autonomously cannot eyeball an address. If their history is poisoned, an agent will blindly send millions to an attacker.*
  > 
  > *Known provides a dedicated Agent API: `POST /api/agent/check`.*
  > 
  > *Here, our autonomous agent attempts to pay a vendor. It queries Known before broadcasting. Known detects the poisoned lookalike, responds with `allowed: false`, and the agent aborts the transaction—saving fifty SUI from theft before safely paying the verified recipient."*

---

### Scene 6: Zero-DB Sovereign Restoration (2:40 – 3:00)

* **Visual on Screen:** 
  * Switch to `/proof` dashboard: show Tatum Sui Gateway checkpoint number syncing live and Walrus Memory outbox jobs.
  * Switch to clean terminal. Run: `pnpm tsx tools/restore/src/index.ts --user-id 00000000-0000-0000-0000-000000000001`
  * Watch the CLI fetch memories directly from Walrus Memory and print the restored payee directory with zero database connection.
* **Voiceover:**
  > *"Finally, for Best Walrus Memory: your payee list is never trapped in a database. Switch wallets, lose your phone, or if Known shuts down—our standalone restore tool reads directly from Walrus Memory on Sui mainnet to reconstruct your verified payees.*
  > 
  > *Known: Your transaction history can be poisoned. Your memory can't. Thank you!"*

---

## 🛠️ Rehearsal Checklist Before Recording

1. Start local dev server: `pnpm --filter @known/web run dev`
2. Ensure database migrations are run: `pnpm tsx scripts/test-phase2-import.ts`
3. Have terminal windows pre-sized and ready for `scripts/make-lookalike.ts` and `scripts/agent-demo.ts`.
4. Keep the `/proof` dashboard open in another tab to showcase live Tatum checkpoints and Walrus Memory health.
