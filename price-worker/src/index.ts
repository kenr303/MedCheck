/**
 * MedCheck Price Worker — Cloudflare Worker
 *
 * Runs on a cron schedule (twice daily) to fetch the latest generic drug
 * acquisition costs from the CMS NADAC database and compute estimated
 * retail prices per store. Results are cached in Cloudflare KV and served
 * to the MedCheck app via a simple JSON endpoint.
 *
 * Data source: CMS NADAC (National Average Drug Acquisition Cost)
 *   https://data.cms.gov/resource/tau9-gfwr.json
 *   Updated weekly by CMS. Free, no API key required.
 *
 * IMPORTANT: Prices are ESTIMATES derived from acquisition costs × markup
 * ratios. Always direct users to verify prices at the pharmacy.
 */

import {
  DrugDefinition,
  DRUGS,
  STORE_BRANDS,
  STORE_MULTIPLIERS,
  STORE_URLS,
} from "./drugs";

export interface Env {
  PRICE_CACHE: KVNamespace;
  // Optional: set REFRESH_SECRET in worker env vars to protect /refresh
  REFRESH_SECRET?: string;
}

// ── Types ──────────────────────────────────────────────────────────────────

type PriceItem = {
  name: string;
  store: string;
  count: string;
  price: number;
  pricePerPill: number;
  isGeneric: boolean;
  url: string;
};

type DrugPrices = {
  genericName: string;
  strength: string;
  items: PriceItem[];
};

type PriceCache = {
  updatedAt: string; // ISO timestamp
  source: "NADAC/CMS";
  isEstimate: true;
  disclaimer: string;
  prices: Record<string, DrugPrices>;
};

type NADACRow = {
  ndc_description: string;
  nadac_per_unit: string;
  as_of_date: string;
  classification_for_rate_setting: string; // "G" = generic, "B" = brand
};

// ── NADAC fetch ────────────────────────────────────────────────────────────

async function fetchNADACPerUnit(
  drug: DrugDefinition,
): Promise<number | null> {
  const url = new URL("https://data.cms.gov/resource/tau9-gfwr.json");
  url.searchParams.set(
    "$where",
    `upper(ndc_description) like upper('%${drug.nadacSearch}%') AND classification_for_rate_setting='G'`,
  );
  url.searchParams.set("$limit", "5");
  url.searchParams.set("$order", "as_of_date DESC");

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      // 8-second timeout via signal
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const rows: NADACRow[] = await res.json();
    if (!rows.length) return null;

    // Average the top results to smooth out outliers
    const costs = rows
      .map((r) => parseFloat(r.nadac_per_unit))
      .filter((n) => !isNaN(n) && n > 0);
    if (!costs.length) return null;

    return costs.reduce((a, b) => a + b, 0) / costs.length;
  } catch {
    return null;
  }
}

// ── Price builder ──────────────────────────────────────────────────────────

function buildDrugPrices(
  drug: DrugDefinition,
  nadacPerUnit: number,
): DrugPrices {
  const stores = ["Walmart", "CVS", "Amazon", "Walgreens"];
  const countLabel = `${drug.packSize} ct`;
  const searchQuery = `${drug.genericName} ${drug.strength} ${drug.packSize}ct`;

  const items: PriceItem[] = stores.map((store) => {
    const multiplier = STORE_MULTIPLIERS[store];
    const retailPerUnit = nadacPerUnit * multiplier;
    const packPrice = parseFloat((retailPerUnit * drug.packSize).toFixed(2));
    const perPill = parseFloat(retailPerUnit.toFixed(2));
    const brandLabel = STORE_BRANDS[store];

    return {
      name: `${brandLabel} ${drug.genericName}`,
      store,
      count: countLabel,
      price: packPrice,
      pricePerPill: perPill,
      isGeneric: true,
      url: STORE_URLS[store](searchQuery),
    };
  });

  // Sort cheapest first
  items.sort((a, b) => a.price - b.price);

  return {
    genericName: drug.genericName,
    strength: drug.strength,
    items,
  };
}

// ── Refresh all prices ─────────────────────────────────────────────────────

async function refreshAllPrices(env: Env): Promise<PriceCache> {
  const prices: Record<string, DrugPrices> = {};
  const errors: string[] = [];

  for (const drug of DRUGS) {
    try {
      const nadacPerUnit = await fetchNADACPerUnit(drug);

      if (nadacPerUnit !== null) {
        prices[drug.key] = buildDrugPrices(drug, nadacPerUnit);
      } else {
        errors.push(drug.key);
        console.warn(`NADAC lookup failed for ${drug.key}`);
      }
    } catch (err) {
      errors.push(drug.key);
      console.error(`Error processing ${drug.key}:`, err);
    }

    // Be respectful to the CMS API — 600ms between requests
    await new Promise((r) => setTimeout(r, 600));
  }

  const cache: PriceCache = {
    updatedAt: new Date().toISOString(),
    source: "NADAC/CMS",
    isEstimate: true,
    disclaimer:
      "Prices are estimates derived from CMS acquisition costs. Verify at pharmacy before purchase.",
    prices,
  };

  if (errors.length) {
    console.warn(`${errors.length} drugs failed to update:`, errors.join(", "));
  }

  await env.PRICE_CACHE.put("prices_v1", JSON.stringify(cache), {
    // KV TTL: 14 hours — cron runs every 12 hours so there's always fresh data
    expirationTtl: 14 * 60 * 60,
  });

  console.log(
    `Price refresh complete. ${Object.keys(prices).length}/${DRUGS.length} drugs updated.`,
  );
  return cache;
}

// ── CORS helper ────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

// ── HTTP handler ───────────────────────────────────────────────────────────

async function handleRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);

  // GET /prices?drug=acetaminophen  — returns one drug
  // GET /prices                     — returns all drugs
  if (url.pathname === "/prices" || url.pathname === "/") {
    const cached = await env.PRICE_CACHE.get("prices_v1", "json") as PriceCache | null;

    if (!cached) {
      return json(
        {
          error: "Price data not yet available. Cron may not have run yet.",
          hint: "Call POST /refresh to seed the cache manually.",
        },
        503,
      );
    }

    const drugKey = url.searchParams.get("drug");
    if (drugKey) {
      const drugData = cached.prices[drugKey] ?? null;
      return json({
        drug: drugKey,
        updatedAt: cached.updatedAt,
        source: cached.source,
        isEstimate: cached.isEstimate,
        disclaimer: cached.disclaimer,
        data: drugData,
      });
    }

    // Return full cache
    return json(cached);
  }

  // POST /refresh  — manually trigger a price update (protect with secret in prod)
  if (url.pathname === "/refresh" && request.method === "POST") {
    const secret = url.searchParams.get("secret");
    if (env.REFRESH_SECRET && secret !== env.REFRESH_SECRET) {
      return json({ error: "Unauthorized" }, 401);
    }
    const result = await refreshAllPrices(env);
    return json({
      ok: true,
      updatedAt: result.updatedAt,
      drugsUpdated: Object.keys(result.prices).length,
    });
  }

  return json({ error: "Not found" }, 404);
}

// ── Worker export ──────────────────────────────────────────────────────────

export default {
  // HTTP requests from the app
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },

  // Cron trigger — runs at 6am and 6pm UTC daily
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(refreshAllPrices(env));
  },
};
