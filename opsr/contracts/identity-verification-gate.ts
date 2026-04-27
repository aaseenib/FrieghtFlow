// CT-06: Identity verification gate for shipment creation and acceptance.
// Simulates the on-chain check that rejects unregistered wallets.

export class IdentityRegistry {
  private registered = new Set<string>();

  register(wallet: string): void {
    this.registered.add(wallet);
  }

  verifyIdentity(wallet: string): boolean {
    return this.registered.has(wallet);
  }
}

export class ShipmentGate {
  private identity: IdentityRegistry;

  constructor(identity: IdentityRegistry) {
    this.identity = identity;
  }

  /** Rejects if shipper is not registered in the Identity contract. */
  createShipment(shipper: string, origin: string, destination: string): string {
    if (!this.identity.verifyIdentity(shipper)) {
      throw new Error("ShipmentError: shipper identity not verified");
    }
    return `shipment:${shipper}:${origin}->${destination}`;
  }

  /** Rejects if carrier is not registered in the Identity contract. */
  acceptShipment(carrier: string, shipmentId: string): void {
    if (!this.identity.verifyIdentity(carrier)) {
      throw new Error("ShipmentError: carrier identity not verified");
    }
  }
}

// ── Unit tests ────────────────────────────────────────────────────────────────

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

function assertThrows(fn: () => void, substr: string): void {
  try {
    fn();
    throw new Error(`FAIL: expected throw containing "${substr}"`);
  } catch (e: any) {
    assert(e.message.includes(substr), `expected "${substr}" in "${e.message}"`);
  }
}

function runTests(): void {
  const registry = new IdentityRegistry();
  const gate = new ShipmentGate(registry);

  // Unregistered shipper is rejected
  assertThrows(
    () => gate.createShipment("GUNREG1", "Lagos", "Cairo"),
    "shipper identity not verified"
  );

  // Registered shipper can create
  registry.register("GSHIP1");
  const id = gate.createShipment("GSHIP1", "Lagos", "Cairo");
  assert(id.includes("GSHIP1"), "shipment id contains shipper");

  // Unregistered carrier is rejected
  assertThrows(
    () => gate.acceptShipment("GUNREG2", id),
    "carrier identity not verified"
  );

  // Registered carrier can accept
  registry.register("GCARR1");
  gate.acceptShipment("GCARR1", id); // should not throw

  console.log("CT-06: all tests passed");
}

runTests();
