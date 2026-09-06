import { useState } from "react";
import { CheckCircle2, MapPin, SlidersHorizontal } from "lucide-react";
import { BuyerCard } from "../components/BuyerCard";
import { buyers, cropOptions } from "../data/demo";

export function BuyersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filteredBuyers = buyers.filter((b) => {
    const matchesCrop = selectedCrop === "All" || b.crop.toLowerCase() === selectedCrop.toLowerCase();
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.crop.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerified = !verifiedOnly || b.verified;
    return matchesCrop && matchesSearch && matchesVerified;
  });

  return (
    <div className="wrap">
      <div className="page-header" style={{ padding: "20px 0 14px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Buyer Marketplace</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
          Discover verified institutional procurers, food processors, and retail chains actively purchasing in Maharashtra.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="search-bar">
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            placeholder="Search by buyer name, crop, or district (e.g. FreshFarm, Tomato, Pune)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--line-strong)", fontWeight: 600 }}
        >
          <option value="All">All Crops</option>
          {cropOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-row">
        <div
          className={`filter-chip ${verifiedOnly ? "active" : ""}`}
          onClick={() => setVerifiedOnly((prev) => !prev)}
        >
          <CheckCircle2 size={15} color={verifiedOnly ? "#176B45" : "inherit"} />
          Verified Enterprise Buyers Only
        </div>
        <div className="filter-chip">
          <MapPin size={15} /> Within 100 km
        </div>
        <div className="filter-chip">
          <SlidersHorizontal size={15} /> Grade A Quality
        </div>
      </div>

      {/* Buyer Cards List */}
      <div>
        {filteredBuyers.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "40px 20px" }}>
            <h3 style={{ fontSize: "16px" }}>No buyers found matching this search</h3>
            <p style={{ color: "var(--ink-soft)", marginTop: 4 }}>
              Try removing the filter or searching for another crop like Tomato, Onion, or Chilli.
            </p>
          </div>
        ) : (
          filteredBuyers.map((b) => <BuyerCard key={b.id} buyer={b} />)
        )}
      </div>
    </div>
  );
}
