import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  CloudSun,
  AlertTriangle,
  Sprout,
  Users,
  Package,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { CropCard } from "../components/CropCard";
import { DecisionBadge } from "../components/DecisionBadge";
import { FarmTodayCard } from "../components/FarmTodayCard";
import { MarketIntelligenceSummaryCard } from "../components/MarketIntelligenceSummaryCard";
import { useAuth } from "../context/AuthContext";
import { useAppState } from "../context/AppStateContext";
import { weatherByLocation, marketsByCrop } from "../data/demo";


function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { user } = useAuth();
  const { crops, setActiveCropId } = useAppState();
  const navigate = useNavigate();

  const weather = weatherByLocation.Nashik;
  const tomatoMarkets = marketsByCrop.Tomato;
  const focusCrop = crops.find((c) => c.id === "crop-tomato") || crops[0];

  return (
    <div className="wrap">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>
            {getGreeting()}, {user?.name?.split(" ")[0] || "Farmer"}
          </h1>
          <div className="page-subtitle flex flex-center gap-sm">
            <MapPin size={14} color="var(--green-deep)" />
            <span>{user?.location || user?.district && user?.state ? `${user.district}, ${user.state}` : "Your Farm"}</span>
          </div>
        </div>

        <div className="page-actions">
          <Link to="/chat?mode=voice" className="btn btn-outline">
            <span>🎙</span>
            <span>Speak to AI</span>
          </Link>

          <Link to="/chat" className="btn btn-primary">
            <Sparkles size={16} />
            <span>Ask KissanSetu AI</span>
          </Link>


          <Link
            to="/weather"
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 16px",
              borderRadius: "12px",
              background: "#fff",
              border: "1px solid var(--line)",
            }}
          >
            <CloudSun size={28} color="#2E8B57" />
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800 }}>{weather.currentTempC}°C</div>
              <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                {weather.condition} · {weather.rainProbability}% rain risk
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Phase 4: Farm Intelligence Engine - Your Farm Today */}
      <FarmTodayCard farmerId={user?.id ? Number(user.id) : 1} />

      {/* Phase 5: Market Intelligence & Price Discovery Summary */}
      <MarketIntelligenceSummaryCard cropName={focusCrop?.name || "Tomato"} quantityQuintals={30} />

      {/* Main Grid: Decision + Crops on Left, Weather + Quick Actions on Right */}
      <div className="grid-2" style={{ gridTemplateColumns: "1.25fr 0.75fr", marginTop: 12 }}>

        <div>
          {/* Main Decision Highlight Card */}
          {focusCrop && (
            <div className="reco-card" style={{ marginBottom: 20 }}>
              <div className="reco-head">
                <div>
                  <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>
                    YOUR NEXT HIGH-VALUE DECISION
                  </div>
                  <h3 style={{ fontSize: "19px", fontWeight: 800 }}>
                    {focusCrop.name} · {focusCrop.quantityKg} {focusCrop.unit || "kg"}
                  </h3>
                </div>
                <span className="stage-tag mature">{focusCrop.stage}</span>
              </div>

              <div className="reco-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
                      AI RECOMMENDATION
                    </div>
                    <DecisionBadge decision={focusCrop.recommendation || "SELL"} size="md" />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="reco-stat">
                      <div className="label">Confidence Score</div>
                      <div className="val" style={{ color: "var(--green-deep)" }}>
                        {focusCrop.confidence || 86}% (High)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="reco-grid">
                  <div className="reco-stat">
                    <div className="label">Best Market Option</div>
                    <div className="val" style={{ fontWeight: 800 }}>
                      {focusCrop.bestMarket || "Nashik Market"}
                    </div>
                  </div>
                  <div className="reco-stat">
                    <div className="label">Expected Net Realization</div>
                    <div className="val" style={{ color: "var(--green-deep)", fontSize: "20px", fontWeight: 800 }}>
                      ₹{focusCrop.netRealization || 29}/kg
                    </div>
                  </div>
                </div>

                <div className="reco-reason" style={{ marginBottom: 16 }}>
                  ✓ <strong>Reasoning:</strong> High wholesale buyer demand in Nashik yielding ₹29/kg net realization. Freight to Pune is ₹2,800 resulting in lower net (₹24/kg) despite higher raw price. Rain probability rises after 2 days.
                </div>

                <button
                  className="btn btn-primary btn-block"
                  type="button"
                  onClick={() => {
                    setActiveCropId(focusCrop.id);
                    navigate("/recommendation");
                  }}
                >
                  Open AI Decision Center <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Crops List */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 12px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 800 }}>Active Crops Under Management</h3>
            <Link to="/crops" style={{ fontSize: "13px", fontWeight: 700, color: "var(--green-deep)" }}>
              See all crops →
            </Link>
          </div>

          <div>
            {crops.slice(0, 3).map((c) => (
              <CropCard
                key={c.id}
                crop={c}
                harvestWindow={c.harvestWindow}
                recommendation={c.recommendation}
                onSelect={() => setActiveCropId(c.id)}
              />
            ))}
          </div>

          {/* Mandi Price Snapshot */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "26px 0 12px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 800 }}>Mandi Price Snapshot — Tomato</h3>
            <Link to="/market" style={{ fontSize: "13px", fontWeight: 700, color: "var(--green-deep)" }}>
              Full market intel →
            </Link>
          </div>

          <div className="card card-pad table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Price</th>
                  <th>Demand</th>
                  <th>Distance</th>
                  <th>Expected Net</th>
                </tr>
              </thead>
              <tbody>
                {tomatoMarkets.slice(0, 4).map((m) => (
                  <tr key={m.id} className={m.id === "nashik" ? "highlight" : ""}>
                    <td data-label="Market">
                      <strong>{m.name}</strong>
                      {m.id === "nashik" && (
                        <span style={{ marginLeft: 6, fontSize: "10.5px", color: "var(--green-deep)", fontWeight: 700 }}>
                          ★ Best Net
                        </span>
                      )}
                    </td>
                    <td data-label="Price">₹{m.pricePerKg}/kg</td>
                    <td data-label="Demand">
                      <span className={`badge-pill badge-${m.demand.toLowerCase()}`}>{m.demand}</span>
                    </td>
                    <td data-label="Distance">{m.distanceKm} km</td>
                    <td
                      data-label="Expected Net"
                      style={{
                        fontWeight: 800,
                        color: m.id === "nashik" ? "var(--green-deep)" : "inherit",
                      }}
                    >
                      ₹{m.netPerKg}/kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Weather Card + Quick Actions */}
        <div>
          <div className="card card-pad">
            <div style={{ fontWeight: 800, fontSize: "15px", marginBottom: 12 }}>
              Weather Risk — Next 3 Days
            </div>
            <div className="wx-strip">
              {weather.forecast.slice(0, 3).map((w, i) => (
                <div key={w.day} className="wx-day" style={{ borderTop: i === 0 ? "2px solid var(--green-deep)" : undefined }}>
                  <div className="d">{w.day}</div>
                  <div className="t">{w.tempC}°</div>
                  <div className="r">{w.rainProbability}% rain</div>
                </div>
              ))}
            </div>
            <div className="alert-box">
              <AlertTriangle size={18} color="#A85D35" />
              <span>
                Rain probability increases significantly after Day 2. Consider harvesting near-maturity crops before high-risk period begins.
              </span>
            </div>
          </div>

          <div className="card card-pad" style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 800, fontSize: "15px", marginBottom: 14 }}>
              Quick Farm-to-Market Actions
            </div>

            {/* Smart Buyer Match Highlight */}
            <div
              style={{
                background: "#E6F4EA",
                border: "1px solid #CEEAD6",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 12,
                fontSize: "12.5px",
              }}
            >
              <div style={{ fontWeight: 800, color: "#137333", display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} /> 3 Verified Buyers Active
              </div>
              <div style={{ color: "var(--ink)", marginTop: 2 }}>
                Sahyadri FPO & Reliance Fresh demanding Tomato at <strong>₹32.00/kg</strong> (+₹3.50/kg vs mandi).
              </div>
              <Link
                to="/buyers?crop=Tomato"
                style={{
                  display: "inline-block",
                  color: "var(--green-deep)",
                  fontWeight: 800,
                  fontSize: "12px",
                  marginTop: 6,
                }}
              >
                View Matched Buyers →
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link className="btn btn-outline btn-block" to="/crops/add" style={{ justifyContent: "flex-start", gap: 10 }}>
                <Sprout size={18} color="#176B45" /> Register New Crop
              </Link>
              <Link className="btn btn-outline btn-block" to="/buyers" style={{ justifyContent: "flex-start", gap: 10 }}>
                <Users size={18} color="#176B45" /> Find Verified Buyers
              </Link>
              <Link className="btn btn-outline btn-block" to="/lots/create" style={{ justifyContent: "flex-start", gap: 10 }}>
                <Package size={18} color="#176B45" /> Create Selling Lot
              </Link>
              <Link className="btn btn-secondary btn-block" to="/recommendation" style={{ justifyContent: "flex-start", gap: 10 }}>
                <TrendingUp size={18} color="#E88922" /> AI Net Realization Matrix
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
