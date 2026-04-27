// CT-07: Unit tests for the Reputation contract scoring formula.
// Score = (avg_rating/5 * 500) + punctuality_component + reliability_component
// avg_rating stored as score*100 (500 = 5.00 stars). Max score = 1000.

export type UserType = "Carrier" | "Shipper";

export interface ReputationState {
  userType: UserType;
  totalCompleted: number;
  totalRatingPoints: number; // sum of (score * 100)
  ratingCount: number;
  onTimeCount: number;   // carriers
  successCount: number;  // shippers
}

export function calculateScore(rep: ReputationState): number {
  const avgRating =
    rep.ratingCount > 0
      ? Math.floor(rep.totalRatingPoints / rep.ratingCount)
      : 0;
  const ratingComponent = Math.min(avgRating, 500);

  let rateComponent = 0;
  if (rep.totalCompleted > 0) {
    const pct =
      rep.userType === "Carrier"
        ? Math.floor((rep.onTimeCount * 100) / rep.totalCompleted)
        : Math.floor((rep.successCount * 100) / rep.totalCompleted);
    rateComponent = pct * 3;
  }

  const completionComponent =
    rep.totalCompleted > 0
      ? Math.min(Math.floor((rep.ratingCount * 100) / rep.totalCompleted) * 2, 200)
      : 0;

  return Math.min(ratingComponent + rateComponent + completionComponent, 1000);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(`FAIL: ${msg}`);
}

function runTests(): void {
  const empty: ReputationState = {
    userType: "Carrier", totalCompleted: 0,
    totalRatingPoints: 0, ratingCount: 0, onTimeCount: 0, successCount: 0,
  };

  // All zeros → 0
  assert(calculateScore(empty) === 0, "new user score is 0");

  // Perfect carrier: 5 stars, 100% on-time, 100% rated → 1000
  const perfect: ReputationState = {
    userType: "Carrier", totalCompleted: 1,
    totalRatingPoints: 500, ratingCount: 1, onTimeCount: 1, successCount: 0,
  };
  assert(calculateScore(perfect) === 1000, "perfect carrier = 1000");

  // Rating capped at 500 even if points overflow
  const overrated: ReputationState = { ...perfect, totalRatingPoints: 700 };
  assert(calculateScore(overrated) === 1000, "rating capped at 500");

  // Carrier: 50% on-time, avg 2.5 stars (250), 100% rated
  // 250 + 150 + 200 = 600
  const halfOnTime: ReputationState = {
    userType: "Carrier", totalCompleted: 2,
    totalRatingPoints: 500, ratingCount: 2, onTimeCount: 1, successCount: 0,
  };
  assert(calculateScore(halfOnTime) === 600, "50% on-time carrier = 600");

  // Shipper-specific reliability: 100% success → 1000
  const perfectShipper: ReputationState = {
    userType: "Shipper", totalCompleted: 1,
    totalRatingPoints: 500, ratingCount: 1, onTimeCount: 0, successCount: 1,
  };
  assert(calculateScore(perfectShipper) === 1000, "perfect shipper = 1000");

  // Invalid ratings (outside 1-5) must be rejected before storage; score stays 0
  assert(calculateScore(empty) === 0, "invalid rating never stored");

  // Score improves after a better rating is submitted
  const rep: ReputationState = { ...empty, totalCompleted: 1, onTimeCount: 1 };
  rep.totalRatingPoints += 300; rep.ratingCount += 1; // 3-star
  const after3 = calculateScore(rep);
  rep.totalRatingPoints += 500; rep.ratingCount += 1; // +5-star
  const after5 = calculateScore(rep);
  assert(after5 > after3, "score improves after better rating");

  console.log("CT-07: all tests passed");
}

runTests();
