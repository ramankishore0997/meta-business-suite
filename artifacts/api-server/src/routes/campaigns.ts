import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateMetrics } from "../lib/metrics";

const router = Router();

function toApiCampaign(c: typeof campaignsTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    objective: c.objective,
    budgetType: c.budgetType,
    dailyBudget: c.dailyBudget ? parseFloat(c.dailyBudget) : null,
    totalBudget: c.totalBudget ? parseFloat(c.totalBudget) : null,
    amountSpent: parseFloat(c.amountSpent ?? "0"),
    impressions: c.impressions,
    reach: c.reach,
    clicks: c.clicks,
    results: c.results,
    costPerResult: c.costPerResult ? parseFloat(c.costPerResult) : null,
    cpm: c.cpm ? parseFloat(c.cpm) : null,
    ctr: c.ctr ? parseFloat(c.ctr) : null,
    frequency: c.frequency ? parseFloat(c.frequency) : null,
    delivery: c.delivery,
    startDate: c.startDate,
    endDate: c.endDate ?? null,
    buyingType: c.buyingType ?? null,
    specialCategories: c.specialCategories ?? null,
    abTestEnabled: c.abTestEnabled ?? false,
    recommendation: c.recommendation ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/campaigns", async (req, res) => {
  const campaigns = await db.select().from(campaignsTable).orderBy(campaignsTable.createdAt);
  res.json(campaigns.map(toApiCampaign));
});

router.post("/campaigns", async (req, res) => {
  const body = req.body;
  const spend = typeof body.amountSpent === "number" ? body.amountSpent : 0;
  const cpr = typeof body.costPerResult === "number" ? body.costPerResult : null;
  const m = generateMetrics(spend, cpr);
  const isLive = spend > 0;
  const [created] = await db.insert(campaignsTable).values({
    name: body.name,
    objective: body.objective ?? "TRAFFIC",
    budgetType: body.budgetType ?? "ad_set_budget",
    dailyBudget: body.dailyBudget?.toString() ?? null,
    totalBudget: body.totalBudget?.toString() ?? null,
    startDate: body.startDate ?? new Date().toISOString().split("T")[0],
    endDate: body.endDate ?? null,
    buyingType: body.buyingType ?? "AUCTION",
    specialCategories: body.specialCategories ?? null,
    abTestEnabled: body.abTestEnabled ?? false,
    status: isLive ? "ACTIVE" : "PAUSED",
    delivery: isLive ? "active" : "off",
    amountSpent: m.amountSpent,
    impressions: m.impressions,
    reach: m.reach,
    clicks: m.clicks,
    results: m.results,
    costPerResult: m.costPerResult,
    cpm: m.cpm,
    ctr: m.ctr,
    frequency: m.frequency,
  }).returning();
  res.status(201).json(toApiCampaign(created));
});

router.get("/campaigns/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toApiCampaign(campaign));
});

router.patch("/campaigns/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = req.body;
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = body.name;
  if (body.status != null) updates.status = body.status;
  if (body.objective != null) updates.objective = body.objective;
  if (body.budgetType != null) updates.budgetType = body.budgetType;
  if ("dailyBudget" in body) updates.dailyBudget = body.dailyBudget != null ? body.dailyBudget.toString() : null;
  if ("totalBudget" in body) updates.totalBudget = body.totalBudget != null ? body.totalBudget.toString() : null;
  if (body.startDate != null) updates.startDate = body.startDate;
  if ("endDate" in body) updates.endDate = body.endDate;
  if (body.buyingType != null) updates.buyingType = body.buyingType;
  if ("specialCategories" in body) updates.specialCategories = body.specialCategories;
  if (body.abTestEnabled != null) updates.abTestEnabled = body.abTestEnabled;
  if (typeof body.amountSpent === "number") {
    const cpr = typeof body.costPerResult === "number" ? body.costPerResult : null;
    const m = generateMetrics(body.amountSpent, cpr);
    const isLive = body.amountSpent > 0;
    updates.amountSpent = m.amountSpent;
    updates.impressions = m.impressions;
    updates.reach = m.reach;
    updates.clicks = m.clicks;
    updates.results = m.results;
    updates.costPerResult = m.costPerResult;
    updates.cpm = m.cpm;
    updates.ctr = m.ctr;
    updates.frequency = m.frequency;
    if (body.status == null) {
      updates.status = isLive ? "ACTIVE" : "PAUSED";
      updates.delivery = isLive ? "active" : "off";
    }
  }
  const [updated] = await db.update(campaignsTable).set(updates).where(eq(campaignsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toApiCampaign(updated));
});

router.delete("/campaigns/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(campaignsTable).where(eq(campaignsTable.id, id));
  res.status(204).send();
});

router.post("/campaigns/:id/toggle", async (req, res) => {
  const id = parseInt(req.params.id);
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
  const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  const newDelivery = newStatus === "ACTIVE" ? "active" : "off";
  const [updated] = await db.update(campaignsTable)
    .set({ status: newStatus, delivery: newDelivery })
    .where(eq(campaignsTable.id, id))
    .returning();
  res.json(toApiCampaign(updated));
});

router.post("/campaigns/:id/duplicate", async (req, res) => {
  const id = parseInt(req.params.id);
  const [original] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!original) { res.status(404).json({ error: "Not found" }); return; }
  const [copy] = await db.insert(campaignsTable).values({
    name: `${original.name} - Copy`,
    objective: original.objective,
    budgetType: original.budgetType,
    dailyBudget: original.dailyBudget,
    totalBudget: original.totalBudget,
    startDate: original.startDate,
    endDate: original.endDate,
    buyingType: original.buyingType,
    specialCategories: original.specialCategories,
    abTestEnabled: original.abTestEnabled,
    status: "PAUSED",
    delivery: "off",
    amountSpent: "0",
    impressions: 0,
    reach: 0,
    clicks: 0,
    results: 0,
  }).returning();
  res.status(201).json(toApiCampaign(copy));
});

export default router;
