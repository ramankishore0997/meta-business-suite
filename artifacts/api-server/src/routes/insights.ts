import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db";

const router = Router();

router.get("/insights/summary", async (_req, res) => {
  const campaigns = await db.select().from(campaignsTable);
  const totalSpend = campaigns.reduce((s, c) => s + parseFloat(c.amountSpent ?? "0"), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalResults = campaigns.reduce((s, c) => s + c.results, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "ACTIVE").length;
  const withCpm = campaigns.filter(c => c.cpm != null);
  const avgCpm = withCpm.length ? withCpm.reduce((s, c) => s + parseFloat(c.cpm!), 0) / withCpm.length : 0;
  const withCtr = campaigns.filter(c => c.ctr != null);
  const avgCtr = withCtr.length ? withCtr.reduce((s, c) => s + parseFloat(c.ctr!), 0) / withCtr.length : 0;
  const avgCostPerResult = totalResults > 0 ? totalSpend / totalResults : null;

  res.json({
    totalSpend,
    totalImpressions,
    totalReach,
    totalClicks,
    totalResults,
    avgCpm,
    avgCtr,
    avgCostPerResult,
    activeCampaigns,
    totalCampaigns: campaigns.length,
  });
});

router.get("/insights/campaigns", async (_req, res) => {
  const campaigns = await db.select().from(campaignsTable);
  const insights = campaigns.map(c => ({
    campaignId: c.id,
    campaignName: c.name,
    spend: parseFloat(c.amountSpent ?? "0"),
    impressions: c.impressions,
    reach: c.reach,
    clicks: c.clicks,
    results: c.results,
    cpm: c.cpm ? parseFloat(c.cpm) : 0,
    ctr: c.ctr ? parseFloat(c.ctr) : 0,
  }));
  res.json(insights);
});

export default router;
