import type {
  CropRecord,
  Decision,
  MarketQuote,
  RecommendationResult,
  RiskLevel,
  WeatherSnapshot,
} from "../types";

const demandScore: Record<string, number> = { Low: 1, Medium: 2, High: 3 };
const riskScore: Record<RiskLevel, number> = { Low: 1, Medium: 2, High: 3 };

function stageReadiness(stage: CropRecord["stage"]): number {
  if (stage === "Ready to harvest") return 5;
  if (stage === "Near maturity") return 4;
  if (stage === "Flowering") return 2;
  if (stage === "Vegetative") return 1;
  return 0;
}

export function computeNetPerKg(market: MarketQuote, quantityKg: number): number {
  const gross = market.pricePerKg * quantityKg;
  const lossValue = market.handlingLossKg * market.pricePerKg;
  const net = gross - market.transportCost - market.storageCost - lossValue;
  return quantityKg > 0 ? Number((net / quantityKg).toFixed(2)) : 0;
}

export function rankMarkets(markets: MarketQuote[], quantityKg: number): MarketQuote[] {
  return [...markets]
    .map((m) => ({ ...m, netPerKg: computeNetPerKg(m, quantityKg), recommended: false }))
    .sort((a, b) => b.netPerKg - a.netPerKg)
    .map((m, i) => ({ ...m, recommended: i === 0 }));
}

export function decideAction(params: {
  crop: CropRecord;
  weather: WeatherSnapshot;
  markets: MarketQuote[];
  priceTrendDelta: number;
}): RecommendationResult {
  const ranked = rankMarkets(params.markets, params.crop.quantityKg);
  const best = ranked[0];
  const home = ranked.find((m) => m.distanceKm <= 30) ?? ranked[ranked.length - 1];
  const readiness = stageReadiness(params.crop.stage);
  const weatherRisk = params.weather.risk;
  const demand = best.demand;

  const scores = {
    netRealization: best.netPerKg,
    demand: demandScore[demand] * 10,
    weatherPressure: riskScore[weatherRisk] * 8,
    readiness: readiness * 8,
    trend: params.priceTrendDelta * 4,
    distancePenalty: best.distanceKm / 10,
  };

  let decision: Decision = "WAIT";
  const reasons: string[] = [];

  if (readiness >= 4 && demand === "High" && (weatherRisk === "Medium" || weatherRisk === "High")) {
    decision = "SELL";
    reasons.push("Buyer demand is high right now");
    reasons.push("Expected net realization is better than nearby alternatives");
    reasons.push("Lower transportation cost than distant high-price markets");
    reasons.push("Rain risk is expected to increase after 2 days");
  } else if (readiness < 4 && weatherRisk === "Low" && params.priceTrendDelta >= 0) {
    decision = "WAIT";
    reasons.push("Crop is not yet at harvest stage");
    reasons.push("Weather risk is currently low");
    reasons.push("Price trend has been stable or rising");
    reasons.push("Waiting can improve quality and selling price");
  } else if (best.id !== home.id && best.netPerKg - home.netPerKg >= 1.5) {
    decision = "SWITCH";
    reasons.push(`${best.name} offers better expected net realization`);
    reasons.push("Highest listed price is not always the best net return");
    reasons.push("Transport and handling costs change the real earning");
    reasons.push("Buyer demand is stronger at the recommended market");
  } else if (readiness >= 4 && best.netPerKg >= home.netPerKg) {
    decision = "SELL";
    reasons.push("Crop is near harvest and ready to move");
    reasons.push("Best selling option beats nearby alternatives on net value");
    reasons.push("Buyer demand supports moving the lot now");
    reasons.push("Holding longer adds weather and storage risk");
  } else {
    decision = "WAIT";
    reasons.push("Current net realization is not clearly better than waiting");
    reasons.push("Use the harvest window as decision support, not a guarantee");
    reasons.push("Watch demand and rain risk over the next few days");
  }

  const confidence =
    readiness >= 4 && demand === "High" ? "High" : readiness >= 3 ? "Medium" : "Low";

  const harvestWindow =
    readiness >= 4 ? "2–4 days" : readiness === 2 ? "10–14 days" : "3–5 weeks";

  return {
    decision,
    crop: params.crop.name,
    quantityKg: params.crop.quantityKg,
    stage: params.crop.stage,
    weatherRisk,
    buyerDemand: demand,
    bestMarket: best,
    markets: ranked,
    confidence,
    harvestWindow,
    reasons,
    netRealizationTotal: Number((best.netPerKg * params.crop.quantityKg).toFixed(0)),
    scoreBreakdown: scores,
  };
}

export function netRealization(input: {
  quantityKg: number;
  sellingPrice: number;
  transportCost: number;
  storageCost: number;
  estimatedLoss: number;
}) {
  const gross = input.quantityKg * input.sellingPrice;
  const net = gross - input.transportCost - input.storageCost - input.estimatedLoss;
  return { gross, net, perKg: input.quantityKg ? net / input.quantityKg : 0 };
}
