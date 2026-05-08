import assert from "node:assert/strict";
import { createRequire } from "node:module";

import "ts-node/register";

const require = createRequire(import.meta.url);
const {
  fetchCatalogStats,
  normalizeCatalogStats,
} = require("../src/components/HomepageToolStrip/catalogStats.ts");

const validResponse = {
  success: true,
  message: "OK",
  data: {
    providerCount: 335,
    actionCount: 4042,
  },
};

assert.deepEqual(normalizeCatalogStats(validResponse), {
  providerCount: 335,
  actionCount: 4042,
});

for (const response of [
  null,
  {},
  { success: false, data: validResponse.data },
  { success: true, data: { providerCount: 1.5, actionCount: 4042 } },
  { success: true, data: { providerCount: -1, actionCount: 4042 } },
  { success: true, data: { providerCount: 335, actionCount: Infinity } },
  { success: true, data: { providerCount: "335", actionCount: 4042 } },
]) {
  assert.equal(normalizeCatalogStats(response), undefined);
}

const signal = new globalThis.AbortController().signal;
const fetchedStats = await fetchCatalogStats({
  endpoint: "https://example.test/catalog",
  signal,
  fetchImpl: async (endpoint, init) => {
    assert.equal(endpoint, "https://example.test/catalog");
    assert.equal(init?.signal, signal);

    return {
      ok: true,
      json: async () => validResponse,
    };
  },
});

assert.deepEqual(fetchedStats, {
  providerCount: 335,
  actionCount: 4042,
});

const failedStats = await fetchCatalogStats({
  fetchImpl: async () => ({
    ok: false,
    status: 500,
    json: async () => validResponse,
  }),
});

assert.equal(failedStats, undefined);

const invalidStats = await fetchCatalogStats({
  fetchImpl: async () => ({
    ok: true,
    json: async () => ({ success: true, data: {} }),
  }),
});

assert.equal(invalidStats, undefined);

console.log(
  "Catalog stats validation and client fetch fallback behavior pass."
);
