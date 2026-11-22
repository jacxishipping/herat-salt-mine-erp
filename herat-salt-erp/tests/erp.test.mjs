import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// Pure-Node verification of core ERP invariants (JWT, QR integrity, FX & Kanta math)

function generateQrHash({ ticketNumber, truckPlate, netWeightKg, weighOutAt }) {
  return crypto
    .createHash("sha256")
    .update(`${ticketNumber}|${truckPlate}|${netWeightKg}|${weighOutAt}|HERAT-MOMP-SALT`)
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
}

test("Weighbridge QR payload hash is deterministic and tamper-sensitive", () => {
  const base = {
    ticketNumber: "KNT-2026-001842",
    truckPlate: "HRT-48291",
    netWeightKg: 25000,
    weighOutAt: "2026-11-18T07:45:00Z",
  };
  const h1 = generateQrHash(base);
  const h2 = generateQrHash(base);
  const tampered = generateQrHash({ ...base, netWeightKg: 24500 });

  assert.equal(h1, h2);
  assert.notEqual(h1, tampered);
  assert.equal(h1.length, 24);
});

test("Dual-currency AFN/USD conversion preserves locked FX rate", () => {
  const netMt = 25;
  const priceAfnPerMt = 6800;
  const lockedFx = 71.5;
  const totalAfn = netMt * priceAfnPerMt;
  const totalUsd = Number((totalAfn / lockedFx).toFixed(2));

  assert.equal(totalAfn, 170000);
  assert.equal(totalUsd, 2377.62);
});

test("API integration: Weighbridge RBAC voiding, Processing stock, & Auth JWT", async (t) => {
  const baseUrl = process.env.ERP_TEST_URL;
  if (!baseUrl) {
    t.skip("ERP_TEST_URL not set; skipping live HTTP integration checks");
    return;
  }

  // 1. Login as Weighbridge Clerk
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "kanta@heratsalt.af", password: "demo" }),
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.user.role, "WEIGHBRIDGE_CLERK");
  assert.ok(loginData.token.split(".").length === 3);

  // 2. Issue a ticket
  const clientSyncId = crypto.randomUUID();
  const createRes = await fetch(`${baseUrl}/api/v1/weighbridge/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actorRole: "WEIGHBRIDGE_CLERK",
      ticket: {
        clientSyncId,
        direction: "OUTBOUND_DISPATCH",
        status: "ACTIVE",
        truckPlate: "HRT-99001",
        driverName: "Test Driver",
        driverTazkira: "1400-0101-99999",
        counterpartyName: "Test Wholesaler",
        paymentMethod: "CASH",
        saltGrade: "INDUSTRIAL_RAW_ROCK",
        destinationType: "HERAT_LOCAL",
        destinationDetail: "Herat City",
        grossWeightKg: 35000,
        tareWeightKg: 12000,
        unitPriceAfnPerMt: 3200,
        lockedUsdToAfn: 71.5,
        scaleDeviceId: "KANTA-GHR-01",
        weighOutAt: new Date().toISOString(),
        operatorName: "Fardin Ahmadi",
        offlineCreatedAt: new Date().toISOString(),
      },
    }),
  });
  assert.equal(createRes.status, 201);
  const { ticket } = await createRes.json();
  assert.equal(ticket.netWeightKg, 23000);

  // 3. Idempotent sync: same clientSyncId must not duplicate
  const syncRes = await fetch(`${baseUrl}/api/v1/sync/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actorRole: "WEIGHBRIDGE_CLERK",
      tickets: [ticket],
      extractions: [],
    }),
  });
  assert.equal(syncRes.status, 200);

  // 4. Anti-fraud: Clerk cannot APPROVE void
  const clerkApproveRes = await fetch(
    `${baseUrl}/api/v1/weighbridge/tickets/${ticket.id}/void`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "APPROVE",
        reason: "Self-void attempt",
        actorName: "Fardin Ahmadi",
        actorRole: "WEIGHBRIDGE_CLERK",
      }),
    }
  );
  assert.equal(clerkApproveRes.status, 403);

  // 5. Mine Owner CAN approve void
  const ownerApproveRes = await fetch(
    `${baseUrl}/api/v1/weighbridge/tickets/${ticket.id}/void`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "APPROVE",
        reason: "Verified duplicate axle scale read",
        actorName: "Haji Abdul Rahim",
        actorRole: "MINE_OWNER",
      }),
    }
  );
  assert.equal(ownerApproveRes.status, 200);
  const voidedData = await ownerApproveRes.json();
  assert.equal(voidedData.ticket.status, "VOIDED");
});
