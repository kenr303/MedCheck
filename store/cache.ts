import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  lastProduct: "medcheck_last_product",
  lastRaw: "medcheck_last_raw",
  recentSearches: "medcheck_recent_searches",
  priceCache: "medcheck_price_cache",
};

export async function saveLastProduct(product: any, raw: any) {
  try {
    await AsyncStorage.setItem(KEYS.lastProduct, JSON.stringify(product));
    if (raw) await AsyncStorage.setItem(KEYS.lastRaw, JSON.stringify(raw));
  } catch {}
}

export async function loadLastProduct(): Promise<{
  product: any;
  raw: any;
} | null> {
  try {
    const p = await AsyncStorage.getItem(KEYS.lastProduct);
    const r = await AsyncStorage.getItem(KEYS.lastRaw);
    if (!p) return null;
    return { product: JSON.parse(p), raw: r ? JSON.parse(r) : null };
  } catch {
    return null;
  }
}

export async function saveRecentSearches(searches: string[]) {
  try {
    await AsyncStorage.setItem(KEYS.recentSearches, JSON.stringify(searches));
  } catch {}
}

export async function loadRecentSearches(): Promise<string[]> {
  try {
    const s = await AsyncStorage.getItem(KEYS.recentSearches);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export async function savePriceResult(key: string, result: any) {
  try {
    const existing = await AsyncStorage.getItem(KEYS.priceCache);
    const cache = existing ? JSON.parse(existing) : {};
    cache[key] = { result, timestamp: Date.now() };
    await AsyncStorage.setItem(KEYS.priceCache, JSON.stringify(cache));
  } catch {}
}

export async function loadPriceResult(key: string): Promise<any | null> {
  try {
    const existing = await AsyncStorage.getItem(KEYS.priceCache);
    if (!existing) return null;
    const cache = JSON.parse(existing);
    const entry = cache[key];
    if (!entry) return null;
    // Cache valid for 24 hours
    if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) return null;
    return entry.result;
  } catch {
    return null;
  }
}
