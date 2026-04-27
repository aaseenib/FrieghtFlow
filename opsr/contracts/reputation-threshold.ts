// CT-08: Minimum reputation threshold enforcement for carrier acceptance.
// Carriers below the configurable threshold are rejected when accepting shipments.

export class ReputationOracle {
  private scores = new Map<string, number>();

  setScore(carrier: string, score: number): void {
    this.scores.set(carrier, score);
  }

  getScore(carrier: string): number {
    return this.scores.get(carrier) ?? 0;
  }
}

export class ShipmentContract {
  private reputation: ReputationOracle;
  private minCarrierReputation: number;
  private admin: string;

  constructor(reputation: ReputationOracle, initialThreshold: number, admin: string) {
    this.reputation = reputation;
    this.minCarrierReputation = initialThreshold;
    this.admin = admin;
  }

  /** Admin can update the threshold post-deploy. */
  setMinReputation(caller: string, threshold: number): void {
    if (caller !== this.admin) throw new Error("Unauthorized");
    this.minCarrierReputation = threshold;
  }

  /** Rejects carrier if their reputation score is below the threshold. */
  acceptShipment(carrier: string, shipmentId: number): void {
    const score = this.reputation.getScore(carrier);
    if (score < this.minCarrierReputation) {
      throw new Error(
        `CarrierReputationTooLow: score ${score} < required ${this.minCarrierReputation}`
      );
    }
    // on-chain: update shipment.carrier and status to Accepted
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
  const oracle = new ReputationOracle();
  const contract = new ShipmentContract(oracle, 500, "GADMIN");

  oracle.setScore("GCARR_HIGH", 750);
  oracle.setScore("GCARR_LOW", 300);

  // Carrier above threshold can accept
  contract.acceptShipment("GCARR_HIGH", 1); // should not throw

  // Carrier below threshold is rejected
  assertThrows(
    () => contract.acceptShipment("GCARR_LOW", 2),
    "CarrierReputationTooLow"
  );

  // Carrier with no score (0) is rejected
  assertThrows(
    () => contract.acceptShipment("GNEW", 3),
    "CarrierReputationTooLow"
  );

  // Admin lowers threshold — previously rejected carrier can now accept
  contract.setMinReputation("GADMIN", 200);
  contract.acceptShipment("GCARR_LOW", 2); // should not throw

  // Non-admin cannot change threshold
  assertThrows(
    () => contract.setMinReputation("GRANDOM", 0),
    "Unauthorized"
  );

  console.log("CT-08: all tests passed");
}

runTests();
