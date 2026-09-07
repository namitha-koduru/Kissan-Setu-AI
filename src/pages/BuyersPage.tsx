import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { SmartBuyerCard } from "../components/SmartBuyerCard";
import buyerMatchingApi from "../services/buyerMatchingApi";
import type { BuyerMatchResult } from "../services/buyerMatchingApi";
import { MASTER_CROP_CATALOG } from "../data/cropCatalog";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { useLanguage } from "../context/LanguageContext";

export function BuyersPage() {
  const { user } = useAuth();
  const { crops } = useAppState();
  const { t } = useLanguage();

  const availableCrops = useMemo(() => {
    const catalogList = MASTER_CROP_CATALOG.map((c) => c.name);
    const userCropNames = crops.map((c) => c.name);
    const set = new Set([...userCropNames, ...catalogList]);
    return Array.from(set);
  }, [crops]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string>(() => crops[0]?.name || "Tomato");
  const [quantityQtl, setQuantityQtl] = useState(20);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"match" | "price" | "rating">("match");
  const [buyers, setBuyers] = useState<BuyerMatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const userLoc = user?.location || (user?.district && user?.state ? `${user.district}, ${user.state}` : "Guntur, Andhra Pradesh");
      const data = await buyerMatchingApi.getRecommendedBuyers(
        selectedCrop === "All" ? (crops[0]?.name || "Tomato") : selectedCrop,
        quantityQtl,
        "Grade A",
        userLoc,
        verifiedOnly
      );
      setBuyers(data.buyers || []);
    } catch (err) {
      console.error("Failed to load buyers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, [selectedCrop, quantityQtl, verifiedOnly]);

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

  return (
    <div className="wrap">
      {/* Header */}
      <div className="market-header">
        <div>
          <div className="flex flex-center gap-md">
            <span className="page-tag">
              KissanSetu Buyers
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>{t("buyers.title", "Verified Buyer Marketplace")}</h1>
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            {t("buyers.subtitle", "AI-matched institutional procurers, food processing units, and retail chains with transparent scoring and net realization comparisons.")}
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

      {/* Search and Filters Bar */}
      <div className="search-bar mb-md">
        <div style={{ position: "relative", flex: 1.5 }}>
          <input
            type="text"
            placeholder={t("market.searchPlaceholder", "Search by buyer name, FPC, or location (e.g. Sahyadri, Reliance, Nashik)...")}
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
            <span className="qty-suffix">
              Qtl
            </span>
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
            <RefreshCw size={28} className="animate-spin" color="var(--green-deep)" style={{ margin: "0 auto 10px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{t("common.loading", "Calculating Smart Buyer Match Scores...")}</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "13px" }}>
              {t("buyers.subtitle", "Evaluating crop compatibility, tender volumes, distance freight, and net realization.")}
            </p>
          </div>
        ) : filteredBuyers.length === 0 ? (
          <div className="card card-pad market-loading">
            <h3 style={{ fontSize: "16px" }}>{t("buyers.noBuyers", "No buyers found matching your criteria")}</h3>
            <p style={{ color: "var(--ink-soft)", marginTop: 4, fontSize: "13px" }}>
              {t("buyers.subtitle", "Try adjusting your volume or toggling the verified enterprise filter.")}
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
    </div>
  );
}

export default BuyersPage;
