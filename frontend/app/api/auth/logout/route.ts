import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "proofhire_token";
const REFRESH_COOKIE_NAME = "proofhire_refresh";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const has = cookieStore.has(COOKIE_NAME);
  return NextResponse.json({ authenticated: has });
}
