import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  Package,
  Handshake,
  TrendingUp,
  CreditCard,
  Truck,
} from "lucide-react";
import { SmartBuyerCard } from "../components/SmartBuyerCard";
import buyerMatchingApi from "../services/buyerMatchingApi";
import type { BuyerMatchResult } from "../services/buyerMatchingApi";
import { MASTER_CROP_CATALOG } from "../data/cropCatalog";
import { allMarketplaceLots } from "../data/demo";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";
import apiClient from "../services/api";
import lotApi from "../services/lotApi";

export function BuyersPage() {
  const { user } = useAuth();
  const { crops } = useAppState();
  const { t } = useLanguage();

  const isBuyer = user?.role === "buyer";

  const availableCrops = useMemo(() => {
    const catalogList = MASTER_CROP_CATALOG.map((c) => c.name);
    const userCropNames = crops.map((c) => c.name);
    const set = new Set([...userCropNames, ...catalogList]);
    return Array.from(set);
  }, [crops]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string>(
    () => (user?.preferredCrops && user.preferredCrops[0]) || crops[0]?.name || "Tomato",
  );
  const [quantityQtl, setQuantityQtl] = useState(20);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"match" | "price" | "rating">("match");
  const [buyers, setBuyers] = useState<BuyerMatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Buyer Specific Dynamic Data
  const [buyerLots, setBuyerLots] = useState<any[]>([]);
  const [buyerOffers, setBuyerOffers] = useState<any[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
  const [lotFilterCrop, setLotFilterCrop] = useState("All");

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const userLoc =
        user?.location ||
        (user?.district && user?.state
          ? `${user.district}, ${user.state}`
          : "Nashik, Maharashtra");
      const data = await buyerMatchingApi.getRecommendedBuyers(
        selectedCrop === "All" ? crops[0]?.name || "Tomato" : selectedCrop,
        quantityQtl,
        "Grade A",
        userLoc,
        verifiedOnly,
      );
      setBuyers(data.buyers || []);
    } catch (err) {
      console.error("Failed to load buyers", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyerDashboardData = async () => {
    if (!isBuyer) return;
    try {
      const [lotsRes, offersRes, ordersRes] = await Promise.allSettled([
        lotApi.discoverNearbyLots(user?.location || "Nashik, Maharashtra", "All"),
        apiClient.get<any[]>("/offers"),
        apiClient.get<any[]>("/transactions"),
      ]);

      if (lotsRes.status === "fulfilled" && Array.isArray(lotsRes.value)) {
        setBuyerLots(lotsRes.value);
      } else {
        setBuyerLots(allMarketplaceLots);
      }

      if (offersRes.status === "fulfilled" && Array.isArray(offersRes.value)) {
        setBuyerOffers(offersRes.value);
      }

      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)) {
        setBuyerOrders(ordersRes.value);
      }
    } catch (err) {
      console.warn("Could not fetch buyer dashboard metrics:", err);
    }
  };

  useEffect(() => {
    fetchBuyers();
    if (isBuyer) {
      fetchBuyerDashboardData();
    }
  }, [selectedCrop, quantityQtl, verifiedOnly, isBuyer]);

  const filteredBuyers = buyers
    .filter((b) => {
      const matchesSearch =
        b.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.organization && b.organization.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "match") return b.match_score - a.match_score;
      if (sortBy === "price") return b.indicative_price_per_kg - a.indicative_price_per_kg;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  const preferredCropsStr = user?.preferredCrops && user.preferredCrops.length > 0
    ? user.preferredCrops.join(", ")
    : "Tomato, Onion, Grapes";

  // Dynamic Metrics for Buyer
  const activeProcurementCount = user?.preferredCrops?.length || 3;
  const matchingLotsCount = buyerLots.length > 0 ? buyerLots.length : allMarketplaceLots.length;
  const pendingOffersCount = buyerOffers.filter((o) => o.status === "PENDING" || o.status === "COUNTERED").length;
  const negotiationsCount = buyerOffers.filter((o) => o.status === "COUNTERED").length;
  const ordersAwaitingPaymentCount = buyerOrders.filter((t) => t.payment_status === "PENDING" || t.payment_status === "COD_PENDING").length;
  const ordersInTransitCount = buyerOrders.filter((t) => t.logistics_status === "IN_TRANSIT" || t.status === "IN_TRANSIT").length;
  const completedOrdersCount = buyerOrders.filter((t) => t.status === "COMPLETED" || t.status === "RECEIVED").length;

  const displayLots = useMemo(() => {
    const list = buyerLots.length > 0 ? buyerLots : allMarketplaceLots;
    if (lotFilterCrop === "All") return list;
    return list.filter((l) => (l.crop_name || l.crop || "").toLowerCase().includes(lotFilterCrop.toLowerCase()));
  }, [buyerLots, lotFilterCrop]);

  return (
    <div className="wrap" style={{ paddingBottom: 60 }}>
      {/* 1. Buyer Role Specific Dashboard Section */}
      {isBuyer && (
        <div className="mb-xl">
          {/* Header */}
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div>
              <div className="flex flex-center gap-xs mb-xs">
                <span className="badge-pill badge-high">🏪 {t("buyers.procurementPortal", "Buyer Procurement Portal")}</span>
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {user?.location || "Procurement Division"}
                </span>
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
                {user?.organizationName || user?.name || "Institutional Procurement"}
              </h1>
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
                {t(
                  "buyers.procurementSubtitle",
                  "Source direct from verified farmers & FPOs, evaluate live supply lots, manage purchase bids, and track trade logistics.",
                )}
              </p>
            </div>

            <div className="flex gap-sm">
              <Link className="btn btn-primary" to="/lots">
                <Package size={16} /> {t("buyers.browseAvailableLots", "Browse Available Lots")}
              </Link>
            </div>
          </div>

          {/* 7-Card Buyer Procurement Metrics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div className="metric-card" style={{ borderLeft: "4px solid var(--navy)" }}>
              <div className="metric-label flex flex-between">
                <span>Active Mandate</span>
                <ShoppingBag size={15} color="var(--navy)" />
              </div>
              <div className="metric-value">{activeProcurementCount} Crops</div>
              <div className="metric-hint">{preferredCropsStr}</div>
            </div>

            <div className="metric-card" style={{ borderLeft: "4px solid var(--green-deep)", background: "rgba(23,107,69,0.03)" }}>
              <div className="metric-label flex flex-between">
                <span style={{ fontWeight: 800, color: "var(--green-deep)" }}>Matching Lots</span>
                <Package size={15} color="var(--green-deep)" />
              </div>
              <div className="metric-value" style={{ color: "var(--green-deep)" }}>
                {matchingLotsCount}
              </div>
              <div className="metric-hint">Farmgate & FPO supply</div>
            </div>

            <div className="metric-card" style={{ borderLeft: "4px solid #EA580C" }}>
              <div className="metric-label flex flex-between">
                <span>Pending Offers</span>
                <Handshake size={15} color="#EA580C" />
              </div>
              <div className="metric-value" style={{ color: "#EA580C" }}>
                {pendingOffersCount}
              </div>
              <div className="metric-hint">Active bids submitted</div>
            </div>

            <div className="metric-card" style={{ borderLeft: "4px solid #8B5CF6" }}>
              <div className="metric-label flex flex-between">
                <span>Negotiations</span>
                <TrendingUp size={15} color="#8B5CF6" />
              </div>
              <div className="metric-value" style={{ color: "#8B5CF6" }}>
                {negotiationsCount}
              </div>
              <div className="metric-hint">Counter-offers active</div>
            </div>

            <div className="metric-card" style={{ borderLeft: "4px solid #E11D48" }}>
              <div className="metric-label flex flex-between">
                <span>Awaiting Payment</span>
                <CreditCard size={15} color="#E11D48" />
              </div>
              <div className="metric-value" style={{ color: "#E11D48" }}>
                {ordersAwaitingPaymentCount}
              </div>
              <div className="metric-hint">Checkout pending</div>
            </div>

            <div className="metric-card" style={{ borderLeft: "4px solid #0284C7" }}>
              <div className="metric-label flex flex-between">
                <span>In Transit</span>
                <Truck size={15} color="#0284C7" />
              </div>
              <div className="metric-value" style={{ color: "#0284C7" }}>
                {ordersInTransitCount}
              </div>
              <div className="metric-hint">En route to hub</div>
            </div>

            <div className="metric-card" style={{ borderLeft: "4px solid #16A34A" }}>
              <div className="metric-label flex flex-between">
                <span>Completed</span>
                <CheckCircle2 size={15} color="#16A34A" />
              </div>
              <div className="metric-value" style={{ color: "#16A34A" }}>
                {completedOrdersCount}
              </div>
              <div className="metric-hint">Fulfilled purchases</div>
            </div>
          </div>

          {/* SECTION 1: RECOMMENDED HARVEST LOTS */}
          <div className="card card-pad mb-lg" style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
            <div className="flex flex-between flex-center flex-wrap gap-xs mb-md">
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                  🌾 Recommended Produce Lots for Procurement
                </h3>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
                  Direct harvest lots listed by verified smallholder farmers and FPO aggregation hubs
                </div>
              </div>

              <div className="flex gap-xs">
                <select
                  value={lotFilterCrop}
                  onChange={(e) => setLotFilterCrop(e.target.value)}
                  className="form-control"
                  style={{ padding: "4px 8px", fontSize: 12 }}
                >
                  <option value="All">All Commodities</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Grapes">Grapes</option>
                  <option value="Onion">Onion</option>
                  <option value="Chilli">Chilli</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Wheat">Wheat</option>
                </select>
                <Link to="/lots" className="btn btn-outline btn-sm">
                  View All Marketplace Lots →
                </Link>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {displayLots.slice(0, 4).map((lot, idx) => {
                const cropName = lot.crop_name || lot.crop || "Produce";
                const seller = lot.farmer_name || lot.sellerName || "Local Farm Producer";
                const qty = lot.quantity_kg || lot.quantityKg || 500;
                const price = lot.asking_price || lot.expectedPrice || 35;
                const loc = lot.location || "Nashik, Maharashtra";
                const quality = lot.quality || "Grade A";
                const isFpoSeller = lot.aggregated || lot.farmerCount || seller.toLowerCase().includes("fpo") || seller.toLowerCase().includes("fpc");

                return (
                  <div
                    key={lot.id || idx}
                    style={{
                      padding: "14px",
                      background: "var(--bg-warm)",
                      borderRadius: 10,
                      border: "1px solid var(--line)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div className="flex flex-between flex-center mb-xs">
                        <span style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)" }}>
                          {cropName}
                        </span>
                        <span
                          className="badge-pill"
                          style={{
                            fontSize: 10.5,
                            background: isFpoSeller ? "rgba(79,70,229,0.1)" : "rgba(23,107,69,0.1)",
                            color: isFpoSeller ? "#4F46E5" : "var(--green-deep)",
                            fontWeight: 800,
                          }}
                        >
                          {isFpoSeller ? "🏛 FPO Bulk Lot" : "🌾 Farmer Lot"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                        Seller: <strong>{seller}</strong> · {loc}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 6 }}>
                        Volume: <strong>{qty.toLocaleString("en-IN")} kg</strong> · Quality: <strong>{quality}</strong>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--green-deep)", marginTop: 6 }}>
                        ₹{price} / kg
                        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-soft)", marginLeft: 6 }}>
                          (Lot total: ₹{(qty * price).toLocaleString("en-IN")})
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-xs" style={{ marginTop: 12 }}>
                      <Link
                        to={`/lots`}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: "center", fontSize: 12 }}
                      >
                        <Handshake size={13} /> Make Offer
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: BUYER DEMAND & PROCUREMENT PROFILE */}
          <div className="card card-pad mb-lg" style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
            <div className="flex flex-between flex-center mb-sm">
              <div className="flex flex-center gap-xs">
                <ShoppingBag size={17} color="var(--green-deep)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                  Active Procurement Mandate & Demand Preferences
                </h3>
              </div>
              <Link to="/profile" className="btn btn-outline btn-sm">
                Edit Demand Criteria
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <div style={{ padding: "12px", background: "var(--bg-warm)", borderRadius: 8, border: "1px solid var(--line)" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>Target Commodities</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)", marginTop: 4 }}>{preferredCropsStr}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--bg-warm)", borderRadius: 8, border: "1px solid var(--line)" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>Procurement Radius</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)", marginTop: 4 }}>
                  {user?.procurementRadiusKm || 150} km around {user?.location || "Nashik"}
                </div>
              </div>
              <div style={{ padding: "12px", background: "var(--bg-warm)", borderRadius: 8, border: "1px solid var(--line)" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase" }}>Settlement Terms</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--green-deep)", marginTop: 4 }}>
                  Razorpay Online & Cash on Delivery (COD)
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 & 4: ACTIVE OFFERS & ACTIVE ORDERS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {/* Active Offers */}
            <div className="card card-pad" style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
              <div className="flex flex-between flex-center mb-sm">
                <div className="flex flex-center gap-xs">
                  <Handshake size={17} color="#EA580C" />
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)" }}>
                    Active Procurement Bids ({buyerOffers.length})
                  </span>
                </div>
                <Link to="/offers" className="text-xs fw-700" style={{ color: "var(--green-deep)" }}>
                  View All →
                </Link>
              </div>

              {buyerOffers.length > 0 ? (
                <div className="flex-col gap-xs">
                  {buyerOffers.slice(0, 3).map((o) => (
                    <div
                      key={o.id}
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-warm)",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div className="flex flex-between">
                        <strong style={{ fontSize: 13 }}>Lot #{o.lot_id}</strong>
                        <span className="badge-pill badge-medium" style={{ fontSize: 10.5 }}>{o.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                        Bid: ₹{o.offered_price}/kg · Volume: {o.quantity_kg} kg
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--ink-soft)", fontSize: 13 }}>
                  No open offers submitted yet. Browse lots to place bids.
                </div>
              )}
            </div>

            {/* Active Orders In Transit */}
            <div className="card card-pad" style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
              <div className="flex flex-between flex-center mb-sm">
                <div className="flex flex-center gap-xs">
                  <Truck size={17} color="#0284C7" />
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)" }}>
                    Purchases In Fulfillment ({buyerOrders.length})
                  </span>
                </div>
                <Link to="/transactions" className="text-xs fw-700" style={{ color: "var(--green-deep)" }}>
                  Track All →
                </Link>
              </div>

              {buyerOrders.length > 0 ? (
                <div className="flex-col gap-xs">
                  {buyerOrders.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "10px 12px",
                        background: "var(--bg-warm)",
                        borderRadius: 8,
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div className="flex flex-between">
                        <strong style={{ fontSize: 13 }}>Deal #{t.id} · {t.crop_name || "Produce"}</strong>
                        <span className="badge-pill badge-high" style={{ fontSize: 10.5 }}>{t.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                        {t.quantity_kg} kg @ ₹{t.final_price}/kg · Total ₹{(t.total_amount || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="flex flex-between flex-center" style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                          Payment: <strong>{t.payment_status}</strong>
                        </span>
                        <Link to={`/transactions?id=${t.id}`} className="btn btn-outline btn-sm" style={{ padding: "2px 8px", fontSize: 11 }}>
                          View Deal
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--ink-soft)", fontSize: 13 }}>
                  No active orders in fulfillment.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Farmer & FPO Header (when viewed by seller to match verified institutional buyers) */}
      {!isBuyer && (
        <div className="market-header">
          <div>
            <div className="flex flex-center gap-md">
              <span className="page-tag">KissanSetu Direct Buyers</span>
              <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
                {t("buyers.title", "Verified Buyer Marketplace")}
              </h1>
            </div>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
              {t(
                "buyers.subtitle",
                "AI-matched institutional procurers, food processing units, and retail chains with transparent scoring and net realization comparisons.",
              )}
            </p>
          </div>

          <div className="action-bar">
            <button
              className="btn btn-outline"
              onClick={fetchBuyers}
              title={t("common.loading", "Refresh matching list")}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters Bar for Sellers matching Buyers */}
      {!isBuyer && (
        <>
          <div className="search-bar mb-md">
            <div style={{ position: "relative", flex: 1.5 }}>
              <input
                type="text"
                placeholder={t("market.searchPlaceholder", "Search by buyer name, FPC, or location...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="market-controls">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="form-control"
              >
                {availableCrops.map((c) => (
                  <option key={c} value={c}>
                    {t("crops.cropName", "Crop")}: {c}
                  </option>
                ))}
              </select>

              <div className="qty-input-group">
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={quantityQtl}
                  onChange={(e) => setQuantityQtl(Math.max(1, Number(e.target.value)))}
                  style={{ width: 65 }}
                />
                <span className="qty-suffix">Qtl</span>
              </div>
            </div>
          </div>

          {/* Filter Row */}
          <div className="filter-row mb-lg">
            <div
              className={`filter-chip ${verifiedOnly ? "active" : ""}`}
              onClick={() => setVerifiedOnly(!verifiedOnly)}
            >
              <CheckCircle2 size={15} color={verifiedOnly ? "#176B45" : "inherit"} />
              {t("buyers.verified", "Verified Enterprise Buyers Only")}
            </div>

            <div className="ml-auto flex flex-center gap-md">
              <span className="text-xs fw-700 text-muted">{t("common.filter", "Sort")}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "match" | "price" | "rating")}
                className="form-control"
                style={{ padding: "6px 10px", fontSize: "12.5px" }}
              >
                <option value="match">{t("buyers.matchScore", "Highest Match Score")}</option>
                <option value="price">{t("buyers.indicativePrice", "Highest Indicative Rate (₹/kg)")}</option>
                <option value="rating">{t("buyers.verified", "Top Rated Procurers")}</option>
              </select>
            </div>
          </div>

          {/* Buyer Cards List */}
          <div>
            {loading && buyers.length === 0 ? (
              <div className="card card-pad market-loading">
                <RefreshCw
                  size={28}
                  className="animate-spin"
                  color="var(--green-deep)"
                  style={{ margin: "0 auto 10px" }}
                />
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                  {t("common.loading", "Calculating Smart Buyer Match Scores...")}
                </h3>
                <p style={{ color: "var(--ink-soft)", fontSize: "13px" }}>
                  {t(
                    "buyers.subtitle",
                    "Evaluating crop compatibility, tender volumes, distance freight, and net realization.",
                  )}
                </p>
              </div>
            ) : filteredBuyers.length === 0 ? (
              <div className="card card-pad market-loading">
                <h3 style={{ fontSize: "16px" }}>
                  {t("buyers.noBuyers", "No buyers found matching your criteria")}
                </h3>
                <p style={{ color: "var(--ink-soft)", marginTop: 4, fontSize: "13px" }}>
                  {t(
                    "buyers.subtitle",
                    "Try adjusting your volume or toggling the verified enterprise filter.",
                  )}
                </p>
              </div>
            ) : (
              filteredBuyers.map((b) => (
                <SmartBuyerCard
                  key={b.buyer_id}
                  match={b}
                  cropName={selectedCrop === "All" ? "Tomato" : selectedCrop}
                  quantityQtl={quantityQtl}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default BuyersPage;
