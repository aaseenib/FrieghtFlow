export {};
// CT-02: Platform fee deduction in the Escrow contract

interface EscrowConfig {
  feeBps: number;      // basis points, e.g. 200 = 2%
  treasury: string;
}

interface ReleaseResult {
  carrierAmount: number;
  feeAmount: number;
  treasury: string;
}

function deductPlatformFee(total: number, config: EscrowConfig): ReleaseResult {
  if (config.feeBps < 0 || config.feeBps > 10_000) throw new Error("feeBps out of range");
  if (total <= 0) throw new Error("Amount must be positive");
  const fee = Math.floor((total * config.feeBps) / 10_000);
  return { carrierAmount: total - fee, feeAmount: fee, treasury: config.treasury };
}

// --- tests ---
function it(label: string, fn: () => void) {
  try { fn(); console.log(`  ✓ ${label}`); }
  catch (e: any) { console.error(`  ✗ ${label}: ${e.message}`); process.exit(1); }
}
function expect(val: unknown) {
  return {
    toBe: (exp: unknown) => { if (val !== exp) throw new Error(`Expected ${exp}, got ${val}`); },
    toThrow: (fn: () => void) => {
      try { fn(); throw new Error("Did not throw"); } catch (e: any) {
        if (e.message === "Did not throw") throw e;
      }
    },
  };
}

const cfg: EscrowConfig = { feeBps: 200, treasury: "TREASURY_ADDR" };

console.log("\nEscrow Fee Deduction");
it("2% fee on 1000 → carrier gets 980, fee 20", () => {
  const r = deductPlatformFee(1000, cfg);
  expect(r.carrierAmount).toBe(980);
  expect(r.feeAmount).toBe(20);
  expect(r.treasury).toBe("TREASURY_ADDR");
});
it("0% fee → full amount to carrier", () => {
  const r = deductPlatformFee(500, { feeBps: 0, treasury: "T" });
  expect(r.carrierAmount).toBe(500);
  expect(r.feeAmount).toBe(0);
});
it("minimum amount (1 token, 2% fee) floors to 0 fee", () => {
  const r = deductPlatformFee(1, cfg);
  expect(r.feeAmount).toBe(0);
  expect(r.carrierAmount).toBe(1);
});
it("invalid feeBps > 10000 throws", () =>
  expect(null).toThrow(() => deductPlatformFee(100, { feeBps: 10_001, treasury: "T" })));
it("zero amount throws", () =>
  expect(null).toThrow(() => deductPlatformFee(0, cfg)));
