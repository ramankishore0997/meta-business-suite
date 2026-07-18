import { Router } from "express";
import { db } from "@workspace/db";
import { adsTable, adsetsTable, campaignsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateMetrics } from "../lib/metrics";

const router = Router();

async function getNames(adsetId: number, campaignId: number) {
  const [adset] = await db.select({ name: adsetsTable.name }).from(adsetsTable).where(eq(adsetsTable.id, adsetId));
  const [campaign] = await db.select({ name: campaignsTable.name }).from(campaignsTable).where(eq(campaignsTable.id, campaignId));
  return { adsetName: adset?.name ?? "Unknown Ad Set", campaignName: campaign?.name ?? "Unknown Campaign" };
}

function toApiAd(a: typeof adsTable.$inferSelect, adsetName: string, campaignName: string) {
  return {
    id: a.id,
    adsetId: a.adsetId,
    adsetName,
    campaignId: a.campaignId,
    campaignName,
    name: a.name,
    status: a.status,
    delivery: a.delivery,
    format: a.format,
    headline: a.headline ?? null,
    primaryText: a.primaryText ?? null,
    description: a.description ?? null,
    callToAction: a.callToAction ?? null,
    destinationUrl: a.destinationUrl ?? null,
    previewUrl: a.previewUrl ?? null,
    mediaUrl: a.mediaUrl ?? null,
    identityPage: a.identityPage ?? null,
    instagramHandle: a.instagramHandle ?? null,
    amountSpent: parseFloat(a.amountSpent ?? "0"),
    impressions: a.impressions,
    reach: a.reach,
    clicks: a.clicks,
    results: a.results,
    costPerResult: a.costPerResult ? parseFloat(a.costPerResult) : null,
    cpm: a.cpm ? parseFloat(a.cpm) : null,
    ctr: a.ctr ? parseFloat(a.ctr) : null,
    frequency: a.frequency ? parseFloat(a.frequency) : null,
    recommendation: a.recommendation ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/ads", async (req, res) => {
  const ads = await db.select().from(adsTable).orderBy(adsTable.createdAt);
  const results = await Promise.all(ads.map(async (a) => {
    const { adsetName, campaignName } = await getNames(a.adsetId, a.campaignId);
    return toApiAd(a, adsetName, campaignName);
  }));
  res.json(results);
});

router.post("/ads", async (req, res) => {
  const body = req.body;
  const [adset] = await db.select({ campaignId: adsetsTable.campaignId }).from(adsetsTable).where(eq(adsetsTable.id, body.adsetId));
  const campaignId = adset?.campaignId ?? 0;
  const spend = typeof body.amountSpent === "number" ? body.amountSpent : 0;
  const cpr = typeof body.costPerResult === "number" ? body.costPerResult : null;
  const m = generateMetrics(spend, cpr);
  const isLive = spend > 0;
  const [created] = await db.insert(adsTable).values({
    adsetId: body.adsetId,
    campaignId,
    name: body.name,
    format: body.format ?? "image",
    headline: body.headline ?? null,
    primaryText: body.primaryText ?? null,
    description: body.description ?? null,
    callToAction: body.callToAction ?? null,
    destinationUrl: body.destinationUrl ?? null,
    mediaUrl: body.mediaUrl ?? null,
    identityPage: body.identityPage ?? null,
    instagramHandle: body.instagramHandle ?? null,
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
  const { adsetName, campaignName } = await getNames(created.adsetId, created.campaignId);
  res.status(201).json(toApiAd(created, adsetName, campaignName));
});

router.get("/ads/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [ad] = await db.select().from(adsTable).where(eq(adsTable.id, id));
  if (!ad) { res.status(404).json({ error: "Not found" }); return; }
  const { adsetName, campaignName } = await getNames(ad.adsetId, ad.campaignId);
  res.json(toApiAd(ad, adsetName, campaignName));
});

router.patch("/ads/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = req.body;
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = body.name;
  if (body.status != null) updates.status = body.status;
  if (body.format != null) updates.format = body.format;
  if ("headline" in body) updates.headline = body.headline;
  if ("primaryText" in body) updates.primaryText = body.primaryText;
  if ("description" in body) updates.description = body.description;
  if ("callToAction" in body) updates.callToAction = body.callToAction;
  if ("destinationUrl" in body) updates.destinationUrl = body.destinationUrl;
  if ("mediaUrl" in body) updates.mediaUrl = body.mediaUrl;
  if ("identityPage" in body) updates.identityPage = body.identityPage;
  if ("instagramHandle" in body) updates.instagramHandle = body.instagramHandle;
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
  const [updated] = await db.update(adsTable).set(updates).where(eq(adsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const { adsetName, campaignName } = await getNames(updated.adsetId, updated.campaignId);
  res.json(toApiAd(updated, adsetName, campaignName));
});

router.delete("/ads/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(adsTable).where(eq(adsTable.id, id));
  res.status(204).send();
});

router.post("/ads/:id/toggle", async (req, res) => {
  const id = parseInt(req.params.id);
  const [ad] = await db.select().from(adsTable).where(eq(adsTable.id, id));
  if (!ad) { res.status(404).json({ error: "Not found" }); return; }
  const newStatus = ad.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  const newDelivery = newStatus === "ACTIVE" ? "active" : "off";
  const [updated] = await db.update(adsTable).set({ status: newStatus, delivery: newDelivery }).where(eq(adsTable.id, id)).returning();
  const { adsetName, campaignName } = await getNames(updated.adsetId, updated.campaignId);
  res.json(toApiAd(updated, adsetName, campaignName));
});

router.post("/ads/:id/duplicate", async (req, res) => {
  const id = parseInt(req.params.id);
  const [original] = await db.select().from(adsTable).where(eq(adsTable.id, id));
  if (!original) { res.status(404).json({ error: "Not found" }); return; }
  const [copy] = await db.insert(adsTable).values({
    adsetId: original.adsetId,
    campaignId: original.campaignId,
    name: `${original.name} - Copy`,
    format: original.format,
    headline: original.headline,
    primaryText: original.primaryText,
    description: original.description,
    callToAction: original.callToAction,
    destinationUrl: original.destinationUrl,
    mediaUrl: original.mediaUrl,
    identityPage: original.identityPage,
    instagramHandle: original.instagramHandle,
    status: "PAUSED",
    delivery: "off",
    amountSpent: "0",
    impressions: 0,
    reach: 0,
    clicks: 0,
    results: 0,
  }).returning();
  const { adsetName, campaignName } = await getNames(copy.adsetId, copy.campaignId);
  res.status(201).json(toApiAd(copy, adsetName, campaignName));
});

export default router;
