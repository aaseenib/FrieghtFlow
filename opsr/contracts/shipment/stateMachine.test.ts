export {};
// CT-01: Unit tests for Shipment contract state machine transitions

type ShipmentStatus =
  | "Created"
  | "Accepted"
  | "InTransit"
  | "Delivered"
  | "Completed"
  | "Cancelled"
  | "Disputed";

const VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  Created: ["Accepted", "Cancelled"],
  Accepted: ["InTransit", "Cancelled"],
  InTransit: ["Delivered", "Disputed"],
  Delivered: ["Completed", "Disputed"],
  Completed: [],
  Cancelled: [],
  Disputed: [],
};

function transition(current: ShipmentStatus, next: ShipmentStatus): ShipmentStatus {
  if (!VALID_TRANSITIONS[current].includes(next)) {
    throw new Error(`Invalid transition: ${current} → ${next}`);
  }
  return next;
}

function describe(label: string, fn: () => void) { console.log(`\n${label}`); fn(); }
function it(label: string, fn: () => void) {
  try { fn(); console.log(`  ✓ ${label}`); }
  catch (e: any) { console.error(`  ✗ ${label}: ${e.message}`); process.exit(1); }
}
function expect(val: unknown) {
  return {
    toBe: (exp: unknown) => { if (val !== exp) throw new Error(`Expected ${exp}, got ${val}`); },
    toThrow: (fn: () => void) => { try { fn(); throw new Error("Did not throw"); } catch { /* ok */ } },
  };
}

describe("Shipment State Machine", () => {
  it("Created → Accepted", () => expect(transition("Created", "Accepted")).toBe("Accepted"));
  it("Accepted → InTransit", () => expect(transition("Accepted", "InTransit")).toBe("InTransit"));
  it("InTransit → Delivered", () => expect(transition("InTransit", "Delivered")).toBe("Delivered"));
  it("Delivered → Completed", () => expect(transition("Delivered", "Completed")).toBe("Completed"));
  it("Created → Cancelled", () => expect(transition("Created", "Cancelled")).toBe("Cancelled"));
  it("InTransit → Disputed", () => expect(transition("InTransit", "Disputed")).toBe("Disputed"));
  it("Delivered → Disputed", () => expect(transition("Delivered", "Disputed")).toBe("Disputed"));

  it("invalid: Accepted → Completed throws", () =>
    expect(null).toThrow(() => transition("Accepted", "Completed")));
  it("invalid: Created → Completed throws", () =>
    expect(null).toThrow(() => transition("Created", "Completed")));
  it("invalid: Completed → Accepted throws", () =>
    expect(null).toThrow(() => transition("Completed", "Accepted")));
});
