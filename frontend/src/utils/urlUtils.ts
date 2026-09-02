import type { KeyValuePair } from '../types/workbench';

export interface SplitUrlResult {
  baseUrl: string;
  queryString: string;
  hash: string;
}

export function splitUrl(rawUrl: string): SplitUrlResult {
  if (!rawUrl) return { baseUrl: '', queryString: '', hash: '' };

  let url = rawUrl.trim();
  let hash = '';
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    hash = url.substring(hashIndex);
    url = url.substring(0, hashIndex);
  }

  let queryString = '';
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    queryString = url.substring(queryIndex + 1);
    url = url.substring(0, queryIndex);
  }

  return {
    baseUrl: url,
    queryString,
    hash,
  };
}

export function parseQueryString(queryString: string): { key: string; value: string }[] {
  if (!queryString || !queryString.trim()) return [];

  const pairs: { key: string; value: string }[] = [];
  const entries = queryString.split('&');

  for (const entry of entries) {
    if (!entry) continue;
    const eqIdx = entry.indexOf('=');
    if (eqIdx === -1) {
      const rawKey = entry.trim();
      if (!rawKey) continue;
      try {
        pairs.push({ key: decodeURIComponent(rawKey), value: '' });
      } catch {
        pairs.push({ key: rawKey, value: '' });
      }
    } else {
      const rawKey = entry.substring(0, eqIdx).trim();
      const rawVal = entry.substring(eqIdx + 1);
      if (!rawKey) continue;
      let key = rawKey;
      let val = rawVal;
      try {
        key = decodeURIComponent(rawKey);
      } catch {}
      try {
        val = decodeURIComponent(rawVal);
      } catch {}
      pairs.push({ key, value: val });
    }
  }

  return pairs;
}

export function buildUrlWithParams(baseUrl: string, params: KeyValuePair[], hash: string = ''): string {
  const enabledParams = params.filter((p) => p.enabled && p.key.trim() !== '');

  const paramMap = new Map<string, string>();
  for (const p of enabledParams) {
    paramMap.set(p.key.trim(), p.value);
  }

  if (paramMap.size === 0) {
    return `${baseUrl}${hash}`;
  }

  const queryParts: string[] = [];
  for (const [key, value] of paramMap.entries()) {
    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }

  const queryStr = queryParts.join('&');
  return `${baseUrl}?${queryStr}${hash}`;
}

export function mergeUrlAndParams(rawUrl: string, params: KeyValuePair[]): string {
  const { baseUrl, queryString, hash } = splitUrl(rawUrl);
  const urlPairs = parseQueryString(queryString);
  const enabledParams = params.filter((p) => p.enabled && p.key.trim() !== '');

  const paramMap = new Map<string, string>();
  for (const pair of urlPairs) {
    paramMap.set(pair.key, pair.value);
  }

  for (const p of enabledParams) {
    paramMap.set(p.key.trim(), p.value);
  }

  if (paramMap.size === 0) {
    return `${baseUrl}${hash}`;
  }

  const queryParts: string[] = [];
  for (const [key, value] of paramMap.entries()) {
    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }

  const queryStr = queryParts.join('&');
  return `${baseUrl}?${queryStr}${hash}`;
}

export function mergeUrlAndParamsMap(
  rawUrl: string,
  paramsMap: Record<string, string>
): { cleanUrl: string; mergedParams: Record<string, string> } {
  const { baseUrl, queryString } = splitUrl(rawUrl);
  const urlPairs = parseQueryString(queryString);

  const merged: Record<string, string> = {};

  for (const pair of urlPairs) {
    merged[pair.key] = pair.value;
  }

  for (const [k, v] of Object.entries(paramsMap)) {
    const cleanKey = k.trim();
    if (cleanKey) {
      merged[cleanKey] = v;
    }
  }

  return {
    cleanUrl: baseUrl,
    mergedParams: merged,
  };
}

export function syncParamsFromUrl(newUrl: string, prevParams: KeyValuePair[]): KeyValuePair[] {
  const { queryString } = splitUrl(newUrl);
  const parsedPairs = parseQueryString(queryString);

  if (parsedPairs.length === 0) {
    return [];
  }

  const updated: KeyValuePair[] = [];
  const usedIndices = new Set<number>();

  for (const pair of parsedPairs) {
    const idx = prevParams.findIndex(
      (p, i) => !usedIndices.has(i) && p.key.trim() === pair.key.trim()
    );

    if (idx >= 0) {
      usedIndices.add(idx);
      updated.push({
        ...prevParams[idx],
        key: pair.key,
        value: pair.value,
        enabled: true,
      });
    } else {
      updated.push({
        id: `kv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        key: pair.key,
        value: pair.value,
        description: '',
        enabled: true,
      });
    }
  }

  return updated;
}
