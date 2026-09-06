import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { SmartBuyerCard } from "../components/SmartBuyerCard";
import buyerMatchingApi from "../services/buyerMatchingApi";
import type { BuyerMatchResult } from "../services/buyerMatchingApi";
import { cropOptions } from "../data/demo";

export function BuyersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [quantityQtl, setQuantityQtl] = useState(20);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"match" | "price" | "rating">("match");
  const [buyers, setBuyers] = useState<BuyerMatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      const data = await buyerMatchingApi.getRecommendedBuyers(
        selectedCrop === "All" ? "Tomato" : selectedCrop,
        quantityQtl,
        "Grade A",
        "Nashik, Maharashtra",
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
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "20px 0 14px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                background: "var(--green-soft)",
                color: "var(--green-deep)",
                padding: "2px 8px",
                borderRadius: "6px",
                textTransform: "uppercase",
              }}
            >
              Phase 6 Smart Matching
            </span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>Verified Buyer Marketplace</h1>
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
            AI-matched institutional procurers, food processing units, and retail chains with transparent scoring and net realization comparisons.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="btn btn-outline"
            onClick={fetchBuyers}
            style={{ padding: "8px 12px" }}
            title="Refresh matching list"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="search-bar" style={{ marginBottom: 12 }}>
        <div style={{ position: "relative", flex: 1.5 }}>
          <input
            type="text"
            placeholder="Search by buyer name, FPC, or location (e.g. Sahyadri, Reliance, Nashik)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--line-strong)", fontWeight: 700 }}
          >
            {cropOptions.map((c) => (
              <option key={c} value={c}>
                Crop: {c}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="number"
              min={1}
              max={300}
              value={quantityQtl}
              onChange={(e) => setQuantityQtl(Math.max(1, Number(e.target.value)))}
              style={{
                width: 65,
                padding: "9px 8px",
                borderRadius: "8px 0 0 8px",
                border: "1px solid var(--line-strong)",
                fontWeight: 700,
              }}
            />
            <span
              style={{
                background: "#F1F5F0",
                border: "1px solid var(--line-strong)",
                borderLeft: "none",
                padding: "9px 8px",
                borderRadius: "0 8px 8px 0",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--ink-soft)",
              }}
            >
              Qtl
            </span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="filter-row" style={{ marginBottom: 18 }}>
        <div
          className={`filter-chip ${verifiedOnly ? "active" : ""}`}
          onClick={() => setVerifiedOnly(!verifiedOnly)}
        >
          <CheckCircle2 size={15} color={verifiedOnly ? "#176B45" : "inherit"} />
          Verified Enterprise Buyers Only
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-soft)" }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "match" | "price" | "rating")}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line)", fontSize: "12.5px", fontWeight: 700 }}
          >
            <option value="match">Highest Match Score</option>
            <option value="price">Highest Indicative Rate (₹/kg)</option>
            <option value="rating">Top Rated Procurers</option>
          </select>
        </div>
      </div>

      {/* Buyer Cards List */}
      <div>
        {loading && buyers.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "40px 20px" }}>
            <RefreshCw size={28} className="animate-spin" color="var(--green-deep)" style={{ margin: "0 auto 10px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Calculating Smart Buyer Match Scores...</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "13px" }}>
              Evaluating crop compatibility, tender volumes, distance freight, and net realization.
            </p>
          </div>
        ) : filteredBuyers.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "40px 20px" }}>
            <h3 style={{ fontSize: "16px" }}>No buyers found matching your criteria</h3>
            <p style={{ color: "var(--ink-soft)", marginTop: 4, fontSize: "13px" }}>
              Try adjusting your volume or toggling the verified enterprise filter.
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
