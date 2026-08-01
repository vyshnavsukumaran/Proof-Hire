import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";
const COOKIE_NAME = "proofhire_token";
const REFRESH_COOKIE_NAME = "proofhire_refresh";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${BACKEND}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  const opts = cookieOptions(request.url.startsWith("https://"));
  const response = NextResponse.json(data, { status: 201 });
  response.cookies.set(COOKIE_NAME, data.access_token, opts);
  response.cookies.set(REFRESH_COOKIE_NAME, data.refresh_token, opts);
  return response;
}