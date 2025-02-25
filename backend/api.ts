import { Result } from "@adviser/cement";
import { SuperThis } from "@fireproof/core";
import { and, eq, gt, inArray, lt, ne, or } from "drizzle-orm/expressions";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { InviteTicket, InvitedParams, prepareInviteTicket, sqlInviteTickets, sqlToInviteTickets } from "./invites.ts";
import { LedgerUser, sqlLedgerUsers, sqlLedgers, sqlToLedgers } from "./ledgers.ts";
import { QueryUser, queryCondition, queryEmail, queryNick, toBoolean, toUndef } from "./sql-helper.ts";
import { Tenant, sqlTenantUsers, sqlTenants } from "./tenants.ts";
import {
  AuthType,
  ClerkClaim,
  ClerkVerifyAuth,
  User,
  UserNotFoundError,
  UserStatus,
  VerifiedAuth,
  getUser,
  isUserNotFound,
  queryUser,
  upsetUserByProvider,
} from "./users.ts";
import { env2jwk } from "./jwk-helper.ts";
import { SignJWT } from "jose";

export interface ReqEnsureUser {
  readonly type: "reqEnsureUser";
  readonly auth: AuthType;
}

interface RoleBase {
  readonly tenantId?: string;
  readonly ledgerId?: string;
  readonly userId: string;
  readonly role: Role;
  readonly adminUserIds: string[];
  readonly memberUserIds: string[];
}

interface TenantRole extends RoleBase {
  readonly tenantId: string;
}

interface LedgerRole extends RoleBase {
  readonly ledgerId: string;
  readonly right: "read" | "write";
}

type RoleType = TenantRole | LedgerRole;

// export interface TenantUser {
//     readonly userId: string;
//     readonly tenantId: string;
//     readonly name: string;
//     readonly active: boolean; // active for this user
// }

export interface ResEnsureUser {
  readonly type: "resEnsureUser";
  readonly user: User;
  readonly tenants: UserTenant[];
}

// export interface Tenant {
//   readonly tenantId: string;
//   readonly name: string;
//   readonly ownerUserId: string;
//   // null means don't change
//   readonly adminUserIds?: string[];
//   readonly memberUserIds?: string[];
//   readonly maxAdminUsers?: number;
//   readonly maxMemberUsers?: number;
// }

// export interface ReqEnsureTenant {
//   readonly type: "reqEnsureTenant";
//   readonly auth: AuthType;
//   readonly tenant: Omit<InsertTenantParam, "tenantId"> & { readonly tenantId?: string };
// }

export interface ResDeleteTenant {
  readonly type: "resDeleteTenant";
  readonly tenantId: string;
}

export interface ReqDeleteTenant {
  readonly type: "reqDeleteTenant";
  readonly auth: AuthType;
  readonly tenantId: string;
}

export interface OutTenantParams {
  readonly tenantId: string;
  readonly name: string;
  readonly ownerUserId: string;
  readonly maxAdminUsers: number;
  readonly maxMemberUsers: number;
  readonly maxInvites: number;
  readonly maxLedgers: number;
  readonly status: UserStatus;
  readonly statusReason: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

function sqlToOutTenantParams(sql: typeof sqlTenants.$inferSelect): OutTenantParams {
  return {
    tenantId: sql.tenantId,
    name: sql.name,
    ownerUserId: sql.ownerUserId,
    maxAdminUsers: sql.maxAdminUsers,
    maxMemberUsers: sql.maxMemberUsers,
    maxLedgers: sql.maxLedgers,
    maxInvites: sql.maxInvites,
    status: sql.status as UserStatus,
    statusReason: sql.statusReason,
    createdAt: new Date(sql.createdAt),
    updatedAt: new Date(sql.updatedAt),
  };
}

export interface ResCreateTenant {
  readonly type: "resCreateTenant";
  readonly tenant: OutTenantParams;
}

export interface InCreateTenantParams {
  readonly name?: string;
  readonly ownerUserId: string;
  readonly maxAdminUsers?: number;
  readonly maxMemberUsers?: number;
  readonly maxInvites?: number;
}

export interface ReqCreateTenant {
  readonly type: "reqCreateTenant";
  readonly auth: AuthType;
  readonly tenant: Omit<InCreateTenantParams, "ownerUserId">;
}

export interface InUpdateTenantParams {
  readonly tenantId: string;
  readonly name?: string;
  readonly maxAdminUsers?: number;
  readonly maxMemberUsers?: number;
  readonly maxInvites?: number;
}

export interface ResUpdateTenant {
  readonly type: "resUpdateTenant";
  readonly tenant: OutTenantParams;
}

export interface ReqUpdateTenant {
  readonly type: "reqUpdateTenant";
  readonly auth: AuthType;
  readonly tenant: InUpdateTenantParams;
}

export interface ResEnsureTenant {
  readonly type: "resEnsureTenant";
  readonly tenant: Tenant;
}

export interface ReqRedeemInvite {
  readonly type: "reqRedeemInvite";
  readonly auth: AuthType;
  // readonly query: QueryUser;
}

export interface ResRedeemInvite {
  readonly type: "resRedeemInvite";
  readonly invites?: InviteTicket[];
}

export interface ReqListLedgersByUser {
  readonly type: "reqListLedgersByUser";
  readonly auth: AuthType;
  readonly tenantIds?: string[];
}

export interface ResListLedgersByUser {
  readonly type: "resListLedgersByUser";
  readonly userId: string;
  readonly ledgers: LedgerUser[];
}

export interface ReqAttachUserToLedger {
  readonly type: "reqAttachUserToLedger";
  readonly auth: AuthType;
  readonly tenantId: string;
  readonly ledgerId: string;
  readonly userId: string;
  readonly role: "read" | "write";
}

export interface ResAttachUserToLedger {
  readonly type: "resAttachUserToLedger";
  readonly tenantId: string;
  readonly ledgerId: string;
  readonly userId: string;
  readonly role: "read" | "write";
}

export interface ReqListTenantsByUser {
  readonly type: "reqListTenantsByUser";
  readonly auth: AuthType;
}

export interface UserTenantCommon {
  readonly name?: string;
  readonly status: UserStatus;
  readonly statusReason: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface UserTenant {
  readonly tenantId: string;
  readonly role: Role;
  readonly default: boolean;
  readonly user: UserTenantCommon;
  readonly tenant: UserTenantCommon;
}

export function isAdmin(ut: UserTenant) {
  return ut.role === "admin";
}

export interface AdminTenant extends UserTenant {
  readonly role: "admin"; // | "owner";
  readonly adminUserIds: string[];
  readonly memberUserIds: string[];
  readonly maxAdminUsers: number;
  readonly maxMemberUsers: number;
}

export interface ResListTenantsByUser {
  readonly type: "resListTenantsByUser";
  readonly userId: string;
  readonly authUserId: string;
  readonly tenants: UserTenant[];
}

// export type AuthProvider = "github" | "google" | "fp";

export interface ReqFindUser {
  readonly type: "reqFindUser";
  readonly auth: AuthType;
  readonly query: QueryUser;
}

// export interface QueryResultUser {
//   readonly userId: string;
//   readonly authProvider: AuthProvider;
//   readonly email?: string;
//   readonly nick?: string;
//   readonly status: UserStatus;
//   readonly createdAt: Date;
//   readonly updatedAt: Date;
// }

export interface ResFindUser {
  readonly type: "resFindUser";
  // readonly userId: string;
  // readonly authUserId: string;
  readonly query: QueryUser;
  readonly results: User[];
}

export interface QueryInviteTicket {
  readonly incSendEmailCount?: boolean;

  // indicate update or insert
  readonly inviteId?: string;
  readonly query: QueryUser;

  // readonly invitedTenantId?: string;
  // readonly invitedLedgerId?: string;
  readonly invitedParams: InvitedParams;
}

export interface ReqInviteUser {
  readonly type: "reqInviteUser";
  readonly auth: AuthType;
  readonly ticket: QueryInviteTicket; // InviteTicket & { readonly incSendEmailCount?: boolean }
}

export interface ResInviteUser {
  readonly type: "resInviteUser";
  readonly invite: InviteTicket;
}

export interface ReqDeleteInvite {
  readonly type: "reqDeleteInvite";
  readonly auth: AuthType;
  readonly inviteId: string;
}

export interface ResDeleteInvite {
  readonly type: "resDeleteInvite";
  readonly inviteId: string;
}

export interface ReqListInvites {
  readonly type: "reqListInvites";
  readonly auth: AuthType;
  // if set all invites for the given tenants are listed
  // if not set all invites for the user are listed
  readonly tenantIds?: string[];
  readonly ledgerIds?: string[];
}

export interface ResListInvites {
  readonly type: "resListInvites";
  readonly tickets: InviteTicket[];
}

export interface ReqUpdateUserTenant {
  readonly type: "reqUpdateUserTenant";
  readonly auth: AuthType;
  readonly tenantId: string;
  readonly userId?: string;
  readonly role?: Role; // only if admin
  readonly default?: boolean;
  readonly name?: string;
}

export interface ResUpdateUserTenant {
  readonly type: "resUpdateUserTenant";
  readonly tenantId: string;
  readonly userId: string;
  readonly role: Role;
  readonly default: boolean;
  readonly name?: string;
}

export interface CreateLedger {
  readonly tenantId: string;
  readonly name: string;
}

export interface ReqCreateLedger {
  readonly type: "reqCreateLedger";
  readonly auth: AuthType;
  readonly ledger: CreateLedger;
}

export interface ResCreateLedger {
  readonly type: "resCreateLedger";
  readonly ledger: LedgerUser;
}

export interface UpdateLedger {
  readonly ledgerId: string;
  readonly tenantId: string;
  readonly right?: "read" | "write";
  readonly role?: "admin" | "member";
  readonly name?: string;
  readonly default?: boolean;
}

export interface ReqUpdateLedger {
  readonly type: "reqUpdateLedger";
  readonly auth: AuthType;
  readonly ledger: UpdateLedger;
}
export interface ResUpdateLedger {
  readonly type: "resUpdateLedger";
  readonly ledger: LedgerUser;
}

export interface DeleteLedger {
  readonly ledgerId: string;
  readonly tenantId: string;
}

export interface ReqDeleteLedger {
  readonly type: "reqDeleteLedger";
  readonly auth: AuthType;
  readonly ledger: DeleteLedger;
}
export interface ResDeleteLedger {
  readonly type: "resDeleteLedger";
}

export interface ReqCloudSessionToken {
  readonly type: "reqCloudSessionToken";
  readonly auth: AuthType;
}

export interface ResCloudSessionToken {
  readonly type: "resCloudSessionToken";
  readonly token: string; // JWT
}

export interface FPApiInterface {
  ensureUser(req: ReqEnsureUser): Promise<Result<ResEnsureUser>>;
  findUser(req: ReqFindUser): Promise<Result<ResFindUser>>;

  createTenant(req: ReqCreateTenant): Promise<Result<ResCreateTenant>>;
  updateTenant(req: ReqUpdateTenant): Promise<Result<ResUpdateTenant>>;
  deleteTenant(req: ReqDeleteTenant): Promise<Result<ResDeleteTenant>>;

  redeemInvite(req: ReqRedeemInvite): Promise<Result<ResRedeemInvite>>;

  listTenantsByUser(req: ReqListTenantsByUser): Promise<Result<ResListTenantsByUser>>;
  updateUserTenant(req: ReqUpdateUserTenant): Promise<Result<ResUpdateUserTenant>>;

  // creates / update invite
  inviteUser(req: ReqInviteUser): Promise<Result<ResInviteUser>>;
  listInvites(req: ReqListInvites): Promise<Result<ResListInvites>>;
  deleteInvite(req: ReqDeleteInvite): Promise<Result<ResDeleteInvite>>;

  createLedger(req: ReqCreateLedger): Promise<Result<ResCreateLedger>>;
  listLedgersByUser(req: ReqListLedgersByUser): Promise<Result<ResListLedgersByUser>>;
  updateLedger(req: ReqUpdateLedger): Promise<Result<ResUpdateLedger>>;
  deleteLedger(req: ReqDeleteLedger): Promise<Result<ResDeleteLedger>>;

  // listLedgersByTenant(req: ReqListLedgerByTenant): Promise<ResListLedgerByTenant>

  // attachUserToLedger(req: ReqAttachUserToLedger): Promise<ResAttachUserToLedger>
  getCloudSessionToken(req: ReqCloudSessionToken): Promise<Result<ResCloudSessionToken>>;
}

interface FPApiMsgInterface {
  isDeleteTenant(jso: unknown): jso is ReqDeleteTenant;
  isUpdateTenant(jso: unknown): jso is ReqUpdateTenant;
  isCreateTenant(jso: unknown): jso is ReqCreateTenant;
  isDeleteInvite(jso: unknown): jso is ReqDeleteInvite;
  isListInvites(jso: unknown): jso is ReqListInvites;
  isInviteUser(jso: unknown): jso is ReqInviteUser;
  isFindUser(jso: unknown): jso is ReqFindUser;
  isRedeemInvite(jso: unknown): jso is ReqRedeemInvite;
  isEnsureUser(jso: unknown): jso is ReqEnsureUser;
  isListTenantsByUser(jso: unknown): jso is ReqListTenantsByUser;
  isUpdateUserTenant(jso: unknown): jso is ReqUpdateUserTenant;
}

class FAPIMsgImpl implements FPApiMsgInterface {
  isDeleteTenant(jso: unknown): jso is ReqDeleteTenant {
    return (jso as ReqDeleteTenant).type === "reqDeleteTenant";
  }
  isUpdateTenant(jso: unknown): jso is ReqUpdateTenant {
    return (jso as ReqUpdateTenant).type === "reqUpdateTenant";
  }
  isCreateTenant(jso: unknown): jso is ReqCreateTenant {
    return (jso as ReqCreateTenant).type === "reqCreateTenant";
  }
  isDeleteInvite(jso: unknown): jso is ReqDeleteInvite {
    return (jso as ReqDeleteInvite).type === "reqDeleteInvite";
  }
  isListInvites(jso: unknown): jso is ReqListInvites {
    return (jso as ReqListInvites).type === "reqListInvites";
  }
  isInviteUser(jso: unknown): jso is ReqInviteUser {
    return (jso as ReqInviteUser).type === "reqInviteUser";
  }
  isFindUser(jso: unknown): jso is ReqFindUser {
    return (jso as ReqFindUser).type === "reqFindUser";
  }
  isRedeemInvite(jso: unknown): jso is ReqRedeemInvite {
    return (jso as ReqRedeemInvite).type === "reqRedeemInvite";
  }
  isEnsureUser(jso: unknown): jso is ReqEnsureUser {
    return (jso as ReqEnsureUser).type === "reqEnsureUser";
  }

  isListTenantsByUser(jso: unknown): jso is ReqListTenantsByUser {
    return (jso as ReqListTenantsByUser).type === "reqListTenantsByUser";
  }
  isUpdateUserTenant(jso: unknown): jso is ReqUpdateUserTenant {
    return (jso as ReqUpdateUserTenant).type === "reqUpdateUserTenant";
  }
  isListLedgersByUser(jso: unknown): jso is ReqListLedgersByUser {
    return (jso as ReqListLedgersByUser).type === "reqListLedgersByUser";
  }

  isCreateLedger(jso: unknown): jso is ReqCreateLedger {
    return (jso as ReqCreateLedger).type === "reqCreateLedger";
  }
  isUpdateLedger(jso: unknown): jso is ReqUpdateLedger {
    return (jso as ReqUpdateLedger).type === "reqUpdateLedger";
  }
  isDeleteLedger(jso: unknown): jso is ReqDeleteLedger {
    return (jso as ReqDeleteLedger).type === "reqDeleteLedger";
  }

  isCloudSessionToken(jso: unknown): jso is ReqCloudSessionToken {
    return (jso as ReqCloudSessionToken).type === "reqCloudSessionToken";
  }
}

export const FPAPIMsg = new FAPIMsgImpl();

export interface FPApiToken {
  verify(token: string): Promise<Result<VerifiedAuth>>;
}

interface ReqInsertTenant {
  readonly tenantId: string;
  readonly name?: string;
  readonly ownerUserId: string;
  readonly adminUserIds?: string[];
  readonly memberUserIds?: string[];
  readonly maxAdminUsers?: number;
  readonly maxMemberUsers?: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// interface ResInsertTenant {
//     readonly tenantId: string;
//     readonly name?: string;
//     readonly ownerUserId: string;
//     readonly adminUserIds: string[];
//     readonly memberUserIds: string[];
//     readonly maxAdminUsers: number;
//     readonly maxMemberUsers: number;
//     readonly createdAt: Date;
//     readonly updatedAt: Date;
// }

// interface ReqInsertUser {
//   readonly userId: string;
//   readonly auth: ClerkVerifyAuth;
//   readonly maxTenants?: number;
//   readonly createdAt?: Date;
//   readonly updatedAt?: Date;
// }

type Role = "admin" | "member"; // | "owner";

interface AddUserToTenant {
  readonly userName?: string;
  readonly tenantName?: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly default?: boolean;
  readonly role: Role;
  readonly status?: UserStatus;
  readonly statusReason?: string;
}

interface AddUserToLedger {
  readonly userName?: string;
  readonly ledgerName?: string;
  readonly ledgerId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly default?: boolean;
  readonly status?: UserStatus;
  readonly statusReason?: string;
  readonly role: Role;
  readonly right: "read" | "write";
}

// interface ResAddUserToTenant {
//   readonly name?: string;
//   readonly tenantId: string;
//   readonly userId: string;
//   readonly default: boolean;
//   readonly role: Role;
// }

// type SQLTransaction = SQLiteTransaction<
//   "async",
//   ResultSet,
//   Record<string, never>,
//   ExtractTablesWithRelations<Record<string, never>>
// >;

interface WithAuth {
  readonly auth: AuthType;
}

interface ActiveUser<T extends AuthType = ClerkVerifyAuth> {
  readonly verifiedAuth: T;
  readonly user?: User;
}

type ActiveUserWithUserId<T extends AuthType = ClerkVerifyAuth> = Omit<ActiveUser<ClerkVerifyAuth>, "user"> & {
  user: {
    userId: string;
    maxTenants: number;
  };
};

function nameFromAuth(name: string | undefined, auth: ActiveUserWithUserId): string {
  return name ?? `${auth.verifiedAuth.params.email ?? nickFromClarkClaim(auth.verifiedAuth.params) ?? auth.verifiedAuth.userId}`;
}

function nickFromClarkClaim(auth: ClerkClaim): string | undefined {
  return auth.nick ?? auth.name;
}

export class FPApiSQL implements FPApiInterface {
  readonly db: LibSQLDatabase;
  readonly tokenApi: Record<string, FPApiToken>;
  readonly sthis: SuperThis;
  constructor(sthis: SuperThis, db: LibSQLDatabase, token: Record<string, FPApiToken>) {
    this.db = db;
    this.tokenApi = token;
    this.sthis = sthis;
  }

  private async _authVerifyAuth(req: { readonly auth: AuthType }): Promise<Result<ClerkVerifyAuth>> {
    const tokenApi = this.tokenApi[req.auth.type];
    if (!tokenApi) {
      return Result.Err(`invalid auth type:[${req.auth.type}]`);
    }
    const rAuth = await tokenApi.verify(req.auth.token);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    // if (rAuth.Ok().type !== "clerk") {
    //   return Result.Err("invalid auth type");
    // }
    const auth = rAuth.Ok() as ClerkVerifyAuth;
    return Result.Ok(auth);
  }

  private async activeUser(req: WithAuth, status: UserStatus[] = ["active"]): Promise<Result<ActiveUser>> {
    const rAuth = await this._authVerifyAuth(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    const rExisting = await getUser(this.db, auth.userId);
    if (rExisting.isErr()) {
      if (isUserNotFound(rExisting)) {
        return Result.Ok({
          verifiedAuth: auth,
        });
      }
      return Result.Err(rExisting.Err());
    }
    return Result.Ok({
      verifiedAuth: auth,
      user: rExisting.Ok(),
    });
  }

  async ensureUser(req: ReqEnsureUser): Promise<Result<ResEnsureUser>> {
    const activeUser = await this.activeUser(req);
    if (activeUser.isErr()) {
      return Result.Err(activeUser.Err());
    }
    const user = activeUser.Ok().user;
    if (!user) {
      const auth = activeUser.Ok().verifiedAuth;
      const userId = this.sthis.nextId(12).str;
      const now = new Date();
      await upsetUserByProvider(
        this.db,
        {
          userId,
          maxTenants: 10,
          status: "active",
          statusReason: "just created",
          byProviders: [
            {
              providerUserId: auth.userId,
              queryProvider: nickFromClarkClaim(auth.params) ? "github" : "google",
              queryEmail: queryEmail(auth.params.email),
              cleanEmail: auth.params.email,
              queryNick: queryNick(nickFromClarkClaim(auth.params)),
              cleanNick: nickFromClarkClaim(auth.params),
              params: auth.params,
              used: now,
            },
          ],
        },
        now,
      );
      const authWithUserId = {
        ...activeUser.Ok(),
        user: {
          userId,
          maxTenants: 10,
        },
      };
      const rTenant = await this.insertTenant(authWithUserId, {
        ownerUserId: userId,
        maxAdminUsers: 5,
        maxMemberUsers: 5,
      });
      const res = await this.addUserToTenant(this.db, {
        userName: nameFromAuth(undefined, authWithUserId),
        tenantId: rTenant.Ok().tenantId,
        userId: userId,
        role: "admin",
        default: true,
      });

      // });
      return this.ensureUser(req);
    }
    return Result.Ok({
      type: "resEnsureUser",
      user: user,
      tenants: await this.listTenantsByUser({
        type: "reqListTenantsByUser",
        auth: req.auth,
      }).then((r) => r.Ok().tenants),
    });
  }

  private async addUserToTenant(db: LibSQLDatabase, req: Omit<AddUserToTenant, "tenantName">): Promise<Result<AddUserToTenant>> {
    const tenant = await db
      .select()
      .from(sqlTenants)
      .where(and(eq(sqlTenants.tenantId, req.tenantId), eq(sqlTenants.status, "active")))
      .get();
    if (!tenant) {
      return Result.Err("tenant not found");
    }
    const roles = await this.getRoles(req.userId, [tenant], []);
    if (roles.length > 1) {
      return Result.Err("multiple roles found");
    }
    if (roles.length && roles[0].role) {
      const tenantUser = await db
        .select()
        .from(sqlTenantUsers)
        .where(
          and(
            eq(sqlTenantUsers.tenantId, req.tenantId),
            eq(sqlTenantUsers.userId, req.userId),
            eq(sqlTenantUsers.status, "active"),
          ),
        )
        .get();
      if (!tenantUser) {
        return Result.Err("ref not found");
      }
      return Result.Ok({
        userName: toUndef(tenantUser.name),
        tenantName: toUndef(tenant.name),
        tenantId: req.tenantId,
        userId: req.userId,
        default: !!tenantUser.default,
        role: tenantUser.role as Role,
        status: tenantUser.status as UserStatus,
        statusReason: tenantUser.statusReason,
      });
    }
    const rCheck = await this.checkMaxRoles(tenant, req.role);
    if (rCheck.isErr()) {
      return Result.Err(rCheck.Err());
    }
    const now = new Date().toISOString();
    if (req.default) {
      await db
        .update(sqlTenantUsers)
        .set({
          default: 0,
          updatedAt: now,
        })
        .where(and(eq(sqlTenantUsers.userId, req.userId), ne(sqlTenantUsers.default, 0)))
        .run();
    }
    const ret = (
      await db
        .insert(sqlTenantUsers)
        .values({
          tenantId: tenant.tenantId,
          userId: req.userId,
          name: req.userName,
          role: req.role,
          default: req.default ? 1 : 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
    )[0];
    return Result.Ok({
      userName: toUndef(ret.name),
      tenantName: tenant.name,
      tenantId: tenant.tenantId,
      userId: ret.userId,
      default: ret.default ? true : false,
      status: ret.status as UserStatus,
      statusReason: ret.statusReason,
      role: ret.role as Role,
    });
  }

  private async checkMaxRoles(sqlTenant: typeof sqlTenants.$inferSelect, reqRole: string): Promise<Result<void>> {
    const tenantUsers = await this.db
      .select()
      .from(sqlTenantUsers)
      .where(and(eq(sqlTenantUsers.tenantId, sqlTenant.tenantId), eq(sqlTenantUsers.status, "active")))
      .all();
    const ledgerUsers = await this.db
      .select()
      .from(sqlLedgers)
      .innerJoin(sqlLedgerUsers, and(eq(sqlLedgerUsers.ledgerId, sqlLedgers.ledgerId), eq(sqlLedgerUsers.status, "active")))
      .where(eq(sqlLedgers.tenantId, sqlTenant.tenantId))
      .all();
    const adminUsers = new Set([
      ...tenantUsers.filter((tu) => tu.role === "admin"),
      ...ledgerUsers.filter((lu) => lu.LedgerUsers.role === "admin"),
    ]);
    const memberUsers = Array.from(
      new Set([...tenantUsers.filter((tu) => tu.role !== "admin"), ...ledgerUsers.filter((lu) => lu.LedgerUsers.role !== "admin")]),
    ).filter((u) => !adminUsers.has(u));
    if (reqRole === "admin") {
      if (adminUsers.size + 1 >= sqlTenant.maxAdminUsers) {
        return Result.Err("max admins reached");
      }
    }
    if (reqRole !== "admin") {
      if (memberUsers.length + 1 >= sqlTenant.maxMemberUsers) {
        return Result.Err("max members reached");
      }
    }
    return Result.Ok(undefined);
  }

  private async addUserToLedger(db: LibSQLDatabase, req: AddUserToLedger): Promise<Result<AddUserToLedger>> {
    const ledger = await db
      .select()
      .from(sqlLedgers)
      .innerJoin(sqlTenants, and(eq(sqlLedgers.tenantId, sqlTenants.tenantId)))
      .where(and(eq(sqlLedgers.ledgerId, req.ledgerId), eq(sqlLedgers.status, "active")))
      .get();
    if (!ledger) {
      return Result.Err("ledger not found");
    }
    const roles = await this.getRoles(req.userId, [], [ledger.Ledgers]);
    if (roles.length > 1) {
      return Result.Err("multiple roles found");
    }
    if (roles.length && roles[0].role) {
      const ledgerUser = await db
        .select()
        .from(sqlLedgerUsers)
        .innerJoin(sqlLedgers, and(eq(sqlLedgerUsers.ledgerId, sqlLedgers.ledgerId)))
        .where(
          and(
            eq(sqlLedgerUsers.ledgerId, req.ledgerId),
            eq(sqlLedgerUsers.userId, req.userId),
            eq(sqlLedgerUsers.status, "active"),
          ),
        )
        .get();
      if (!ledgerUser) {
        return Result.Err("ref not found");
      }
      return Result.Ok({
        ledgerName: toUndef(ledgerUser.Ledgers.name),
        userName: toUndef(ledgerUser.LedgerUsers.name),
        ledgerId: ledgerUser.Ledgers.ledgerId,
        tenantId: ledgerUser.Ledgers.tenantId,
        userId: req.userId,
        default: !!ledgerUser.LedgerUsers.default,
        status: ledgerUser.LedgerUsers.status as UserStatus,
        statusReason: ledgerUser.LedgerUsers.statusReason,
        role: ledgerUser.LedgerUsers.role as Role,
        right: ledgerUser.LedgerUsers.right as "read" | "write",
      });
    }
    const rCheck = await this.checkMaxRoles(ledger.Tenants, req.role);
    if (rCheck.isErr()) {
      return Result.Err(rCheck.Err());
    }
    const now = new Date().toISOString();
    if (req.default) {
      await db
        .update(sqlLedgerUsers)
        .set({
          default: 0,
          updatedAt: now,
        })
        .where(and(eq(sqlLedgerUsers.userId, req.userId), ne(sqlLedgerUsers.default, 0)))
        .run();
    }
    const ret = (
      await db
        .insert(sqlLedgerUsers)
        .values({
          ledgerId: ledger.Ledgers.ledgerId,
          userId: req.userId,
          name: req.userName,
          role: req.role,
          right: req.right,
          default: req.default ? 1 : 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
    )[0];
    return Result.Ok({
      ledgerName: ledger.Ledgers.name,
      userName: req.userName,
      ledgerId: ledger.Ledgers.ledgerId,
      tenantId: ledger.Ledgers.tenantId,
      status: ret.status as UserStatus,
      statusReason: ret.statusReason,
      userId: req.userId,
      default: req.default ?? false,
      role: ret.role as Role,
      right: ret.right as "read" | "write",
    });
  }

  async listTenantsByUser(req: ReqListTenantsByUser): Promise<Result<ResListTenantsByUser>> {
    const rAUR = await this.activeUser(req);
    if (rAUR.isErr()) {
      return Result.Err(rAUR.Err());
    }
    const aur = rAUR.Ok();
    if (!aur.user) {
      return Result.Err(new UserNotFoundError());
    }
    const tenantUsers = await this.db
      .select()
      .from(sqlTenantUsers)
      .innerJoin(sqlTenants, and(eq(sqlTenantUsers.tenantId, sqlTenants.tenantId)))
      .where(eq(sqlTenantUsers.userId, aur.user.userId))
      .all();
    // console.log(">>>>>", tenantUser);

    return Result.Ok({
      type: "resListTenantsByUser",
      userId: aur.user.userId,
      authUserId: aur.verifiedAuth.userId,
      tenants: (
        await Promise.all(
          tenantUsers.map(async (t) => {
            const common = {
              user: {
                name: toUndef(t.TenantUsers.name),
                status: t.TenantUsers.status as UserStatus,
                statusReason: t.TenantUsers.statusReason,
                createdAt: new Date(t.TenantUsers.createdAt),
                updatedAt: new Date(t.TenantUsers.updatedAt),
              },
              tenant: {
                name: toUndef(t.Tenants.name),
                status: t.Tenants.status as UserStatus,
                statusReason: t.Tenants.statusReason,
                createdAt: new Date(t.Tenants.createdAt),
                updatedAt: new Date(t.Tenants.updatedAt),
              },
            };
            const roles = await this.getRoles(t.TenantUsers.userId, [t.Tenants], []);
            if (roles.length > 1) {
              throw new Error("multiple roles found");
            }
            if (!roles.length) {
              return undefined;
            }
            switch (roles[0].role) {
              case "member":
                return {
                  ...common,
                  tenantId: t.TenantUsers.tenantId,
                  role: roles[0].role,
                  default: toBoolean(t.TenantUsers.default),
                };
              // case "owner":
              case "admin":
                return {
                  ...common,
                  tenantId: t.TenantUsers.tenantId,
                  role: roles[0].role,
                  default: toBoolean(t.TenantUsers.default),
                  adminUserIds: roles[0].adminUserIds,
                  memberUserIds: roles[0].memberUserIds,
                  maxAdminUsers: t.Tenants.maxAdminUsers,
                  maxMemberUsers: t.Tenants.maxMemberUsers,
                };
              default:
                throw new Error("invalid role");
            }
          }),
        )
      ).filter((t) => !!t),
    });
  }

  private async getRoles(
    userId: string,
    tenants: (typeof sqlTenants.$inferSelect)[],
    ledgers: (typeof sqlLedgers.$inferSelect)[],
  ): Promise<RoleType[]> {
    if (!tenants.length && !ledgers.length) {
      throw new Error("tenant or ledger required");
    }
    // if (tenants && !tenants.length) {
    //   throw new Error("tenant not found");
    // }
    // if (ledgers && !ledgers.length) {
    //   throw new Error("ledger not found");
    // }

    // let myLedgerUsers: {
    //   Ledgers: typeof sqlLedgers.$inferSelect
    //   LedgerUsers: typeof sqlLedgerUsers.$inferSelect
    // }[] | undefined;
    let ledgerUsersFilter = new Map<
      string,
      {
        ledger: typeof sqlLedgers.$inferSelect;
        users: (typeof sqlLedgerUsers.$inferSelect)[];
        my?: typeof sqlLedgerUsers.$inferSelect;
      }
    >();
    if (ledgers.length) {
      const ledgerUsers = await this.db
        .select()
        .from(sqlLedgerUsers)
        .innerJoin(sqlLedgers, eq(sqlLedgerUsers.ledgerId, sqlLedgers.ledgerId))
        .where(
          and(
            inArray(
              sqlLedgerUsers.ledgerId,
              this.db
                .select({ ledgerId: sqlLedgerUsers.ledgerId })
                .from(sqlLedgerUsers)
                .where(
                  and(
                    inArray(
                      sqlLedgerUsers.ledgerId,
                      ledgers.map((l) => l.ledgerId),
                    ),
                    eq(sqlLedgerUsers.userId, userId),
                  ),
                ),
            ),
            eq(sqlLedgerUsers.status, "active"),
          ),
        )
        .all();
      const myLedgerUsers = ledgerUsers.filter((lu) => lu.LedgerUsers.userId === userId);
      if (!myLedgerUsers.length) {
        // throw new Error("user is not attached to ledger");
        return [];
      }
      ledgerUsersFilter = ledgerUsers.reduce((acc, lu) => {
        let item = acc.get(lu.Ledgers.ledgerId);
        if (!item) {
          item = {
            ledger: lu.Ledgers,
            users: [],
          };
          acc.set(lu.Ledgers.ledgerId, item);
        }
        if (lu.LedgerUsers.userId === userId) {
          item.my = lu.LedgerUsers;
        }
        item.users.push(lu.LedgerUsers);
        return acc;
      }, ledgerUsersFilter);
      // remove other users if you are not admin
      Array.from(ledgerUsersFilter.values()).forEach((item) => {
        item.users = item.users.filter((u) => item.my!.role === "admin" || (item.my!.role !== "admin" && u.userId === userId));
      });
    }
    const tenantIds = ledgers.length
      ? Array.from(ledgerUsersFilter.values()).map((lu) => lu.ledger.tenantId)
      : (tenants?.map((t) => t.tenantId) ?? []);

    const q = this.db
      .select()
      .from(sqlTenantUsers)
      .where(
        and(
          inArray(
            sqlTenantUsers.tenantId,
            this.db
              .select({ tenantId: sqlTenantUsers.tenantId })
              .from(sqlTenantUsers)
              .where(and(inArray(sqlTenantUsers.tenantId, tenantIds), eq(sqlTenantUsers.userId, userId))),
          ),
          eq(sqlTenantUsers.status, "active"),
        ),
      );

    let tenantUsers = await q.all();
    // console.log(">>>>>>", tenantUsers.toString());
    const tenantUserFilter = tenantUsers.reduce(
      (acc, lu) => {
        let item = acc.get(lu.tenantId);
        if (!item) {
          item = {
            users: [],
          };
          acc.set(lu.tenantId, item);
        }
        if (lu.userId === userId) {
          item.my = lu;
        }
        item.users.push(lu);
        return acc;
      },
      new Map<
        string,
        {
          users: (typeof sqlTenantUsers.$inferSelect)[];
          my?: typeof sqlTenantUsers.$inferSelect;
        }
      >(),
    );
    // remove other users if you are not admin
    Array.from(tenantUserFilter.values()).forEach((item) => {
      item.users = item.users.filter((u) => item.my!.role === "admin" || (item.my!.role !== "admin" && u.userId === userId));
    });

    return [
      ...Array.from(tenantUserFilter.values()).map((item) => ({
        userId: userId,
        tenantId: item.users[0].tenantId,
        role: item.my!.role as Role,
        adminUserIds: item.users.filter((u) => u.role === "admin").map((u) => u.userId),
        memberUserIds: item.users.filter((u) => u.role !== "admin").map((u) => u.userId),
      })),
      ...Array.from(ledgerUsersFilter.values()).map((item) => ({
        userId: userId,
        ledgerId: item.ledger.ledgerId,
        role: item.my!.role as Role,
        right: item.my!.right as "read" | "write",
        adminUserIds: item.users.filter((u) => u.role === "admin").map((u) => u.userId),
        memberUserIds: item.users.filter((u) => u.role !== "admin").map((u) => u.userId),
      })),
    ];
  }

  async redeemInvite(req: ReqRedeemInvite): Promise<Result<ResRedeemInvite>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    return Result.Ok({
      type: "resRedeemInvite",
      invites: sqlToInviteTickets(
        await Promise.all(
          (
            await this.findInvite({
              query: {
                byString: auth.verifiedAuth.params.email,
                byNick: auth.verifiedAuth.params.nick,
                existingUserId: auth.user.userId,
                // TODO
                // andProvider: auth.verifiedAuth.provider,
              },
            })
          )
            .filter((i) => i.status === "pending")
            .map(async (invite) => {
              if (invite.invitedParams.tenant) {
                const tenant = await this.db
                  .select()
                  .from(sqlTenants)
                  .where(and(eq(sqlTenants.tenantId, invite.invitedParams.tenant.id), eq(sqlTenants.status, "active")))
                  .get();
                if (!tenant) {
                  throw new Error("tenant not found");
                }
                await this.addUserToTenant(this.db, {
                  userName: `invited from [${tenant.name}]`,
                  tenantId: tenant.tenantId,
                  userId: auth.user!.userId,
                  role: invite.invitedParams.tenant.role,
                });
              }
              if (invite.invitedParams.ledger) {
                const ledger = await this.db
                  .select()
                  .from(sqlLedgers)
                  .where(and(eq(sqlLedgers.ledgerId, invite.invitedParams.ledger.id), eq(sqlLedgers.status, "active")))
                  .get();
                if (!ledger) {
                  throw new Error("ledger not found");
                }
                await this.addUserToLedger(this.db, {
                  userName: `invited-${ledger.name}`,
                  ledgerId: ledger.ledgerId,
                  tenantId: ledger.tenantId,
                  userId: auth.user!.userId,
                  role: invite.invitedParams.ledger.role,
                  right: invite.invitedParams.ledger.right,
                });
              }
              return (
                await this.db
                  .update(sqlInviteTickets)
                  .set({
                    invitedUserId: auth.user!.userId,
                    status: "accepted",
                    statusReason: `accepted: ${auth.user!.userId}`,
                    updatedAt: new Date().toISOString(),
                  })
                  .where(eq(sqlInviteTickets.inviteId, invite.inviteId))
                  .returning()
              )[0];
            }),
        ),
      ),
    });

    // const invite = await this.db.select().from(sqlInviteTickets).where(eq(sqlInviteTickets.inviteId, req.inviteId)).get();
    // if (!invite) {
    //   return Result.Err("invite not found");
    // }
    // if ((invite.invitedLedgerId && invite.invitedTenantId) ||
    //      !(invite.invitedLedgerId  invite.invitedTenantId)) {
    // if (invite.invitedTenantId) {
    //   const res = await this.db
    //     .select()
    //     .from(sqlTenants)
    //     .innerJoin(
    //       sqlInviteTickets,
    //       and(eq(sqlTenants.tenantId, sqlInviteTickets.invitedTenantId), eq(sqlInviteTickets.invitedTenantId, req.tenantId)),
    //     )
    //     .where(eq(sqlTenants.tenantId, req.tenantId))
    //     .get();

    //   if (!res) {
    //     return Result.Err("tenant not found");
    //   }
    // }

    // // const invite = sqlToInvite(res.InviteTickets);
    // const val = await this.addUserToTenant(this.db, {
    //   name: req.name,
    //   tenantId: res.Tenants.tenantId,
    //   userId: auth.user.userId,
    //   default: false,
    //   role: invite.invitedParams.tenant?.role ?? "member",
    // });
    // await this._deleteInvite(invite.inviteId);
    // return Result.Ok({
    //   type: "resConnectUserToTenant",
    //   name: val.Ok().name ?? res.Tenants.name,
    //   tenant: sqlToOutTenantParams(res.Tenants),
    //   userId: auth.user.userId,
    //   role: invite.invitedParams.tenant?.role ?? "member",
    // });
  }

  async findUser(req: ReqFindUser): Promise<Result<ResFindUser>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    const rRows = await queryUser(this.db, req.query);
    return Result.Ok({
      type: "resFindUser",
      query: req.query,
      results: rRows.Ok(),
      // .map(
      //   (row) =>
      //     ({
      //       userId: row.userId,
      //       authProvider: row.queryProvider as AuthProvider,
      //       email: row.queryEmail as string,
      //       nick: row.queryNick as string,
      //       status: row.status as UserStatus,
      //       createdAt: new Date(row.createdAt),
      //       updatedAt: new Date(row.updatedAt),
      //     }) satisfies QueryResultUser,
      // ),
    });
  }

  private async createInviteTicket(
    userId: string,
    tenantId: string,
    ledgerId: string | undefined,
    req: ReqInviteUser,
  ): Promise<Result<InviteTicket>> {
    // check maxInvites
    const allowed = await this.db
      .select()
      .from(sqlTenants)
      .where(
        and(
          eq(sqlTenants.tenantId, tenantId),
          gt(sqlTenants.maxInvites, this.db.$count(sqlInviteTickets, eq(sqlInviteTickets.invitedTenantId, tenantId))),
        ),
      )
      .get();
    if (!allowed) {
      return Result.Err("max invites reached");
    }

    const found = await this.findInvite({ query: req.ticket.query, tenantId, ledgerId });
    if (found.length) {
      return Result.Err("invite already exists");
    }

    let ivp: InvitedParams = {};
    if (req.ticket.invitedParams?.ledger) {
      ivp = {
        ledger: {
          id: req.ticket.invitedParams?.ledger.id,
          role: req.ticket.invitedParams?.ledger.role ?? "member",
          right: req.ticket.invitedParams?.ledger.right ?? "read",
        },
      };
    }
    if (req.ticket.invitedParams?.tenant) {
      ivp = {
        tenant: {
          id: req.ticket.invitedParams?.tenant.id,
          role: req.ticket.invitedParams?.tenant.role ?? "member",
        },
      };
    }

    return Result.Ok(
      sqlToInviteTickets(
        await this.db
          .insert(sqlInviteTickets)
          .values(
            prepareInviteTicket({
              sthis: this.sthis,
              userId,
              invitedTicketParams: {
                query: req.ticket.query,
                status: "pending",
                invitedParams: ivp,
              },
            }),
          )
          .returning(),
      )[0],
    );
  }

  private async updateInviteTicket(
    userId: string,
    tenantId: string,
    ledgerId: string | undefined,
    req: ReqInviteUser,
  ): Promise<Result<InviteTicket>> {
    const found = await this.findInvite({ inviteId: req.ticket.inviteId });
    if (!found.length) {
      return Result.Err("invite not found");
    }
    const invite = found[0];
    if (invite.status !== "pending") {
      return Result.Err("invite not pending");
    }
    let ivp: InvitedParams = {};
    if (req.ticket.invitedParams?.ledger) {
      ivp = {
        ledger: {
          ...invite.invitedParams.ledger,
          ...req.ticket.invitedParams.ledger,
        },
      };
    }
    if (req.ticket.invitedParams?.tenant) {
      ivp = {
        tenant: {
          ...invite.invitedParams.tenant,
          ...req.ticket.invitedParams.tenant,
        },
      };
    }
    const toInsert = prepareInviteTicket({
      sthis: this.sthis,
      userId: userId,
      invitedTicketParams: {
        query: req.ticket.query,
        status: "pending",
        invitedParams: ivp,
      },
    });
    // might be update query
    return Result.Ok(
      sqlToInviteTickets(
        await this.db
          .update(sqlInviteTickets)
          .set({
            sendEmailCount: req.ticket.incSendEmailCount ? invite.sendEmailCount + 1 : invite.sendEmailCount,
            invitedParams: toInsert.invitedParams,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(sqlInviteTickets.inviteId, invite.inviteId))
          .returning(),
      )[0],
    );
  }

  async inviteUser(req: ReqInviteUser): Promise<Result<ResInviteUser>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    const findUser = await queryUser(this.db, req.ticket.query);
    if (findUser.isErr()) {
      return Result.Err(findUser.Err());
    }
    if (req.ticket.query.existingUserId && findUser.Ok().length !== 1) {
      return Result.Err("existingUserId not found");
    }
    if (req.ticket.query.existingUserId === auth.user.userId) {
      return Result.Err("cannot invite self");
    }

    if (
      req.ticket.invitedParams?.ledger &&
      req.ticket.invitedParams?.tenant &&
      !req.ticket.invitedParams?.ledger &&
      !req.ticket.invitedParams?.tenant
    ) {
      return Result.Err("either ledger or tenant must be set");
    }
    let tenantId: string | undefined;
    let ledgerId: string | undefined;
    if (req.ticket.invitedParams?.ledger) {
      const ledger = await this.db
        .select()
        .from(sqlLedgers)
        .where(eq(sqlLedgers.ledgerId, req.ticket.invitedParams.ledger.id))
        .get();
      if (!ledger) {
        return Result.Err("ledger not found");
      }
      ledgerId = ledger.ledgerId;
      tenantId = ledger.tenantId;
    }
    if (req.ticket.invitedParams?.tenant) {
      const tenant = await this.db
        .select()
        .from(sqlTenants)
        .where(eq(sqlTenants.tenantId, req.ticket.invitedParams.tenant.id))
        .get();
      if (!tenant) {
        return Result.Err("tenant not found");
      }
      tenantId = tenant.tenantId;
    }
    if (!tenantId) {
      return Result.Err("tenant not found");
    }

    let inviteTicket: InviteTicket;
    if (!req.ticket.inviteId) {
      const rInviteTicket = await this.createInviteTicket(auth.user.userId, tenantId, ledgerId, req);
      if (rInviteTicket.isErr()) {
        return Result.Err(rInviteTicket.Err());
      }
      inviteTicket = rInviteTicket.Ok();
    } else {
      const rInviteTicket = await this.updateInviteTicket(auth.user.userId, tenantId, ledgerId, req);
      if (rInviteTicket.isErr()) {
        return Result.Err(rInviteTicket.Err());
      }
      inviteTicket = rInviteTicket.Ok();
    }
    return Result.Ok({
      type: "resInviteUser",
      invite: inviteTicket,
    });
  }

  private async findInvite(req: {
    query?: QueryUser;
    inviteId?: string;
    tenantId?: string;
    ledgerId?: string;
    // now?: Date
  }): Promise<InviteTicket[]> {
    if (!(req.inviteId || req.query)) {
      throw new Error("inviteId or query is required");
    }
    if (req.tenantId && req.ledgerId) {
      throw new Error("invite only possible to ledger or tenant");
    }
    // housekeeping
    await this.db
      .update(sqlInviteTickets)
      .set({ status: "expired" })
      .where(and(eq(sqlInviteTickets.status, "pending"), lt(sqlInviteTickets.expiresAfter, new Date().toISOString())))
      .run();
    let condition = and();
    // eq(sqlInviteTickets.status, "pending"),
    // gt(sqlInviteTickets.expiresAfter, (req.now ?? new Date()).toISOString()),

    if (req.tenantId) {
      condition = and(eq(sqlInviteTickets.invitedTenantId, req.tenantId), condition);
    }
    if (req.ledgerId) {
      condition = and(eq(sqlInviteTickets.invitedLedgerId, req.ledgerId), condition);
    }
    if (req.inviteId) {
      condition = and(eq(sqlInviteTickets.inviteId, req.inviteId), condition);
    }
    if (req.query) {
      condition = and(
        queryCondition(req.query, {
          ...sqlInviteTickets,
          userId: sqlInviteTickets.invitedUserId,
        }),
        condition,
      );
    }
    const rows = await this.db.select().from(sqlInviteTickets).where(condition).all();
    return sqlToInviteTickets(rows);
  }

  /**
   *
   * @description list invites for a user if user is owner of tenant or admin of tenant
   */
  async listInvites(req: ReqListInvites): Promise<Result<ResListInvites>> {
    // console.log(`xxxxx`)
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    let tenantCond = and(eq(sqlTenantUsers.userId, auth.user.userId), eq(sqlTenantUsers.status, "active"));
    if (req.tenantIds?.length) {
      tenantCond = and(inArray(sqlTenantUsers.tenantId, req.tenantIds), tenantCond);
    }
    const tenants = await this.db
      .select()
      .from(sqlTenantUsers)
      .innerJoin(sqlTenants, and(eq(sqlTenants.tenantId, sqlTenantUsers.tenantId), eq(sqlTenants.status, "active")))
      .where(tenantCond)
      .all();

    let ledgerCond = and(eq(sqlLedgerUsers.userId, auth.user.userId), eq(sqlLedgerUsers.status, "active"));
    if (req.ledgerIds?.length) {
      ledgerCond = and(inArray(sqlLedgerUsers.ledgerId, req.ledgerIds), ledgerCond);
    }
    const ledgers = await this.db
      .select()
      .from(sqlLedgerUsers)
      .innerJoin(sqlLedgers, and(eq(sqlLedgers.ledgerId, sqlLedgerUsers.ledgerId), eq(sqlLedgers.status, "active")))
      .where(ledgerCond)
      .all();

    if (!tenants.length && !ledgers.length) {
      return Result.Ok({
        type: "resListInvites",
        tickets: [],
      });
    }

    const roles = await this.getRoles(
      auth.user.userId,
      tenants.map((i) => i.Tenants),
      ledgers.map((i) => i.Ledgers),
    );
    // list invites from all tenants where i'm owner or admin
    const invites = await this.db
      .select()
      .from(sqlInviteTickets)
      .where(
        or(
          inArray(
            sqlInviteTickets.invitedTenantId,
            roles.filter((i) => i.role === "admin" && i.tenantId).map((i) => i.tenantId!),
          ),
          inArray(
            sqlInviteTickets.invitedLedgerId,
            roles.filter((i) => i.role === "admin" && i.ledgerId).map((i) => i.ledgerId!),
          ),
        ),
      );
    return Result.Ok({
      type: "resListInvites",
      tickets: sqlToInviteTickets(invites),
    });

    // list invites from all ledgers where i'm owner or admin

    // this.db.select()
    //   .from(sqlTenants)
    //   .innerJoin(sqlTenantUsers, and(
    //       eq(sqlTenantUsers.userId, auth.user.userId),
    //       eq(sqlTenants.tenantId, sqlTenantUsers.tenantId),
    //     ))
    //   .innerJoin(sqlTenantUserRoles, and(
    //     eq(sqlTenantUsers.userId, auth.user.userId),
    //     eq(sqlTenants.tenantId, sqlTenantUsers.tenantId)
    //   ))
    //   .where(
    //     eq(sqlTenants.ownerUserId, auth.user.userId)
    // ).all();

    // this.db.select().from(sqlInviteTickets)
    //   .where(
    //     eq(sqlInviteTickets.inviterUserId, auth.user.userId)
    //   )
    //   .all();

    // let rows: (typeof sqlInviteTickets.$inferSelect)[];
    // const ownerTenants = await this.db
    //   .select()
    //   .from(sqlTenants)
    //   .where(eq(sqlTenants.ownerUserId, auth.user.userId))
    //   .all()
    //   .then((rows) => rows.map((row) => row.tenantId));
    // // get admin in tenant for this user
    // let condition = and(eq(sqlTenantUserRoles.userId, auth.user.userId), eq(sqlTenantUserRoles.role, "admin"));
    // if (req.tenantIds.length) {
    //   // filter by tenantIds if set
    //   condition = and(inArray(sqlTenantUserRoles.tenantId, req.tenantIds), condition);
    // }
    // const adminTenants = await this.db
    //   .select()
    //   .from(sqlTenantUserRoles)
    //   .where(condition)
    //   .all()
    //   .then((rows) => rows.map((row) => row.tenantId));
    // const setTenants = new Set(req.tenantIds);
    // const filterAdminTenants = Array.from(new Set([...ownerTenants, ...adminTenants, ...req.tenantIds])).filter((x) => {
    //   return setTenants.size ? setTenants.has(x) : true;
    // });
    // // console.log(">>>>", filterAdminTenants);
    // rows = await this.db
    //   .select()
    //   .from(sqlInviteTickets)
    //   .where(
    //     and(
    //       inArray(sqlInviteTickets.invitedTenantId, filterAdminTenants),
    //       // inArray(inviteTickets.inv, req.tenantIds)
    //     ),
    //   )
    //   .all();
    // // }
    // return Result.Ok({
    //   type: "resListInvites",
    //   tickets: Array.from(
    //     rows
    //       .reduce((acc, row) => {
    //         if (!row.inviterTenantId) {
    //           throw new Error("inviterTenantId is required");
    //         }
    //         const invites = acc.get(row.inviterTenantId) ?? [];
    //         invites.push(sqlToInvite(row));
    //         acc.set(row.inviterTenantId, invites);
    //         return acc;
    //       }, new Map<string, InviteTicket[]>())
    //       .entries(),
    //   )
    //     .map(([tenantId, invites]) => ({
    //       tenantId,
    //       invites,
    //     }))
    //     .filter((x) => x.invites.length),
    // });
  }

  async deleteInvite(req: ReqDeleteInvite): Promise<Result<ResDeleteInvite>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    await this._deleteInvite(req.inviteId);
    return Result.Ok({
      type: "resDeleteInvite",
      inviteId: req.inviteId,
    });
  }

  private async _deleteInvite(inviteId: string): Promise<Result<void>> {
    await this.db.delete(sqlInviteTickets).where(eq(sqlInviteTickets.inviteId, inviteId)).run();
    return Result.Ok(undefined);
  }

  async updateUserTenant(req: ReqUpdateUserTenant): Promise<Result<ResUpdateUserTenant>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    const userId = req.userId ?? auth.user.userId;
    if (req.role && (await this.isAdminOfTenant(userId, req.tenantId))) {
      await this.db
        .update(sqlTenantUsers)
        .set({
          role: req.role,
        })
        .where(and(eq(sqlTenantUsers.userId, userId), eq(sqlTenantUsers.tenantId, req.tenantId)))
        .run();
    }
    if (req.default) {
      await this.db
        .update(sqlTenantUsers)
        .set({
          default: 0,
        })
        .where(eq(sqlTenantUsers.userId, userId));
    }
    if (req.default || req.name) {
      const updateSet = {} as {
        default?: number;
        name?: string;
      };
      if (req.default) {
        updateSet.default = req.default ? 1 : 0;
      }
      if (req.name) {
        updateSet.name = req.name;
      }
      const ret = await this.db
        .update(sqlTenantUsers)
        .set(updateSet)
        .where(and(eq(sqlTenantUsers.userId, userId), eq(sqlTenantUsers.tenantId, req.tenantId)))
        .returning();
    }
    const ret = await this.db
      .select()
      .from(sqlTenantUsers)
      .innerJoin(
        sqlTenantUsers,
        and(eq(sqlTenantUsers.userId, sqlTenantUsers.userId), eq(sqlTenantUsers.tenantId, sqlTenantUsers.tenantId)),
      )
      .where(and(eq(sqlTenantUsers.userId, userId), eq(sqlTenantUsers.tenantId, req.tenantId)))
      .get();
    if (!ret) {
      return Result.Err("not found");
    }
    return Result.Ok({
      type: "resUpdateUserTenant",
      tenantId: ret.TenantUsers.tenantId,
      userId: ret.TenantUsers.userId,
      role: ret.TenantUsers.role as Role,
      default: !!ret.TenantUsers.default,
      name: toUndef(ret.TenantUsers.name),
    });
  }

  async createTenant(req: ReqCreateTenant): Promise<Result<ResCreateTenant>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    const rTenant = await this.insertTenant(auth as ActiveUserWithUserId, {
      ...req.tenant,
      ownerUserId: auth.user.userId,
    });
    if (rTenant.isErr()) {
      return Result.Err(rTenant.Err());
    }
    const tenant = rTenant.Ok();
    await this.addUserToTenant(this.db, {
      userName: nameFromAuth(req.tenant.name, auth as ActiveUserWithUserId),
      tenantId: tenant.tenantId,
      userId: auth.user.userId,
      role: "admin",
      default: false,
    });
    return Result.Ok({
      type: "resCreateTenant",
      tenant,
    });
  }

  private async insertTenant(auth: ActiveUserWithUserId, req: InCreateTenantParams): Promise<Result<OutTenantParams>> {
    const tenantId = this.sthis.nextId(12).str;
    const cnt = await this.db.$count(sqlTenants, eq(sqlTenants.ownerUserId, auth.user.userId));
    if (cnt + 1 >= auth.user.maxTenants) {
      return Result.Err("max tenants reached");
    }
    const nowStr = new Date().toISOString();
    const values = await this.db
      .insert(sqlTenants)
      .values({
        tenantId,
        name: req.name ?? `my-tenant[${tenantId}]`,
        ownerUserId: auth.user.userId,
        maxAdminUsers: req.maxAdminUsers ?? 5,
        maxMemberUsers: req.maxMemberUsers ?? 5,
        maxInvites: req.maxInvites ?? 10,
        createdAt: nowStr,
        updatedAt: nowStr,
      })
      .returning();
    return Result.Ok(sqlToOutTenantParams(values[0]));
  }

  async updateTenant(req: ReqUpdateTenant): Promise<Result<ResUpdateTenant>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    const prev = await this.db.select().from(sqlTenants).where(eq(sqlTenants.tenantId, req.tenant.tenantId)).get();
    if (!prev) {
      return Result.Err("tenant not found");
    }
    if (!(await this.isAdminOfTenant(auth.user.userId, req.tenant.tenantId))) {
      return Result.Err("not owner of tenant");
    }
    const now = new Date().toISOString();
    const result = await this.db
      .update(sqlTenants)
      .set({
        name: req.tenant.name,
        maxAdminUsers: req.tenant.maxAdminUsers,
        maxMemberUsers: req.tenant.maxMemberUsers,
        maxInvites: req.tenant.maxInvites,
        updatedAt: now,
      })
      .where(eq(sqlTenants.tenantId, req.tenant.tenantId))
      .returning();
    return Result.Ok({
      type: "resUpdateTenant",
      tenant: sqlToOutTenantParams(result[0]),
    });
  }

  async deleteTenant(req: ReqDeleteTenant): Promise<Result<ResDeleteTenant>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    // check if owner or admin of tenant
    if (!(await this.isAdminOfTenant(auth.user.userId, req.tenantId))) {
      return Result.Err("not owner or admin of tenant");
    }
    // TODO remove ledgers
    await this.db.delete(sqlInviteTickets).where(eq(sqlInviteTickets.invitedTenantId, req.tenantId)).run();
    await this.db.delete(sqlTenantUsers).where(eq(sqlTenantUsers.tenantId, req.tenantId)).run();
    await this.db.delete(sqlTenants).where(eq(sqlTenants.tenantId, req.tenantId)).run();
    return Result.Ok({
      type: "resDeleteTenant",
      tenantId: req.tenantId,
    });
  }

  private async isAdminOfTenant(userId: string, tenantId: string): Promise<boolean> {
    const adminRole = await this.db
      .select()
      .from(sqlTenantUsers)
      .where(
        and(
          eq(sqlTenantUsers.userId, userId),
          eq(sqlTenantUsers.tenantId, tenantId),
          eq(sqlTenantUsers.role, "admin"),
          eq(sqlTenantUsers.status, "active"),
        ),
      )
      .get();
    return !!adminRole;
  }

  private async isAdminOfLedger(userId: string, ledgerId: string): Promise<boolean> {
    const adminRole = await this.db
      .select()
      .from(sqlLedgerUsers)
      .innerJoin(sqlLedgers, and(eq(sqlLedgers.ledgerId, sqlLedgerUsers.ledgerId)))
      .where(and(eq(sqlLedgerUsers.userId, userId), eq(sqlLedgerUsers.ledgerId, ledgerId)))
      .get();
    if (adminRole?.LedgerUsers.role === "member") {
      return this.isAdminOfTenant(userId, adminRole.Ledgers.tenantId);
    }
    return adminRole?.LedgerUsers.role === "admin";
  }

  async createLedger(req: ReqCreateLedger): Promise<Result<ResCreateLedger>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    // check if owner or admin of tenant
    if (!(await this.isAdminOfTenant(auth.user.userId, req.ledger.tenantId))) {
      return Result.Err("not owner or admin of tenant");
    }

    const allowed = await this.db
      .select()
      .from(sqlTenants)
      .where(
        and(
          eq(sqlTenants.tenantId, req.ledger.tenantId),
          gt(sqlTenants.maxLedgers, this.db.$count(sqlLedgers, eq(sqlLedgers.tenantId, req.ledger.tenantId))),
        ),
      )
      .get();
    if (!allowed) {
      return Result.Err("max ledgers per tenant reached");
    }

    const ledgerId = this.sthis.nextId(12).str;
    const now = new Date().toISOString();
    const ledger = await this.db
      .insert(sqlLedgers)
      .values({
        ledgerId,
        tenantId: req.ledger.tenantId,
        ownerId: auth.user.userId,
        name: req.ledger.name,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const roles = await this.db
      .insert(sqlLedgerUsers)
      .values({
        ledgerId: ledgerId,
        userId: auth.user.userId,
        role: "admin",
        name: req.ledger.name,
        default: 0,
        right: "write",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return Result.Ok({
      type: "resCreateLedger",
      ledger: sqlToLedgers([{ Ledgers: ledger[0], LedgerUsers: roles[0] }])[0],
    });
  }
  async updateLedger(req: ReqUpdateLedger): Promise<Result<ResUpdateLedger>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    const now = new Date().toISOString();
    // check if owner or admin of tenant
    if (!(await this.isAdminOfLedger(auth.user.userId, req.ledger.ledgerId))) {
      if (req.ledger.name) {
        await this.db
          .update(sqlLedgerUsers)
          .set({
            name: req.ledger.name,
            updatedAt: now,
          })
          .where(and(eq(sqlLedgerUsers.userId, auth.user.userId), eq(sqlLedgerUsers.ledgerId, req.ledger.ledgerId)))
          .run();
      }
      const rows = await this.db
        .select()
        .from(sqlLedgers)
        .innerJoin(sqlLedgerUsers, and(eq(sqlLedgers.ledgerId, sqlLedgerUsers.ledgerId)))
        .where(
          and(
            eq(sqlLedgerUsers.userId, auth.user.userId),
            eq(sqlLedgerUsers.ledgerId, req.ledger.ledgerId),
            ne(sqlLedgerUsers.role, "admin"),
          ),
        )
        .all();
      return Result.Ok({
        type: "resUpdateLedger",
        ledger: sqlToLedgers(rows)[0],
      });
    }
    const role = {
      updatedAt: now,
    } as {
      readonly updatedAt: string;
      default?: number;
      name?: string;
      role?: Role;
      right?: "read" | "write";
    };
    if (typeof req.ledger.default === "boolean") {
      role.default = req.ledger.default ? 1 : 0;
      if (req.ledger.default) {
        // switch default
        await this.db
          .update(sqlLedgerUsers)
          .set({
            default: 0,
            updatedAt: now,
          })
          .where(and(eq(sqlLedgerUsers.userId, auth.user.userId), ne(sqlLedgerUsers.default, 0)))
          .run();
      }
    }
    const ledger = {
      name: req.ledger.name,
      updatedAt: now,
    };
    if (req.ledger.name) {
      role.name = req.ledger.name;
      ledger.name = req.ledger.name;
    }
    if (req.ledger.right) {
      role.right = req.ledger.right;
    }
    if (req.ledger.role) {
      role.role = req.ledger.role;
    }
    const roles = await this.db
      .update(sqlLedgerUsers)
      .set(role)
      .where(eq(sqlLedgerUsers.ledgerId, req.ledger.ledgerId))
      .returning();
    const ledgers = await this.db.update(sqlLedgers).set(ledger).where(eq(sqlLedgers.ledgerId, req.ledger.ledgerId)).returning();
    return Result.Ok({
      type: "resUpdateLedger",
      ledger: sqlToLedgers([
        {
          Ledgers: ledgers[0],
          LedgerUsers: roles[0],
        },
      ])[0],
    });
  }
  async deleteLedger(req: ReqDeleteLedger): Promise<Result<ResDeleteLedger>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    const now = new Date().toISOString();
    // check if owner or admin of tenant
    if (!(await this.isAdminOfLedger(auth.user.userId, req.ledger.ledgerId))) {
      return Result.Err("not owner or admin of tenant");
    }
    await this.db.delete(sqlLedgerUsers).where(eq(sqlLedgerUsers.ledgerId, req.ledger.ledgerId)).run();
    await this.db.delete(sqlLedgers).where(eq(sqlLedgers.ledgerId, req.ledger.ledgerId)).run();
    return Result.Ok({
      type: "resDeleteLedger",
      ledgerId: req.ledger.ledgerId,
    });
  }
  async listLedgersByUser(req: ReqListLedgersByUser): Promise<Result<ResListLedgersByUser>> {
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    const now = new Date().toISOString();
    let condition = and(eq(sqlLedgerUsers.userId, auth.user.userId));
    if (req.tenantIds && req.tenantIds.length) {
      condition = and(condition, inArray(sqlLedgers.tenantId, req.tenantIds));
    }
    const rows = await this.db
      .select()
      .from(sqlLedgers)
      .innerJoin(sqlLedgerUsers, and(eq(sqlLedgers.ledgerId, sqlLedgerUsers.ledgerId)))
      .where(condition)
      .all();
    return Result.Ok({
      type: "resListLedgersByUser",
      userId: auth.user.userId,
      ledgers: sqlToLedgers(rows),
    });
  }

  async getCloudSessionToken(
    req: ReqCloudSessionToken,
    ictx: Partial<{
      secretToken: string;
      validFor: number;
      issuer: string;
      audience: string;
    }> = {},
  ): Promise<Result<ResCloudSessionToken>> {
    const resListTenants = await this.listTenantsByUser({
      type: "reqListTenantsByUser",
      auth: req.auth,
    });
    if (resListTenants.isErr()) {
      return Result.Err(resListTenants.Err());
    }

    const resListLedgers = await this.listLedgersByUser({
      type: "reqListLedgersByUser",
      auth: req.auth,
    });

    if (resListLedgers.isErr()) {
      return Result.Err(resListLedgers.Err());
    }

    const ctx = {
      secretToken: this.sthis.env.get("CLOUD_SESSION_TOKEN_SECRET")!,
      validFor: parseInt(this.sthis.env.get("CLOUD_SESSION_TOKEN_VALID_FOR") ?? "3600000", 10),
      issuer: this.sthis.env.get("CLOUD_SESSION_TOKEN_ISSUER") ?? "FP_CLOUD",
      audience: this.sthis.env.get("CLOUD_SESSION_TOKEN_AUDIENCE") ?? "PUBLIC",
      ...ictx,
    };
    const rAuth = await this.activeUser(req);
    if (rAuth.isErr()) {
      return Result.Err(rAuth.Err());
    }
    const auth = rAuth.Ok();
    if (!auth.user) {
      return Result.Err(new UserNotFoundError());
    }
    const privKey = await env2jwk(ctx.secretToken);
    let validFor = ctx.validFor;
    if (!(0 <= validFor && validFor <= 3600000)) {
      validFor = 3600000;
    }
    const token = await new SignJWT({
      userId: auth.user.userId,
      tenants: resListTenants.Ok().tenants.map((i) => ({
        id: i.tenantId,
        role: i.role,
      })),
      ledgers: resListLedgers
        .Ok()
        .ledgers.map((i) => {
          const rights = i.users.find((u) => u.userId === auth.user!.userId);
          if (!rights) {
            return undefined;
          }
          return {
            id: i.ledgerId,
            role: rights.role,
            right: rights.right,
          };
        })
        .filter((i) => i),
    })
      .setProtectedHeader({ alg: "ES256" }) // algorithm
      .setIssuedAt()
      .setIssuer(ctx.issuer) // issuer
      .setAudience(ctx.audience) // audience
      .setExpirationTime(Date.now() + validFor) // expiration time
      .sign(privKey);

    return Result.Ok({
      type: "resCloudSessionToken",
      token,
    });
  }
}

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// async attachUserToTenant(req: ReqAttachUserToTenant): Promise<Result<ResAttachUserToTenant>> {
//     const maxTenants = await this.db.select({
//         maxTenants: users.maxTenants
//     }).from(users).where(eq(users.userId, req.userId)).get() ?? { maxTenants: 5 }

//     const tendantCount = await this.db.$count(tenantUsers,
//         and(
//             eq(tenants.ownerUserId, req.userId),
//             ne(tenantUsers.active, 0)
//         ))

//     if (tendantCount >= maxTenants.maxTenants) {
//         return Result.Err(`max tenants reached:${maxTenants.maxTenants}`)
//     }

//     const now = new Date().toISOString();
//     const values = {
//         userId: req.userId,
//         tenantId: req.tenantId,
//         name: req.name,
//         active: 1,
//         createdAt: now,
//         updatedAt: now
//     }
//     const rRes = await this.db
//         .insert(tenantUsers)
//         .values(values)
//         .onConflictDoNothing()
//         .returning()
//         .run()
//     const res = rRes.toJSON()[0]
//     return Result.Ok({
//         type: 'resAttachUserToTenant',
//         name: req.name,
//         tenant: {
//             tenantId: res.
//                 name: req.name,
//             ownerUserId: req.userId,
//             adminUserIds: [],
//             memberUserIds: [],
//             maxAdminUsers: 5,
//             maxMemberUsers: 5,
//             createdAt: new Date(),
//             updatedAt: new Date()
//         },
//         userId: req.userId,
//         role: req.role
//     })

//     // throw new Error("Method not implemented.");
// }
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// async listLedgersByTenant(req: ReqListLedgerByTenant): Promise<ResListLedgerByTenant> {
//     throw new Error("Method not implemented.");
// }
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// async attachUserToLedger(req: ReqAttachUserToLedger): Promise<ResAttachUserToLedger> {
//     throw new Error("Method not implemented.");
// }
