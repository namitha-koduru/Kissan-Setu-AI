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

export type LanguageCode = "en" | "hi" | "te" | "mr" | "ta" | "kn" | "bn" | "ml";

export interface CropAllocation {
  crop: string;
  area: number;
  unit: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location: string;
  district: string;
  state: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  initials?: string;
  landAcreage?: string;
  mobile?: string;
  organizationName?: string;
  contactPerson?: string;
  businessType?: string;
  verificationStatus?: "VERIFIED" | "PENDING" | "UNVERIFIED";
  preferredCrops?: string[];
  cropAllocations?: CropAllocation[];
  procurementRadiusKm?: number;
  memberFarmerCount?: number;
  profilePictureUrl?: string;
  onboarded?: boolean;
}

export interface CropAiObservation {
  image_url?: string;
  detected_crop?: string;
  image_quality?: string;
  observed_symptoms: string[];
  crop_health?: string;
  confidence: number;
  possible_issues: { name: string; confidence: number }[];
  recommendations: string[];
  when_to_recheck?: string;
  disclaimer?: string;
  analyzed_at?: string;
}

export interface CropRecord {
  id: string;
  name: string;
  icon?: string;
  variety?: string;
  quantityKg: number;
  unit?: string;
  acreage?: number;
  acreageUnit?: string;
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
  imageUrl?: string;
  aiObservation?: CropAiObservation;
  trackingStatus?: string;
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
  farmerName?: string;
  farmerLocation?: string;
  buyerLocation?: string;
  crop: string;
  quantityKg: number;
  pricePerKg: number;
  grossAmount?: number;
  transportCharges?: number;
  otherCharges?: number;
  netRealization?: number;
  pickupDate?: string;
  deliveryDate?: string;
  paymentStatus?: string;
  paymentDate?: string;
  paymentReference?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  timestamp?: string;
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
  country?: string;
  crops: string[];
  cropAllocations?: CropAllocation[];
  quantity: string;
  quantityUnit?: string;
  land: string;
  landUnit?: string;
  markets: string[];
  sellingChannels?: string[];
  // Buyer specifics
  businessType?: string;
  minQuantityQtl?: number;
  maxQuantityQtl?: number;
  preferredQuality?: string;
  indicativePricePerKg?: number;
  procurementRadiusKm?: number;
  gstOrFssai?: string;
  qualityRequirements?: string;
  paymentTerms?: string;
  settlementMethod?: string;
  procurementFrequency?: string;
  // FPO specifics
  registrationNumber?: string;
  memberFarmerCount?: number;
  pooledAcreage?: number;
  annualAggregationCapacityTonnes?: number;
  storageAvailable?: boolean;
  storageCapacityTonnes?: number;
  storageType?: string;
  collectionCentersCount?: number;
  gradingCapability?: string;
  marketsServed?: string[];
  buyerRelationships?: string;
  institutionalContracts?: boolean;
  procurementRegions?: string;
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
