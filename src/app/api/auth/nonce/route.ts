import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function GET() {
  const nonce = `Sign this message to login to SolPredict: ${nanoid()}`;
  return NextResponse.json({ status: "success", data: { nonce } });
}
