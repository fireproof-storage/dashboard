import { drizzle } from "drizzle-orm/d1";
import { D1Database, Fetcher, Request as CFRequest, Response as CFResponse } from "@cloudflare/workers-types";
import { CORS, createHandler } from "./create-handler.ts";
import { URI } from "@adviser/cement";

export interface Env {
  DB: D1Database;
  // CLERK_SECRET_KEY: string;
  ASSETS: Fetcher;
  /** ES256 public JWK used to verify Fireproof session tokens */
  CLOUD_SESSION_TOKEN_PUBLIC: string;
}
export default {
  async fetch(request: Request, env: Env) {
    const uri = URI.from(request.url);
    let ares: Promise<CFResponse>;
    switch (true) {
      // Well-known JWKS endpoint for public verification keys
      case uri.pathname === "/.well-known/jwks.json": {
        const jwkRaw = env.CLOUD_SESSION_TOKEN_PUBLIC;
        let body: string;
        let status = 200;
        try {
          const jwk = JSON.parse(jwkRaw);
          body = JSON.stringify({ keys: [jwk] });
        } catch {
          body = "Invalid CLOUD_SESSION_TOKEN_PUBLIC";
          status = 500;
        }
        const cfRes = new Response(body, {
          status,
          headers: {
            "content-type": "application/json",
            ...CORS,
          },
        }) as unknown as CFResponse;
        ares = Promise.resolve(cfRes);
        break;
      }

      case uri.pathname.startsWith("/api"):
        // console.log("cf-serve", request.url, env);
        ares = createHandler(drizzle(env.DB), env)(request) as unknown as Promise<CFResponse>;
        break;

      case uri.pathname.startsWith("/fp-logo.svg"):
      case uri.pathname.startsWith("/assets/"):
        ares = env.ASSETS.fetch(request as unknown as CFRequest);
        break;
      default:
        ares = env.ASSETS.fetch(uri.build().pathname("/").asURL(), request as unknown as CFRequest);
    }
    const res = await ares;
    return new Response(res.body as ReadableStream<Uint8Array>, {
      status: res.status,
      statusText: res.statusText,
      headers: {
        ...res.headers,
        ...CORS,
      },
    });
  },
};
