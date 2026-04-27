// Reputation score: always in [0, 1000]
// Formula: base from positive ratings, penalised by disputes
export function computeScore(ratings: number, shipments: number, disputes: number): number {
  if (shipments === 0) return 0;
  const base = Math.min(1000, Math.round((ratings / shipments) * 1000));
  const penalty = Math.min(base, Math.round((disputes / shipments) * 500));
  return Math.max(0, base - penalty);
}

// --- property-based fuzz ---
function randU32(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const RUNS = 10_000;

for (let i = 0; i < RUNS; i++) {
  const shipments = randU32() % 10_000 + 1; // avoid 0
  const ratings = randU32() % (shipments + 1);
  const disputes = randU32() % (shipments + 1);

  const score = computeScore(ratings, shipments, disputes);

  assert(score >= 0 && score <= 1000, `score out of range: ${score} (r=${ratings},s=${shipments},d=${disputes})`);
}

// score increases with more positive ratings (no disputes)
const low = computeScore(100, 1000, 0);
const high = computeScore(900, 1000, 0);
assert(high > low, "higher ratings → higher score");

// score decreases with more disputes (same ratings)
const clean = computeScore(500, 1000, 0);
const disputed = computeScore(500, 1000, 400);
assert(disputed < clean, "more disputes → lower score");

// edge: zero shipments
assert(computeScore(0, 0, 0) === 0, "zero shipments → 0");

// edge: max disputes equals shipments
const maxDispute = computeScore(500, 1000, 1000);
assert(maxDispute >= 0, "max disputes still non-negative");

console.log(`CT-20: fuzz passed (${RUNS} runs)`);
