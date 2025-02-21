// app/api/test-env/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    has_alltius_key: !!process.env.ALLTIUS_API_KEY,
    has_assistant_id: !!process.env.ALLTIUS_ASSISTANT_ID,
    key_prefix: process.env.ALLTIUS_API_KEY ? process.env.ALLTIUS_API_KEY.substring(0, 4) + "..." : "not found"
  });
}