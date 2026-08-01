import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";
const COOKIE_NAME = "proofhire_token";
const REFRESH_COOKIE_NAME = "proofhire_refresh";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
  }
  const res = await fetch(`${BACKEND}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) {
    const response = NextResponse.json(data, { status: res.status });
    response.cookies.delete(COOKIE_NAME);
    response.cookies.delete(REFRESH_COOKIE_NAME);
    return response;
  }
  const response = NextResponse.json(data, { status: 200 });
  response.cookies.set(COOKIE_NAME, data.access_token, cookieOptions);
  response.cookies.set(REFRESH_COOKIE_NAME, data.refresh_token, cookieOptions);
  return response;
}