export {};
// CT-03: Event emission for Shipment contract state transitions

const EVENTS = {
  SHIPMENT_CREATED: "shipment_created",
  SHIPMENT_ACCEPTED: "shipment_accepted",
  SHIPMENT_IN_TRANSIT: "shipment_in_transit",
  SHIPMENT_DELIVERED: "shipment_delivered",
  SHIPMENT_COMPLETED: "shipment_completed",
  SHIPMENT_CANCELLED: "shipment_cancelled",
  SHIPMENT_DISPUTED: "shipment_disputed",
} as const;

interface ShipmentEvent {
  topic: string;
  shipmentId: string;
  oldStatus: string;
  newStatus: string;
  actor: string;
  timestamp: number;
}

const eventLog: ShipmentEvent[] = [];

function emitTransitionEvent(
  shipmentId: string, oldStatus: string, newStatus: string, actor: string
): ShipmentEvent {
  const topicKey = `SHIPMENT_${newStatus.replace(/([A-Z])/g, "_$1").toUpperCase().replace(/^_/, "")}` as keyof typeof EVENTS;
  const topic = EVENTS[topicKey] ?? "shipment_transition";
  const event: ShipmentEvent = { topic, shipmentId, oldStatus, newStatus, actor, timestamp: Date.now() };
  eventLog.push(event);
  return event;
}

// --- tests ---
function it(label: string, fn: () => void) {
  try { fn(); console.log(`  ✓ ${label}`); }
  catch (e: any) { console.error(`  ✗ ${label}: ${e.message}`); process.exit(1); }
}
function expect(val: unknown) {
  return { toBe: (exp: unknown) => { if (val !== exp) throw new Error(`Expected ${exp}, got ${val}`); } };
}

console.log("\nShipment Event Emission");
it("emits accepted event with correct fields", () => {
  const e = emitTransitionEvent("SHP-1", "Created", "Accepted", "carrier_addr");
  expect(e.topic).toBe(EVENTS.SHIPMENT_ACCEPTED);
  expect(e.shipmentId).toBe("SHP-1");
  expect(e.oldStatus).toBe("Created");
  expect(e.newStatus).toBe("Accepted");
  expect(e.actor).toBe("carrier_addr");
});
it("emits in_transit event", () => {
  const e = emitTransitionEvent("SHP-2", "Accepted", "InTransit", "carrier_addr");
  expect(e.topic).toBe(EVENTS.SHIPMENT_IN_TRANSIT);
});
it("emits delivered event", () => {
  const e = emitTransitionEvent("SHP-3", "InTransit", "Delivered", "carrier_addr");
  expect(e.topic).toBe(EVENTS.SHIPMENT_DELIVERED);
});
it("event log accumulates all events", () => expect(eventLog.length).toBe(3));
