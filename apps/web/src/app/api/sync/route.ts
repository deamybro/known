import { NextResponse } from "next/server";
import { processOutbox } from "@known/memory";
import { createDrizzleOutboxAdapter } from "@/lib/outbox-adapter";

export async function POST() {
  try {
    const adapter = createDrizzleOutboxAdapter();
    const result = await processOutbox(adapter);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Outbox sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
