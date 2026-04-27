type ShipmentId = string;

interface Milestone {
  amount: number;
  released: boolean;
}

interface EscrowRecord {
  shipmentId: ShipmentId;
  total: number;
  milestones: Milestone[];
  fullyReleased: boolean;
}

const escrows = new Map<ShipmentId, EscrowRecord>();

export function fundEscrow(shipmentId: ShipmentId, milestones: number[]): EscrowRecord {
  const total = milestones.reduce((s, a) => s + a, 0);
  const record: EscrowRecord = {
    shipmentId,
    total,
    milestones: milestones.map((amount) => ({ amount, released: false })),
    fullyReleased: false,
  };
  escrows.set(shipmentId, record);
  return record;
}

export function releaseMilestone(shipmentId: ShipmentId, index: number): void {
  const escrow = escrows.get(shipmentId);
  if (!escrow) throw new Error("EscrowNotFound");
  if (index < 0 || index >= escrow.milestones.length) throw new Error("InvalidMilestoneIndex");
  if (escrow.milestones[index].released) throw new Error("MilestoneAlreadyReleased");
  escrow.milestones[index].released = true;
}

export function releasePayment(shipmentId: ShipmentId): void {
  const escrow = escrows.get(shipmentId);
  if (!escrow) throw new Error("EscrowNotFound");
  if (escrow.milestones.length > 0) {
    escrow.milestones.forEach((m) => (m.released = true));
  }
  escrow.fullyReleased = true;
}

// --- tests ---
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const e = fundEscrow("ship-1", [100, 200, 300]);
assert(e.total === 600, "total correct");

releaseMilestone("ship-1", 0);
assert(e.milestones[0].released, "milestone 0 released");
assert(!e.milestones[1].released, "milestone 1 still locked");

try {
  releaseMilestone("ship-1", 0);
  assert(false, "should throw on double release");
} catch (err: any) {
  assert(err.message === "MilestoneAlreadyReleased", "double release blocked");
}

releasePayment("ship-1");
assert(e.fullyReleased, "full release works");

console.log("CT-18: all tests passed");
