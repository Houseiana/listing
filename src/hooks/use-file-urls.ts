import { useEffect, useRef } from 'react';

export function useFileUrls(
  items: ReadonlyArray<File | string | null | undefined>
): string[] {
  const cacheRef = useRef<Map<File, string>>(new Map());
  const cache = cacheRef.current;

  const urls = items.map((item) => {
    if (item instanceof File) {
      let url = cache.get(item);
      if (!url) {
        url = URL.createObjectURL(item);
        cache.set(item, url);
      }
      return url;
    }
    if (typeof item === 'string') return item;
    return '';
  });

  useEffect(() => {
    const active = new Set<File>();
    for (const item of items) {
      if (item instanceof File) active.add(item);
    }
    for (const [file, url] of cache.entries()) {
      if (!active.has(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    }
  });

  useEffect(() => {
    return () => {
      const map = cacheRef.current;
      for (const url of map.values()) {
        URL.revokeObjectURL(url);
      }
      map.clear();
    };
  }, []);

  return urls;
}
