import { pgTable, serial, text, numeric, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignStatusEnum = pgEnum("campaign_status", ["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"]);
export const campaignObjectiveEnum = pgEnum("campaign_objective", ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "LEADS", "APP_PROMOTION", "SALES", "MESSAGES"]);
export const budgetTypeEnum = pgEnum("budget_type", ["daily", "lifetime", "ad_set_budget"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["active", "learning", "off", "error", "not_delivering"]);

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: campaignStatusEnum("status").notNull().default("PAUSED"),
  objective: campaignObjectiveEnum("objective").notNull().default("TRAFFIC"),
  budgetType: budgetTypeEnum("budget_type").notNull().default("ad_set_budget"),
  dailyBudget: numeric("daily_budget", { precision: 12, scale: 2 }),
  totalBudget: numeric("total_budget", { precision: 12, scale: 2 }),
  amountSpent: numeric("amount_spent", { precision: 12, scale: 2 }).notNull().default("0"),
  impressions: integer("impressions").notNull().default(0),
  reach: integer("reach").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  results: integer("results").notNull().default(0),
  costPerResult: numeric("cost_per_result", { precision: 12, scale: 4 }),
  cpm: numeric("cpm", { precision: 12, scale: 4 }),
  ctr: numeric("ctr", { precision: 8, scale: 4 }),
  frequency: numeric("frequency", { precision: 8, scale: 4 }),
  delivery: deliveryStatusEnum("delivery").notNull().default("off"),
  startDate: text("start_date").notNull().default("2026-01-01"),
  endDate: text("end_date"),
  buyingType: text("buying_type").notNull().default("AUCTION"),
  specialCategories: text("special_categories"),
  abTestEnabled: boolean("ab_test_enabled").default(false),
  recommendation: text("recommendation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
