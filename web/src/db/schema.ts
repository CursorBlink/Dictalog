import {
	boolean,
	index,
	json,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const sourceTypeEnum = pgEnum("SourceType", ["S3"]);

// ─── Tables ──────────────────────────────────────────────────────────────────

export const user = pgTable(
	"user",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull(),
		emailVerified: boolean("emailVerified").notNull().default(false),
		image: text("image"),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(t) => [uniqueIndex("user_email_unique").on(t.email)],
);

export const sourceConfig = pgTable(
	"source_config",
	{
		id: text("id").primaryKey(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		type: sourceTypeEnum("type").notNull(),
		config: json("config").notNull(),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(t) => [index("source_config_userId_idx").on(t.userId)],
);

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expiresAt").notNull(),
		token: text("token").notNull(),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
		ipAddress: text("ipAddress"),
		userAgent: text("userAgent"),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(t) => [
		uniqueIndex("session_token_unique").on(t.token),
		index("session_userId_idx").on(t.userId),
	],
);

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("accountId").notNull(),
		providerId: text("providerId").notNull(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("accessToken"),
		refreshToken: text("refreshToken"),
		idToken: text("idToken"),
		accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
		refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(t) => [index("account_userId_idx").on(t.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expiresAt").notNull(),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(t) => [index("verification_identifier_idx").on(t.identifier)],
);
