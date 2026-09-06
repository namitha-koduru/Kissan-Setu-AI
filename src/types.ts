export type UserRole = "farmer" | "fpo" | "buyer" | "admin";

export type Decision = "SELL" | "WAIT" | "SWITCH";

export type RiskLevel = "Low" | "Medium" | "High";

export type DemandLevel = "Low" | "Medium" | "High";

export type CropStage =
  | "Sowing"
  | "Vegetative"
  | "Flowering"
  | "Near maturity"
  | "Ready to harvest"
  | "Harvested";

export type LanguageCode = "en" | "hi" | "mr" | "te";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location: string;
  district: string;
  state: string;
  initials?: string;
  landAcreage?: string;
  mobile?: string;
}

export interface CropRecord {
  id: string;
  name: string;
  icon?: string;
  variety?: string;
  quantityKg: number;
  unit?: string;
  sowingDate: string;
  stage: CropStage;
  location: string;
  expectedPrice?: number;
  harvestEst?: string;
  harvestWindow?: string;
  recommendation?: Decision;
  bestMarket?: string;
  netRealization?: number | null;
  confidence?: number;
}

export interface WeatherDay {
  day: string;
  tempC: number;
  rainProbability: number;
  humidity?: number;
  condition: string;
}

export interface WeatherSnapshot {
  location: string;
  currentTempC: number;
  condition: string;
  rainProbability: number;
  humidity?: number;
  forecast: WeatherDay[];
  risk: RiskLevel;
  riskNote: string;
  demo: boolean;
}

export interface MarketQuote {
  id: string;
  name: string;
  crop: string;
  pricePerKg: number;
  demand: DemandLevel;
  distanceKm: number;
  transportCost: number;
  storageCost: number;
  handlingLossKg: number;
  netPerKg: number;
  recommended: boolean;
  trend?: number[];
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface BuyerListing {
  id: string;
  name: string;
  verified: boolean;
  crop: string;
  quantityKg: number;
  quality: string;
  offeredPrice: number;
  distanceKm: number;
  deadlineDays: number;
  location: string;
  paymentRating?: string;
  deadlineDate?: string;
}

export interface LotRecord {
  id: string;
  crop: string;
  quantityKg: number;
  quality: string;
  harvestDate: string;
  location: string;
  expectedPrice: number;
  status: "Open for Offers" | "Sold" | "Expired" | "Offer Accepted" | "Closed";
  interests?: number;
  createdDate?: string;
  aggregated?: boolean;
  farmerCount?: number;
}

export interface OfferRecord {
  id: string;
  lotId: string;
  buyerName: string;
  verified?: boolean;
  pricePerKg: number;
  quantityKg: number;
  quality: string;
  expiresInDays: number | string;
  status: "Pending" | "Accepted" | "Rejected" | "Countered";
}

export interface TransactionStage {
  label: string;
  done: boolean;
  date: string;
}

export interface TransactionRecord {
  id: string;
  lotId: string;
  buyerName: string;
  crop: string;
  quantityKg: number;
  pricePerKg: number;
  stages: TransactionStage[];
}

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time?: string;
  read?: boolean;
}

export interface OnboardingData {
  village: string;
  district: string;
  state: string;
  crops: string[];
  quantity: string;
  land: string;
  markets: string[];
}

export interface RecommendationResult {
  decision: Decision;
  crop: string;
  quantityKg: number;
  stage: CropStage;
  weatherRisk: RiskLevel;
  buyerDemand: DemandLevel;
  bestMarket: MarketQuote;
  markets: MarketQuote[];
  confidence: "High" | "Medium" | "Low";
  harvestWindow: string;
  reasons: string[];
  netRealizationTotal: number;
  scoreBreakdown: Record<string, number>;
}

export interface NetRealizationInput {
  quantityKg: number;
  sellingPrice: number;
  transportCost: number;
  storageCost: number;
  estimatedLoss: number;
}
