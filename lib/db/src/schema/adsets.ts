import { pgTable, serial, text, numeric, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adSetBudgetTypeEnum = pgEnum("adset_budget_type", ["daily", "lifetime"]);

export const adsetsTable = pgTable("adsets", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("PAUSED"),
  delivery: text("delivery").notNull().default("off"),
  budgetType: adSetBudgetTypeEnum("budget_type").notNull().default("daily"),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  amountSpent: numeric("amount_spent", { precision: 12, scale: 2 }).notNull().default("0"),
  impressions: integer("impressions").notNull().default(0),
  reach: integer("reach").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  results: integer("results").notNull().default(0),
  costPerResult: numeric("cost_per_result", { precision: 12, scale: 4 }),
  cpm: numeric("cpm", { precision: 12, scale: 4 }),
  ctr: numeric("ctr", { precision: 8, scale: 4 }),
  frequency: numeric("frequency", { precision: 8, scale: 4 }),
  audience: text("audience"),
  placement: text("placement"),
  optimization: text("optimization"),
  billingEvent: text("billing_event"),
  conversionLocation: text("conversion_location"),
  facebookPage: text("facebook_page"),
  performanceGoal: text("performance_goal"),
  gender: text("gender").notNull().default("all"),
  ageMin: integer("age_min").notNull().default(18),
  ageMax: integer("age_max").notNull().default(65),
  languages: text("languages"),
  location: text("location"),
  detailedTargeting: text("detailed_targeting"),
  placementMode: text("placement_mode").notNull().default("advantage_plus"),
  startDate: text("start_date").notNull().default("2026-01-01"),
  endDate: text("end_date"),
  recommendation: text("recommendation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdSetSchema = createInsertSchema(adsetsTable).omit({ id: true, createdAt: true });
export type InsertAdSet = z.infer<typeof insertAdSetSchema>;
export type AdSet = typeof adsetsTable.$inferSelect;
