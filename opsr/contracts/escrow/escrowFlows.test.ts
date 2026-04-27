export {};
// CT-04: Unit tests for Escrow fund, release, and refund flows

interface EscrowState {
  balance: number;
  funded: boolean;
  released: boolean;
  shipper: string;
  carrier: string;
  treasury: string;
  feeBps: number;
}

const ledger: Record<string, number> = { shipper: 1000, carrier: 0, treasury: 0, contract: 0 };

function fundEscrow(escrow: EscrowState, amount: number) {
  if (escrow.funded) throw new Error("Already funded");
  if (ledger["shipper"] < amount) throw new Error("Insufficient balance");
  ledger["shipper"] -= amount;
  ledger["contract"] += amount;
  escrow.balance = amount;
  escrow.funded = true;
}

function releasePayment(escrow: EscrowState) {
  if (!escrow.funded) throw new Error("Not funded");
  if (escrow.released) throw new Error("Already released");
  const fee = Math.floor((escrow.balance * escrow.feeBps) / 10_000);
  ledger["carrier"] += escrow.balance - fee;
  ledger["treasury"] += fee;
  ledger["contract"] -= escrow.balance;
  escrow.released = true;
}

function refundPayment(escrow: EscrowState) {
  if (!escrow.funded) throw new Error("Not funded");
  if (escrow.released) throw new Error("Already released");
  ledger["shipper"] += escrow.balance;
  ledger["contract"] -= escrow.balance;
  escrow.funded = false;
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

const mkEscrow = (): EscrowState =>
  ({ balance: 0, funded: false, released: false, shipper: "S", carrier: "C", treasury: "T", feeBps: 200 });

console.log("\nEscrow Fund / Release / Refund");
it("fund_escrow deducts from shipper and holds in contract", () => {
  const e = mkEscrow(); fundEscrow(e, 500);
  expect(ledger["shipper"]).toBe(500); expect(ledger["contract"]).toBe(500);
});
it("release_payment sends correct amounts to carrier and treasury", () => {
  const e = mkEscrow(); e.funded = true; e.balance = 500; ledger["contract"] = 500;
  releasePayment(e);
  expect(ledger["carrier"]).toBe(490); expect(ledger["treasury"]).toBe(10);
});
it("refund_payment returns full amount to shipper", () => {
  Object.assign(ledger, { shipper: 0, contract: 300 });
  const e = mkEscrow(); e.funded = true; e.balance = 300;
  refundPayment(e); expect(ledger["shipper"]).toBe(300);
});
it("double-fund throws", () => {
  const e = mkEscrow(); e.funded = true;
  expect(null).toThrow(() => fundEscrow(e, 100));
});
it("release already-released escrow throws", () => {
  const e = mkEscrow(); e.funded = true; e.released = true; e.balance = 100;
  expect(null).toThrow(() => releasePayment(e));
});
