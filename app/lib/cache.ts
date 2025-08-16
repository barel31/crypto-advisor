interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly TTL: number = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new Cache();
