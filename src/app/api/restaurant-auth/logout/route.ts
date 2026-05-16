import { NextResponse } from "next/server";
import { clearRestaurantSessionCookie } from "@/lib/restaurant-session";

export async function POST() {
  await clearRestaurantSessionCookie();

  return NextResponse.json({
    ok: true,
  });
}