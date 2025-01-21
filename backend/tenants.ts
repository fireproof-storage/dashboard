import { int, sqliteTable, text, primaryKey, index } from "drizzle-orm/sqlite-core";
import { users } from "./users.ts";

export const tenants = sqliteTable("Tenants", {
    tenantId: text().primaryKey(),
    name: text(),
    ownerUserRefId: text()
        .notNull()
        .references(() => users.userId),
    maxAdminUserRefs: int().notNull().default(5),
    maxMemberUserRefs: int().notNull().default(5),
    maxInvites: int().notNull().default(10),
    status: text().notNull().default("active"),
    statusReason: text().notNull().default("just created"),
    createdAt: text().notNull(),
    updatedAt: text().notNull(),
});

export const tenantUserRefRoles = sqliteTable("TenantUserRefRoles", {
    tenantId: text()
        .notNull()
        .references(() => tenants.tenantId),
    userRefId: text()
        .notNull()
        .references(() => users.userId),
    role: text().notNull(), // "admin" | "member"
    createdAt: text().notNull(),
}, (table) => [
    primaryKey({ columns: [table.tenantId, table.userRefId] }),
    index("turrUserRefIdx").on(table.userRefId), // to enable delete by userRefId
]);

export const tenantUserRefs = sqliteTable("TenantUserRefs", {
    userRefId: text()
        .notNull()
        .references(() => users.userId),
    tenantId: text()
        .notNull()
        .references(() => tenants.tenantId),
    name: text(),
    status: text().notNull().default("active"),
    statusReason: text().notNull().default("just created"),
    default: int().notNull(),
    createdAt: text().notNull(),
    updatedAt: text().notNull(),
}, (table) => [
    primaryKey({ columns: [table.userRefId, table.tenantId] })
]);



export interface Tenant {
    readonly tenantId: string;
    readonly name: string;
    readonly ownerUserRefId: string;
    readonly adminUserRefIds: string[];
    readonly memberUserRefIds: string[];
    readonly maxAdminUserRefs: number;
    readonly maxMemberUserRefs: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

interface InsertTenantParam {
    readonly tenantId: string;
    readonly name?: string;
    readonly ownerUserRefId: string;
    readonly adminUserRefIds?: string[];
    readonly memberUserRefIds?: string[];
    readonly maxAdminUserRefs?: number;
    readonly maxMemberUserRefs?: number;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
  }

export function prepareInsertTenant(req: InsertTenantParam) {
  const now = new Date();
  const tenant: typeof tenants.$inferInsert = {
    tenantId: req.tenantId,
    name: req.name,
    ownerUserRefId: req.ownerUserRefId,
    // adminUserRefIds: JSON.stringify(req.adminUserRefIds ?? []),
    // memberUserRefIds: JSON.stringify(req.adminUserRefIds ?? []),
    maxAdminUserRefs: req.maxAdminUserRefs ?? 5,
    maxMemberUserRefs: req.maxMemberUserRefs ?? 5,
    createdAt: (req.createdAt ?? now).toISOString(),
    updatedAt: (req.updatedAt ?? req.createdAt ?? now).toISOString(),
  };
  return tenant;
  // await this.db.insert(tenants).values(tenant).run();
  // return Result.Ok({
  //     tenantId: tenant.tenantId,
  //     name: tenant.name,
  //     ownerUserRefId: tenant.ownerUserRefId,
  //     adminUserRefIds: JSON.parse(tenant.adminUserRefIds),
  //     memberUserRefIds: JSON.parse(tenant.memberUserRefIds),
  //     maxAdminUserRefs: tenant.maxAdminUserRefs,
  //     maxMemberUserRefs: tenant.maxMemberUserRefs,
  //     createdAt: new Date(tenant.createdAt),
  //     updatedAt: new Date(tenant.updatedAt),
  // });
}
