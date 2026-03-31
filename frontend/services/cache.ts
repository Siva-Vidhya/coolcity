type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();

export function getCachedValue<T>(key: string) {
  const entry = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

export function setCachedValue<T>(key: string, value: T, ttlMs = 5 * 60 * 1000) {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
  return value;
}

export async function withCachedPromise<T>(key: string, factory: () => Promise<T>, ttlMs = 5 * 60 * 1000) {
  const cached = getCachedValue<T>(key);
  if (cached) {
    return cached;
  }
  const value = await factory();
  return setCachedValue(key, value, ttlMs);
}
