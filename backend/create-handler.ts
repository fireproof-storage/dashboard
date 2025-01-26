import { verifyToken } from "@clerk/backend";
import { SuperThis, Result, ensureSuperThis } from "use-fireproof";
import { FPApiToken, FPApiSQL, FPAPIMsg } from "./api.ts";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { VerifiedAuth } from "./users.ts";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT,DELETE",
  "Access-Control-Max-Age": "86400",
};

interface ClerkTemplate {
  readonly app_metadata: {};
  readonly azp: string;
  readonly exp: number;
  readonly iat: number;
  readonly iss: string;
  readonly jti: string;
  readonly nbf: number;
  readonly role: string;
  readonly sub: string;
  readonly params: {
    readonly email: string;
    readonly first: string;
    readonly last: string;
    readonly name: null;
  };
}

class ClerkApiToken implements FPApiToken {
  readonly sthis: SuperThis;
  constructor(sthis: SuperThis) {
    this.sthis = sthis;
  }
  async verify(token: string): Promise<Result<VerifiedAuth>> {
    const t = (await verifyToken(token, {
      audience: "http://localhost:5173",
      // issuer: 'https://trusted-glowworm-5.clerk.accounts.dev',
      secretKey: "sk_test_In7uA3eMUvywLuUybkNZNAMdMTSiWUdT38KrPZzerr",
    })) as unknown as ClerkTemplate;
    if (!t) {
      return Result.Err("Invalid token");
    }
    // console.log(t);
    return Result.Ok({
      type: "clerk",
      token,
      userId: t.sub,
      provider: "TBD",
      params: {
        ...t.params,
      },
    });
  }
}

export function createHandler<T extends LibSQLDatabase>(db: T) {
  const sthis = ensureSuperThis();
  const fpApi = new FPApiSQL(sthis, db, new ClerkApiToken(sthis));
  return async (req: Request): Promise<Response> => {
    const out = {} as {
      ensureUserRef: unknown;
      listTenantsByUser: unknown;
    };
    const jso = await req.json();
    // console.log(jso);
    let res: Promise<Result<unknown>>;
    switch (true) {
      case FPAPIMsg.isDeleteTenant(jso):
        res = fpApi.deleteTenant(jso);
        break;
      case FPAPIMsg.isUpdateTenant(jso):
        res = fpApi.updateTenant(jso);
        break;
      case FPAPIMsg.isCreateTenant(jso):
        res = fpApi.createTenant(jso);
        break;
      case FPAPIMsg.isDeleteInvite(jso):
        res = fpApi.deleteInvite(jso);
        break;
      case FPAPIMsg.isListInvites(jso):
        res = fpApi.listInvites(jso);
        break;
      case FPAPIMsg.isInviteUser(jso):
        res = fpApi.inviteUser(jso);
        break;
      case FPAPIMsg.isFindUser(jso):
        res = fpApi.findUser(jso);
        break;
      case FPAPIMsg.isConnectUserToTenant(jso):
        res = fpApi.connectUserToTenant(jso);
        break;
      case FPAPIMsg.isEnsureUser(jso):
        res = fpApi.ensureUser(jso);
        break;
      case FPAPIMsg.isListTenantsByUser(jso):
        res = fpApi.listTenantsByUser(jso);
        break;
      case FPAPIMsg.isUpdateUserTenant(jso):
        res = fpApi.updateUserTenant(jso);
        break;
      default:
        return new Response("Invalid request", { status: 400, headers: CORS });
    }
    const rRes = await res;
    // console.log("Response", rRes);
    if (rRes.isErr()) {
      return new Response(
        JSON.stringify({
          type: "error",
          message: rRes.Err().message,
        }),
        { status: 500, headers: CORS },
      );
    }
    return new Response(JSON.stringify(rRes.Ok()), { status: 200, headers: CORS });
  };
}
