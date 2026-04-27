type Address = string;

interface ShipmentState {
  paused: boolean;
  admin: Address;
  shipments: Map<string, { status: string }>;
}

const state: ShipmentState = {
  paused: false,
  admin: "admin-0x1",
  shipments: new Map(),
};

function requireAdmin(caller: Address) {
  if (caller !== state.admin) throw new Error("Unauthorized");
}

function requireNotPaused() {
  if (state.paused) throw new Error("ContractPaused");
}

export function pause(caller: Address): void {
  requireAdmin(caller);
  state.paused = true;
}

export function unpause(caller: Address): void {
  requireAdmin(caller);
  state.paused = false;
}

export function createShipment(caller: Address, id: string): void {
  requireNotPaused();
  state.shipments.set(id, { status: "created" });
}

export function updateShipment(caller: Address, id: string, status: string): void {
  requireNotPaused();
  if (!state.shipments.has(id)) throw new Error("NotFound");
  state.shipments.get(id)!.status = status;
}

// read-only — allowed while paused
export function getShipment(id: string) {
  return state.shipments.get(id);
}

// --- tests ---
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

createShipment("user-1", "s1");
assert(getShipment("s1")?.status === "created", "shipment created");

pause("admin-0x1");
assert(state.paused, "contract paused");

try {
  createShipment("user-1", "s2");
  assert(false, "should be blocked");
} catch (e: any) {
  assert(e.message === "ContractPaused", "mutation blocked while paused");
}

assert(getShipment("s1") !== undefined, "reads allowed while paused");

unpause("admin-0x1");
createShipment("user-1", "s2");
assert(getShipment("s2")?.status === "created", "works after unpause");

console.log("CT-19: all tests passed");
