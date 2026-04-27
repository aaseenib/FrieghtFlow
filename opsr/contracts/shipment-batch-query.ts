// CT-05: Batch shipment query helpers for the Shipment contract
// Provides paginated and status-filtered views over on-chain shipment data.

export const ShipmentStatus = {
  Created: "Created",
  Accepted: "Accepted",
  InTransit: "InTransit",
  Delivered: "Delivered",
  Completed: "Completed",
  Disputed: "Disputed",
  Cancelled: "Cancelled",
} as const;

export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

export interface ShipmentData {
  id: number;
  shipper: string;
  carrier: string | null;
  origin: string;
  destination: string;
  weightKg: number;
  price: bigint;
  status: ShipmentStatus;
  createdAt: number;
}

/**
 * Returns a paginated slice of shipments.
 * Read-only — does not mutate state.
 */
export function getShipmentsPaginated(
  shipments: ShipmentData[],
  offset: number,
  limit: number
): ShipmentData[] {
  if (offset < 0 || limit <= 0) {
    throw new Error("offset must be >= 0 and limit must be > 0");
  }
  return shipments.slice(offset, offset + limit);
}

/**
 * Returns all shipments matching the given status.
 * Read-only — does not mutate state.
 */
export function getShipmentsByStatus(
  shipments: ShipmentData[],
  status: ShipmentStatus
): ShipmentData[] {
  return shipments.filter((s) => s.status === status);
}

// ── Unit tests ────────────────────────────────────────────────────────────────

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

function runTests(): void {
  const base: ShipmentData = {
    id: 0,
    shipper: "GADDR1",
    carrier: null,
    origin: "Lagos",
    destination: "Nairobi",
    weightKg: 100,
    price: 5_000_000_000n,
    status: ShipmentStatus.Created,
    createdAt: 1_000_000,
  };

  const shipments: ShipmentData[] = [
    { ...base, id: 1, status: ShipmentStatus.Created },
    { ...base, id: 2, status: ShipmentStatus.Accepted },
    { ...base, id: 3, status: ShipmentStatus.InTransit },
    { ...base, id: 4, status: ShipmentStatus.Created },
    { ...base, id: 5, status: ShipmentStatus.Completed },
  ];

  // Pagination
  assert(getShipmentsPaginated(shipments, 0, 2).length === 2, "page 0 size 2");
  assert(getShipmentsPaginated(shipments, 2, 2)[0].id === 3, "page 1 first id");
  assert(getShipmentsPaginated(shipments, 4, 10).length === 1, "last page");
  assert(getShipmentsPaginated(shipments, 10, 5).length === 0, "out of range");

  // Status filter
  const created = getShipmentsByStatus(shipments, ShipmentStatus.Created);
  assert(created.length === 2, "two Created shipments");
  assert(
    getShipmentsByStatus(shipments, ShipmentStatus.Disputed).length === 0,
    "no Disputed"
  );

  console.log("CT-05: all tests passed");
}

runTests();
