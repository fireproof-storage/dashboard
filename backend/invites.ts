
import { int, sqliteTable, text, primaryKey, index } from "drizzle-orm/sqlite-core";
import { AuthType, users } from "./users.ts";
import { tenants } from "./tenants.ts";
import { ledgers } from "./ledgers.ts";
import { AuthProvider, Queryable, queryEmail, queryNick, QueryUser, toUndef } from "./sql-helper.ts";
import { SuperThis } from "@fireproof/core";

export const inviteTickets = sqliteTable("InviteTickets", {
  inviteId: text().primaryKey(),

  inviterUserRefId: text().notNull().references(() => users.userId),
  inviterTenantId: text().notNull().references(() => tenants.tenantId),

  // directed Invite
  invitedUserId: text().references(() => users.userId),

  // bind on login Invite
  queryProvider: text(),
  // email key for QueryUser -> tolower - remove + and .
  queryEmail: text(),
  // nick key for QueryUser -> tolower
  queryNick: text(),

  sendEmailCount: int().notNull(),

  // invite to tenant
  invitedTenantId: text().references(() => tenants.tenantId),
  // invite to ledger
  invitedLedgerId: text().references(() => ledgers.ledgerId),

  // depending on target a JSON with e.g. the role and right
  invitedParams: text().notNull(),

  expiresAfter: text().notNull(),
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
}, (table) => [
  index("invitesEmail").on(table.queryEmail),
  index("invitesNick").on(table.queryNick),
  index("invitesExpiresAfter").on(table.expiresAfter),
]);

export interface InvitedParams {
  readonly tenant?: {
    // readonly id: string;
    readonly role: "admin" | "member";
  };
  readonly ledger?: {
    // readonly id: string;
    readonly role: "admin" | "member";
    readonly right: "read" | "write";
  };
}


export interface InviteTicket extends Queryable {
  readonly inviteId: string;
  readonly sendEmailCount: number;
  readonly inviterUserRefId: string;
  readonly inviterTenantId: string;

  // readonly invitedUserId?: string;
  readonly userID?: string;

  readonly queryProvider?: AuthProvider;
  readonly queryEmail?: string;
  readonly queryNick?: string;

  readonly invitedTenantId?: string;
  readonly invitedLedgerId?: string;

  readonly invitedParams: InvitedParams;
  readonly expiresAfter: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}


export function sqlToInvite(sql: typeof inviteTickets.$inferSelect): InviteTicket {
  return {
    inviteId: sql.inviteId,
    sendEmailCount: sql.sendEmailCount,
    inviterUserRefId: sql.inviterUserRefId,
    inviterTenantId: sql.inviterTenantId,

    userID: toUndef(sql.invitedUserId),

    queryProvider: toUndef(sql.queryProvider) as AuthProvider,
    queryEmail: toUndef(sql.queryEmail),
    queryNick: toUndef(sql.queryNick),


    invitedTenantId: toUndef(sql.invitedTenantId),
    invitedLedgerId: toUndef(sql.invitedLedgerId),
    invitedParams: JSON.parse(sql.invitedParams) ?? {},
    expiresAfter: new Date(sql.expiresAfter),
    createdAt: new Date(sql.createdAt),
    updatedAt: new Date(sql.updatedAt),
  };
}

export interface InviteTicketParams {
  // readonly auth: AuthType;
  readonly inviterTenantId: string;
  readonly query: QueryUser;
  // to update
  readonly inviteId?: string;
  readonly incSendEmailCount?: boolean;
  readonly invitedParams: InvitedParams;
}

export interface PrepareInviteTicketParams {
  readonly sthis: SuperThis,
  readonly userId: string,
  readonly tenantId: string,
  readonly ledgerId?: string,
  readonly expiresAfter?: Date
  readonly now?: Date
  readonly invitedTicketParams: InviteTicketParams
}

export function prepareInviteTicket({
  sthis,
  userId: userRefId,
  tenantId,
  ledgerId,
  now,
  expiresAfter,
  invitedTicketParams: ivp
}: PrepareInviteTicketParams): (typeof inviteTickets.$inferInsert) {
  const nowDate = new Date();
  const nowStr = (now ?? nowDate).toISOString();
  const expiresAfterStr = (expiresAfter ?? new Date(nowDate.getTime() + 1000 * 60 * 60 * 24 * 7)).toISOString();

  if ((ivp.invitedParams.ledger && ivp.invitedParams.tenant) || (!ivp.invitedParams.ledger && !ivp.invitedParams.tenant)) {
    throw new Error("only one target allowed");
  }
  // let target: "tenant" | "ledger" = "tenant";
  let params: string = "";
  let ledgerIdFlag: string | undefined = undefined;
  let tenantIdFlag: string | undefined = undefined;
  if (ivp.invitedParams.ledger) {
    // target = "ledger";
    ledgerIdFlag = ledgerId;
    if (!ledgerId) {
      throw new Error("ledgerId is required");
    }
    params = JSON.stringify({
      role: ivp.invitedParams.ledger.role,
      right: ivp.invitedParams.ledger.right,
    });
  } else if (ivp.invitedParams.tenant) {
    // target = "tenant";
    tenantIdFlag = tenantId;
    params = JSON.stringify({
      role: ivp.invitedParams.tenant.role,
    });
  }
  return {
    inviteId: ivp.inviteId ?? sthis.nextId(12).str,
    inviterUserRefId: userRefId,
    inviterTenantId: tenantId,
    queryEmail: queryEmail(ivp.query.byEmail),
    queryNick: queryNick(ivp.query.byNick),
    queryProvider: ivp.query.andProvider,
    invitedUserId: ivp.query.existingUserId,
    sendEmailCount: 0,
    invitedTenantId: tenantIdFlag,
    invitedLedgerId: ledgerIdFlag,
    invitedParams: params,
    expiresAfter: expiresAfterStr,
    createdAt: nowStr,
    updatedAt: nowStr
  };
}
