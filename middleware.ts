import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

function limitFor(pathname: string, method: string) {
  if (method === "GET") return pathname.startsWith("/api/admin") ? 180 : 300;
  if (pathname.includes("/login") || pathname.includes("/register")) return 12;
  if (pathname.includes("/uploads") || pathname.includes("/messages")) return 30;
  if (pathname.includes("/payments") || pathname.includes("/wallet")) return 40;
  return 90;
}

function rateLimit(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api")) return null;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const key = `${ip}:${request.method}:${pathname.split("/").slice(0, 4).join("/")}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  current.count += 1;
  if (buckets.size > 2_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  if (current.count > limitFor(pathname, request.method)) {
    return NextResponse.json(
      { error: { message: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi." } },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((current.resetAt - now) / 1000))
        }
      }
    );
  }

  return null;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self), payment=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src https://www.google.com https://maps.google.com",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  );
}

function applyAppBoundaryHeaders(request: NextRequest, response: NextResponse) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/customer")) {
    response.headers.set("X-SERJAFAN-App", "customer");
  } else if (pathname.startsWith("/partner")) {
    response.headers.set("X-SERJAFAN-App", "partner");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  } else if (pathname.startsWith("/admin")) {
    response.headers.set("X-SERJAFAN-App", "admin");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
}

export function middleware(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) {
    applySecurityHeaders(limited);
    applyAppBoundaryHeaders(request, limited);
    return limited;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  applyAppBoundaryHeaders(request, response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
