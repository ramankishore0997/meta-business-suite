function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export interface GeneratedMetrics {
  amountSpent: string;
  impressions: number;
  reach: number;
  clicks: number;
  results: number;
  costPerResult: string | null;
  cpm: string;
  ctr: string;
  frequency: string;
}

/**
 * Given a spend amount (in dollars), generate realistic-looking ad performance
 * metrics so a demo campaign reads like a genuine running campaign rather than
 * round/fake numbers.
 *
 * When `costPerResultInput` is supplied (> 0) the results count is derived from
 * spend / cost per result so the numbers honour the value the user asked for,
 * and the stored cost per result matches it exactly. Otherwise a plausible
 * conversion rate is used to invent the results.
 */
export function generateMetrics(
  amountSpent: number,
  costPerResultInput?: number | null,
): GeneratedMetrics {
  const spend = Math.max(0, amountSpent);

  if (spend <= 0) {
    return {
      amountSpent: "0",
      impressions: 0,
      reach: 0,
      clicks: 0,
      results: 0,
      costPerResult: null,
      cpm: "0",
      ctr: "0",
      frequency: "0",
    };
  }

  const cpm = rand(2.4, 6.8);
  const impressions = Math.round((spend / cpm) * 1000);
  const frequency = rand(1.1, 1.9);
  const reach = Math.max(1, Math.round(impressions / frequency));

  let results: number;
  let costPerResult: number;

  if (typeof costPerResultInput === "number" && costPerResultInput > 0) {
    // Honour the intended cost per result: derive results from it.
    results = Math.max(1, Math.round(spend / costPerResultInput));
    costPerResult = costPerResultInput;
  } else {
    const conversionRate = rand(4, 14);
    const baseClicks = Math.max(1, Math.round((impressions * rand(0.9, 3.4)) / 100));
    results = Math.max(1, Math.round((baseClicks * conversionRate) / 100));
    costPerResult = spend / results;
  }

  // Clicks are kept consistent with results (there are always at least as many
  // clicks as results) and used to derive CTR so the numbers reconcile.
  const clicks = Math.max(results, Math.round(results * rand(3, 8)));
  const ctr = (clicks / impressions) * 100;

  return {
    amountSpent: spend.toFixed(2),
    impressions,
    reach,
    clicks,
    results,
    costPerResult: costPerResult.toFixed(4),
    cpm: cpm.toFixed(4),
    ctr: ctr.toFixed(4),
    frequency: frequency.toFixed(4),
  };
}
