// BE-20: Shipment cost calculator endpoint

type CargoType = "standard" | "fragile" | "hazardous" | "perishable";

interface CostInput {
  origin: string;
  destination: string;
  weightKg: number;
  volumeCbm: number;
  cargoType: CargoType;
}

interface CostBreakdown {
  baseRate: number;
  weightSurcharge: number;
  volumeSurcharge: number;
  cargoSurcharge: number;
  total: number;
}

const BASE_RATE = 50;
const WEIGHT_RATE = 1.2;   // per kg
const VOLUME_RATE = 8;     // per cbm

const CARGO_MULTIPLIERS: Record<CargoType, number> = {
  standard: 1.0,
  fragile: 1.3,
  hazardous: 1.8,
  perishable: 1.5,
};

// Naive distance proxy: hash origin+destination into a 100–2000 km range
function estimateDistance(origin: string, destination: string): number {
  const hash = [...(origin + destination)].reduce(
    (acc, c) => acc + c.charCodeAt(0),
    0
  );
  return 100 + (hash % 1900);
}

export function calculateShipmentCost(input: CostInput): CostBreakdown {
  const { origin, destination, weightKg, volumeCbm, cargoType } = input;

  const distanceFactor = estimateDistance(origin, destination) / 1000;
  const baseRate = BASE_RATE * distanceFactor;
  const weightSurcharge = weightKg * WEIGHT_RATE * distanceFactor;
  const volumeSurcharge = volumeCbm * VOLUME_RATE * distanceFactor;
  const subtotal = baseRate + weightSurcharge + volumeSurcharge;
  const cargoSurcharge = subtotal * (CARGO_MULTIPLIERS[cargoType] - 1);

  return {
    baseRate: +baseRate.toFixed(2),
    weightSurcharge: +weightSurcharge.toFixed(2),
    volumeSurcharge: +volumeSurcharge.toFixed(2),
    cargoSurcharge: +cargoSurcharge.toFixed(2),
    total: +(subtotal + cargoSurcharge).toFixed(2),
  };
}
