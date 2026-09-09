import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, MapPin, Handshake, Filter } from "lucide-react";
import { LotCard } from "../components/LotCard";
import { EmptyState } from "../components/States";
import { allMarketplaceLots } from "../data/demo";
import lotApi from "../services/lotApi";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";

export function LotsPage() {
  const { user } = useAuth();
  const { lots, showToast } = useAppState();
  const { t } = useLanguage();
  const isBuyer = user?.role === "buyer";
  const isFpo = user?.role === "fpo";

  // State for Buyer Marketplace Lot Browser
  const [selectedCropFilter, setSelectedCropFilter] = useState("All");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("All");
  const [liveDiscoveredLots, setLiveDiscoveredLots] = useState<any[]>([]);
  const [offerModalLot, setOfferModalLot] = useState<any | null>(null);
  const [bidPrice, setBidPrice] = useState<number>(30);
  const [bidQty, setBidQty] = useState<number>(500);

  // Status Filter Tabs for Farmer/FPO Own Lots
  const [activeTab, setActiveTab] = useState<"Active" | "Sold" | "Expired">("Active");

  useEffect(() => {
    if (isBuyer) {
      const fetchNearby = async () => {
        try {
          const res = await lotApi.discoverNearbyLots(user?.location || "Nashik, Maharashtra", selectedCropFilter);
          if (res && res.length > 0) {
            setLiveDiscoveredLots(res.map((l: any) => ({
              id: `KS-LOT-${l.id}`,
              crop: l.crop_name,
              quality: l.quality || "Grade A",
              sellerName: l.farmer_name,
              sellerRole: "Farmer",
              quantityKg: l.quantity_kg,
              expectedPrice: l.asking_price,
              location: l.location,
              harvestDate: l.harvest_date || "2026-09-08",
              status: l.status || "Open for Offers",
              distanceKm: Math.round(l.distance_km || 12),
              imageUrl: l.image_url,
            })));
          }
        } catch (err) {
          console.warn("Failed to fetch nearby lots from backend", err);
        }
      };
      fetchNearby();
    }
  }, [isBuyer, user?.location, selectedCropFilter]);

  const filteredOwnLots = lots.filter((l) => {
    if (activeTab === "Active")
      return l.status === "Open for Offers" || l.status === "Offer Accepted";
    if (activeTab === "Sold") return l.status === "Sold" || l.status === "Closed";
    return l.status === "Expired";
  });

  const availableSellerLots = useMemo(() => {
    const combined = [...liveDiscoveredLots, ...allMarketplaceLots];
    return combined.filter((l) => {
      const matchCrop =
        selectedCropFilter === "All" ||
        l.crop.toLowerCase() === selectedCropFilter.toLowerCase();
      const matchGrade =
        selectedGradeFilter === "All" ||
        l.quality.toLowerCase().includes(selectedGradeFilter.toLowerCase());
      return matchCrop && matchGrade;
    });
  }, [liveDiscoveredLots, selectedCropFilter, selectedGradeFilter]);

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerModalLot) return;
    showToast(
      `Purchase offer of ₹${bidPrice}/kg for ${bidQty} kg submitted to ${offerModalLot.sellerName || "Seller"}.`,
    );
    setOfferModalLot(null);
  };

  return (
    <div className="wrap" style={{ paddingBottom: 60 }}>
      {/* 1. Header */}
      <div className="page-header">
        <div>
          <div className="flex flex-center gap-xs mb-xs">
            <span className="badge-pill badge-high">
              {isBuyer
                ? `🏪 ${t("lots.buyerProcurement", "Live Supply Discovery")}`
                : isFpo
                ? `🏛 ${t("lots.fpoAggregation", "Aggregated Bulk Lots")}`
                : `🌾 ${t("lots.farmerLots", "Farm Harvest Lots")}`}
            </span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
            {isBuyer
              ? t("lots.availableTitle", "Available Produce Lots")
              : isFpo
              ? t("lots.fpoTitle", "Aggregated Bulk Lots")
              : t("lots.title", "My Harvest Lots")}
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 4 }}>
            {isBuyer
              ? t(
                  "lots.availableSubtitle",
                  "Browse live producer and FPO harvested lots, evaluate quality grades, and submit direct procurement bids.",
                )
              : isFpo
              ? t(
                  "lots.fpoSubtitle",
                  "Manage aggregated bulk lots, pool collection quantities, and negotiate with institutional buyers.",
                )
              : t(
                  "lots.openForOffers",
                  "Manage published lots, buyer inquiries, and active selling tenders.",
                )}
          </p>
        </div>

        {/* Create Lot Button ONLY for Farmers and FPOs (NEVER FOR BUYERS) */}
        {!isBuyer && (
          <Link className="btn btn-primary" to="/lots/create">
            <Plus size={16} />{" "}
            {isFpo
              ? t("lots.createBulkLot", "Create Bulk Lot")
              : t("lots.createLot", "Create Harvest Lot")}
          </Link>
        )}
      </div>

      {/* 2. BUYER VIEW — Browse Available Lots from Sellers */}
      {isBuyer ? (
        <div>
          {/* Filters Bar */}
          <div className="card card-pad mb-lg" style={{ background: "#FFFFFF", border: "1px solid var(--line)" }}>
            <div className="flex flex-between flex-center flex-wrap gap-md">
              <div className="flex flex-center gap-sm flex-wrap">
                <div className="flex flex-center gap-xs text-sm fw-700" style={{ color: "var(--navy)" }}>
                  <Filter size={15} color="var(--green-deep)" />
                  <span>{t("common.filter", "Filter Lots")}:</span>
                </div>

                <select
                  value={selectedCropFilter}
                  onChange={(e) => setSelectedCropFilter(e.target.value)}
                  className="form-control"
                  style={{ minWidth: 140, fontSize: 13 }}
                >
                  <option value="All">{t("lots.allCrops", "All Crops")}</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Chilli">Chilli</option>
                  <option value="Grapes">Grapes</option>
                  <option value="Onion">Onion</option>
                  <option value="Paddy">Paddy</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Banana">Banana</option>
                  <option value="Tomato">Tomato</option>
                </select>

                <select
                  value={selectedGradeFilter}
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                  className="form-control"
                  style={{ minWidth: 130, fontSize: 13 }}
                >
                  <option value="All">{t("lots.allGrades", "All Grades")}</option>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Export">Export Grade</option>
                </select>
              </div>

              <div className="text-sm fw-700" style={{ color: "var(--ink-soft)" }}>
                {availableSellerLots.length} {t("lots.matchingLots", "lots available for bidding")}
              </div>
            </div>
          </div>

          {/* Lots Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {availableSellerLots.map((lot) => (
              <div
                key={lot.id}
                className="card card-pad"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div className="flex flex-between mb-xs">
                    <span className="badge-pill badge-high" style={{ fontSize: 11 }}>
                      {lot.sellerRole === "FPO" ? "🏛 FPO Bulk Pool" : "🌾 Farmer Lot"}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--sell)" }}>
                      {lot.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--navy)", margin: "4px 0" }}>
                    {lot.crop} ({lot.quality})
                  </h3>

                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 10 }}>
                    Seller: <strong>{lot.sellerName}</strong>
                    {lot.aggregated && ` · Aggregated from ${lot.farmerCount} farmers`}
                  </div>

                  <div
                    style={{
                      background: "var(--bg-warm)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      marginBottom: 12,
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div className="flex flex-between mb-xs text-sm">
                      <span style={{ color: "var(--ink-soft)" }}>Available Volume</span>
                      <span style={{ fontWeight: 800, color: "var(--navy)" }}>
                        {lot.quantityKg.toLocaleString("en-IN")} kg ({(lot.quantityKg / 100).toFixed(1)} Qtl)
                      </span>
                    </div>
                    <div className="flex flex-between mb-xs text-sm">
                      <span style={{ color: "var(--ink-soft)" }}>Asking Rate</span>
                      <span style={{ fontWeight: 800, color: "var(--green-deep)" }}>
                        ₹{lot.expectedPrice} / kg (₹{lot.expectedPrice * 100} / Qtl)
                      </span>
                    </div>
                    <div className="flex flex-between text-xs" style={{ color: "var(--ink-muted)", marginTop: 4 }}>
                      <span className="flex flex-center gap-xs">
                        <MapPin size={12} /> {lot.location}
                      </span>
                      <span>Harvest: {lot.harvestDate}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-block btn-sm"
                  onClick={() => {
                    setOfferModalLot(lot);
                    setBidPrice(lot.expectedPrice);
                    setBidQty(lot.quantityKg);
                  }}
                  style={{ marginTop: 6 }}
                >
                  <Handshake size={15} />
                  <span>{t("lots.makeOffer", "Make Purchase Offer")}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 3. FARMER / FPO VIEW — Manage Own Lots */
        <div>
          {/* Status Filter Tabs */}
          <div className="status-tabs mb-lg">
            {(["Active", "Sold", "Expired"] as const).map((tab) => (
              <div
                key={tab}
                className={`status-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab} (
                {
                  lots.filter((l) => {
                    if (tab === "Active")
                      return l.status === "Open for Offers" || l.status === "Offer Accepted";
                    if (tab === "Sold") return l.status === "Sold" || l.status === "Closed";
                    return l.status === "Expired";
                  }).length
                }
                )
              </div>
            ))}
          </div>

          {/* Lots List */}
          <div>
            {filteredOwnLots.length === 0 ? (
              <EmptyState
                title={t("lots.noLots", `No ${activeTab.toLowerCase()} lots found`)}
                text={
                  isFpo
                    ? t("fpo.emptyLotsText", "Aggregated bulk lots for your member smallholders will appear here.")
                    : t("lots.openForOffers", "Published lots and buyer inquiries will appear here.")
                }
                action={
                  <Link className="btn btn-primary" to="/lots/create">
                    {isFpo
                      ? t("lots.createBulkLot", "Create Bulk Lot")
                      : t("lots.createLot", "Create a Lot")}
                  </Link>
                }
              />
            ) : (
              filteredOwnLots.map((l) => <LotCard key={l.id} lot={l} />)
            )}
          </div>
        </div>
      )}

      {/* Buyer Purchase Offer Modal */}
      {offerModalLot && (
        <div className="modal-backdrop" onClick={() => setOfferModalLot(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 480, borderRadius: 16, padding: 24, background: "#FFFFFF" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
              {t("offers.makeOfferTitle", "Submit Procurement Bid")}
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
              Bidding for <strong>{offerModalLot.crop}</strong> ({offerModalLot.quality}) from{" "}
              <strong>{offerModalLot.sellerName}</strong>
            </p>

            <form onSubmit={handleSendOffer} className="flex-col gap-sm">
              <div className="field">
                <label>{t("offers.bidPrice", "Offered Rate (₹ / kg)")}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    step={0.5}
                    value={bidPrice}
                    onChange={(e) => setBidPrice(Number(e.target.value))}
                    className="form-control"
                    required
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 12,
                      color: "var(--ink-soft)",
                    }}
                  >
                    = ₹{(bidPrice * 100).toFixed(0)} / Qtl
                  </span>
                </div>
              </div>

              <div className="field">
                <label>{t("offers.quantity", "Procurement Quantity (kg)")}</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  max={offerModalLot.quantityKg}
                  value={bidQty}
                  onChange={(e) => setBidQty(parseFloat(e.target.value) || 0)}
                  className="form-control"
                  required
                />
              </div>

              <div
                style={{
                  background: "var(--bg-warm)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  border: "1px solid var(--line)",
                  fontSize: 12,
                }}
              >
                <div className="flex flex-between">
                  <span>Total Bid Value:</span>
                  <strong style={{ color: "var(--green-deep)", fontSize: 14 }}>
                    ₹{(bidPrice * bidQty).toLocaleString("en-IN")}
                  </strong>
                </div>
                <div style={{ color: "var(--ink-soft)", marginTop: 4 }}>
                  Includes direct farm pickup from {offerModalLot.location}.
                </div>
              </div>

              <div className="flex gap-sm" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => setOfferModalLot(null)}
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {t("offers.submitBid", "Send Binding Bid")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LotsPage;
