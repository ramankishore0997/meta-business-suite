import { pgTable, serial, text, numeric, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adFormatEnum = pgEnum("ad_format", ["image", "video", "carousel", "collection", "stories"]);

export const adsTable = pgTable("ads", {
  id: serial("id").primaryKey(),
  adsetId: integer("adset_id").notNull(),
  campaignId: integer("campaign_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("PAUSED"),
  delivery: text("delivery").notNull().default("off"),
  format: adFormatEnum("format").notNull().default("image"),
  headline: text("headline"),
  primaryText: text("primary_text"),
  description: text("description"),
  callToAction: text("call_to_action"),
  destinationUrl: text("destination_url"),
  previewUrl: text("preview_url"),
  mediaUrl: text("media_url"),
  identityPage: text("identity_page"),
  instagramHandle: text("instagram_handle"),
  amountSpent: numeric("amount_spent", { precision: 12, scale: 2 }).notNull().default("0"),
  impressions: integer("impressions").notNull().default(0),
  reach: integer("reach").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  results: integer("results").notNull().default(0),
  costPerResult: numeric("cost_per_result", { precision: 12, scale: 4 }),
  cpm: numeric("cpm", { precision: 12, scale: 4 }),
  ctr: numeric("ctr", { precision: 8, scale: 4 }),
  frequency: numeric("frequency", { precision: 8, scale: 4 }),
  recommendation: text("recommendation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdSchema = createInsertSchema(adsTable).omit({ id: true, createdAt: true });
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof adsTable.$inferSelect;
