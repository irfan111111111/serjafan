import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.SERJAFAN_TEST_BASE_URL;

test("production health and readiness endpoints respond", async (t) => {
  if (!baseUrl) {
    t.skip("Set SERJAFAN_TEST_BASE_URL=https://serjafan.my.id to run production smoke checks.");
    return;
  }

  for (const path of ["/api/health", "/api/production/status"]) {
    const response = await fetch(new URL(path, baseUrl));
    assert.equal(response.ok, true, `${path} should return a 2xx response`);
    const payload = await response.json();
    assert.equal(typeof payload, "object");
  }
});

test("public app routes load HTML", async (t) => {
  if (!baseUrl) {
    t.skip("Set SERJAFAN_TEST_BASE_URL=https://serjafan.my.id to run production route smoke checks.");
    return;
  }

  for (const path of ["/customer", "/partner", "/admin"]) {
    const response = await fetch(new URL(path, baseUrl));
    assert.equal(response.ok, true, `${path} should return a 2xx response`);
    const html = await response.text();
    assert.match(html, /SERJAFAN|__next/i);
  }
});
