export const CATALOG_ENDPOINT = "https://connector.oomol.com/v1/catalog";

export type CatalogStats = {
  providerCount: number;
  actionCount: number;
};

type CatalogStatsResponse = {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
};

type FetchCatalogStatsOptions = {
  endpoint?: string;
  signal?: AbortSignal;
  fetchImpl?: (
    input: string,
    init?: { signal?: AbortSignal }
  ) => Promise<CatalogStatsResponse>;
};

function isValidCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function normalizeCatalogStats(
  value: unknown
): CatalogStats | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const result = value as {
    success?: unknown;
    data?: {
      providerCount?: unknown;
      actionCount?: unknown;
    };
  };
  const providerCount = result.data?.providerCount;
  const actionCount = result.data?.actionCount;

  if (
    result.success !== true ||
    !isValidCount(providerCount) ||
    !isValidCount(actionCount)
  ) {
    return undefined;
  }

  return {
    providerCount,
    actionCount,
  };
}

export async function fetchCatalogStats({
  endpoint = CATALOG_ENDPOINT,
  signal,
  fetchImpl = fetch,
}: FetchCatalogStatsOptions = {}): Promise<CatalogStats | undefined> {
  try {
    const response = await fetchImpl(endpoint, signal ? { signal } : undefined);

    if (!response.ok) {
      return undefined;
    }

    return normalizeCatalogStats(await response.json());
  } catch {
    return undefined;
  }
}
