import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";
const COOKIE_NAME = "proofhire_token";
const REFRESH_COOKIE_NAME = "proofhire_refresh";

type Context = { params: Promise<{ path: string[] }> };

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

async function refreshTokens(): Promise<{ access: string; refresh: string } | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) return null;
  const res = await fetch(`${BACKEND}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { access: data.access_token, refresh: data.refresh_token };
}

async function proxy(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const pathname = `/api/${path.join("/")}`;
  const target = new URL(pathname, BACKEND);
  request.nextUrl.searchParams.forEach((value, key) =>
    target.searchParams.set(key, value)
  );

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  try {
    let res = await fetch(target.toString(), {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    let freshTokens: { access: string; refresh: string } | null = null;
    if (res.status === 401 && pathname !== "/api/auth/login" && pathname !== "/api/auth/refresh") {
      freshTokens = await refreshTokens();
      if (freshTokens) {
        const newHeaders = new Headers(headers);
        newHeaders.set("Authorization", `Bearer ${freshTokens.access}`);
        res = await fetch(target.toString(), {
          method: request.method,
          headers: newHeaders,
          body,
          cache: "no-store",
        });
      }
    }

    const contentType = res.headers.get("content-type") ?? "";
    let response: NextResponse;
    if (contentType.includes("application/json")) {
      response = NextResponse.json(await res.json(), { status: res.status });
    } else {
      response = new NextResponse(await res.arrayBuffer(), {
        status: res.status,
        headers: { "content-type": contentType },
      });
    }
    if (freshTokens) {
      response.cookies.set(COOKIE_NAME, freshTokens.access, cookieOptions);
      response.cookies.set(REFRESH_COOKIE_NAME, freshTokens.refresh, cookieOptions);
    }
    return response;
  } catch {
    return NextResponse.json(
      { detail: "Backend unreachable. Is the FastAPI server running?" },
      { status: 502 }
    );
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
