import { NextResponse } from "next/server";
import { getWebPushPublicKey, isWebPushConfigured } from "@/lib/web-push";

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: isWebPushConfigured(),
    publicKey: getWebPushPublicKey(),
  });
}
