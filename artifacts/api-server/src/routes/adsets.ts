import { Router } from "express";
import { db } from "@workspace/db";
import { adsetsTable, campaignsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateMetrics } from "../lib/metrics";

const router = Router();

async function getCampaignName(campaignId: number): Promise<string> {
  const [c] = await db.select({ name: campaignsTable.name }).from(campaignsTable).where(eq(campaignsTable.id, campaignId));
  return c?.name ?? "Unknown Campaign";
}

function toApiAdSet(a: typeof adsetsTable.$inferSelect, campaignName: string) {
  return {
    id: a.id,
    campaignId: a.campaignId,
    campaignName,
    name: a.name,
    status: a.status,
    delivery: a.delivery,
    budgetType: a.budgetType,
    budget: a.budget ? parseFloat(a.budget) : null,
    amountSpent: parseFloat(a.amountSpent ?? "0"),
    impressions: a.impressions,
    reach: a.reach,
    clicks: a.clicks,
    results: a.results,
    costPerResult: a.costPerResult ? parseFloat(a.costPerResult) : null,
    cpm: a.cpm ? parseFloat(a.cpm) : null,
    ctr: a.ctr ? parseFloat(a.ctr) : null,
    frequency: a.frequency ? parseFloat(a.frequency) : null,
    audience: a.audience ?? null,
    placement: a.placement ?? null,
    optimization: a.optimization ?? null,
    billingEvent: a.billingEvent ?? null,
    conversionLocation: a.conversionLocation ?? null,
    facebookPage: a.facebookPage ?? null,
    performanceGoal: a.performanceGoal ?? null,
    gender: a.gender ?? null,
    ageMin: a.ageMin ?? null,
    ageMax: a.ageMax ?? null,
    languages: a.languages ?? null,
    location: a.location ?? null,
    detailedTargeting: a.detailedTargeting ?? null,
    placementMode: a.placementMode ?? null,
    startDate: a.startDate,
    endDate: a.endDate ?? null,
    recommendation: a.recommendation ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/adsets", async (req, res) => {
  const adsets = await db.select().from(adsetsTable).orderBy(adsetsTable.createdAt);
  const results = await Promise.all(adsets.map(async (a) => {
    const name = await getCampaignName(a.campaignId);
    return toApiAdSet(a, name);
  }));
  res.json(results);
});

router.post("/adsets", async (req, res) => {
  const body = req.body;
  const spend = typeof body.amountSpent === "number" ? body.amountSpent : 0;
  const cpr = typeof body.costPerResult === "number" ? body.costPerResult : null;
  const m = generateMetrics(spend, cpr);
  const isLive = spend > 0;
  const [created] = await db.insert(adsetsTable).values({
    campaignId: body.campaignId,
    name: body.name,
    budgetType: body.budgetType ?? "daily",
    budget: body.budget?.toString() ?? null,
    audience: body.audience ?? null,
    placement: body.placement ?? null,
    optimization: body.optimization ?? null,
    conversionLocation: body.conversionLocation ?? null,
    facebookPage: body.facebookPage ?? null,
    performanceGoal: body.performanceGoal ?? null,
    gender: body.gender ?? "all",
    ageMin: body.ageMin ?? 18,
    ageMax: body.ageMax ?? 65,
    languages: body.languages ?? null,
    location: body.location ?? null,
    detailedTargeting: body.detailedTargeting ?? null,
    placementMode: body.placementMode ?? "advantage_plus",
    startDate: body.startDate ?? new Date().toISOString().split("T")[0],
    endDate: body.endDate ?? null,
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
  const campaignName = await getCampaignName(created.campaignId);
  res.status(201).json(toApiAdSet(created, campaignName));
});

router.get("/adsets/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [adset] = await db.select().from(adsetsTable).where(eq(adsetsTable.id, id));
  if (!adset) { res.status(404).json({ error: "Not found" }); return; }
  const campaignName = await getCampaignName(adset.campaignId);
  res.json(toApiAdSet(adset, campaignName));
});

router.patch("/adsets/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = req.body;
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = body.name;
  if (body.status != null) updates.status = body.status;
  if (body.budgetType != null) updates.budgetType = body.budgetType;
  if ("budget" in body) updates.budget = body.budget != null ? body.budget.toString() : null;
  if ("audience" in body) updates.audience = body.audience;
  if ("conversionLocation" in body) updates.conversionLocation = body.conversionLocation;
  if ("facebookPage" in body) updates.facebookPage = body.facebookPage;
  if ("performanceGoal" in body) updates.performanceGoal = body.performanceGoal;
  if (body.gender != null) updates.gender = body.gender;
  if (body.ageMin != null) updates.ageMin = body.ageMin;
  if (body.ageMax != null) updates.ageMax = body.ageMax;
  if ("languages" in body) updates.languages = body.languages;
  if ("location" in body) updates.location = body.location;
  if ("detailedTargeting" in body) updates.detailedTargeting = body.detailedTargeting;
  if (body.placementMode != null) updates.placementMode = body.placementMode;
  if ("placement" in body) updates.placement = body.placement;
  if (body.startDate != null) updates.startDate = body.startDate;
  if ("endDate" in body) updates.endDate = body.endDate;
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
  const [updated] = await db.update(adsetsTable).set(updates).where(eq(adsetsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const campaignName = await getCampaignName(updated.campaignId);
  res.json(toApiAdSet(updated, campaignName));
});

router.delete("/adsets/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(adsetsTable).where(eq(adsetsTable.id, id));
  res.status(204).send();
});

router.post("/adsets/:id/toggle", async (req, res) => {
  const id = parseInt(req.params.id);
  const [adset] = await db.select().from(adsetsTable).where(eq(adsetsTable.id, id));
  if (!adset) { res.status(404).json({ error: "Not found" }); return; }
  const newStatus = adset.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  const newDelivery = newStatus === "ACTIVE" ? "active" : "off";
  const [updated] = await db.update(adsetsTable).set({ status: newStatus, delivery: newDelivery }).where(eq(adsetsTable.id, id)).returning();
  const campaignName = await getCampaignName(updated.campaignId);
  res.json(toApiAdSet(updated, campaignName));
});

router.post("/adsets/:id/duplicate", async (req, res) => {
  const id = parseInt(req.params.id);
  const [original] = await db.select().from(adsetsTable).where(eq(adsetsTable.id, id));
  if (!original) { res.status(404).json({ error: "Not found" }); return; }
  const [copy] = await db.insert(adsetsTable).values({
    campaignId: original.campaignId,
    name: `${original.name} - Copy`,
    budgetType: original.budgetType,
    budget: original.budget,
    audience: original.audience,
    placement: original.placement,
    optimization: original.optimization,
    conversionLocation: original.conversionLocation,
    facebookPage: original.facebookPage,
    performanceGoal: original.performanceGoal,
    gender: original.gender,
    ageMin: original.ageMin,
    ageMax: original.ageMax,
    languages: original.languages,
    location: original.location,
    detailedTargeting: original.detailedTargeting,
    placementMode: original.placementMode,
    startDate: original.startDate,
    endDate: original.endDate,
    status: "PAUSED",
    delivery: "off",
    amountSpent: "0",
    impressions: 0,
    reach: 0,
    clicks: 0,
    results: 0,
  }).returning();
  const campaignName = await getCampaignName(copy.campaignId);
  res.status(201).json(toApiAdSet(copy, campaignName));
});

export default router;
