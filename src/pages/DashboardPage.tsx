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

        <div className="action-bar">
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
            className="weather-mini"
          >
            <CloudSun size={28} color="#2E8B57" />
            <div>
              <div className="weather-mini-temp">{weather.currentTempC}°C</div>
              <div className="weather-mini-detail">
                {weather.condition} · {weather.rainProbability}% rain risk
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Farm Intelligence Engine - Your Farm Today */}
      <div className="content-section">
        <FarmTodayCard farmerId={user?.id ? Number(user.id) : 1} />
      </div>

      {/* Market Intelligence & Price Discovery Summary */}
      <div className="content-section">
        <MarketIntelligenceSummaryCard cropName={focusCrop?.name || "Tomato"} quantityQuintals={30} />
      </div>

      {/* Main Grid: Decision + Crops on Left, Weather + Quick Actions on Right */}
      <div className="grid-2" style={{ gridTemplateColumns: "1.25fr 0.75fr" }}>

        <div>
          {/* Main Decision Highlight Card */}
          {focusCrop && (
            <div className="reco-card">
              <div className="reco-head">
                <div>
                  <div className="reco-eyebrow">
                    YOUR NEXT HIGH-VALUE DECISION
                  </div>
                  <h3 className="reco-title">
                    {focusCrop.name} · {focusCrop.quantityKg} {focusCrop.unit || "kg"}
                  </h3>
                </div>
                <span className="stage-tag mature">{focusCrop.stage}</span>
              </div>

              <div className="reco-body">
                <div className="reco-header-row">
                  <div>
                    <div className="reco-label">
                      AI RECOMMENDATION
                    </div>
                    <DecisionBadge decision={focusCrop.recommendation || "SELL"} size="md" />
                  </div>
                  <div className="reco-confidence">
                    <div className="reco-stat">
                      <div className="label">Confidence Score</div>
                      <div className="val text-green">
                        {focusCrop.confidence || 86}% (High)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="reco-grid">
                  <div className="reco-stat">
                    <div className="label">Best Market Option</div>
                    <div className="val fw-800">
                      {focusCrop.bestMarket || "Nashik Market"}
                    </div>
                  </div>
                  <div className="reco-stat">
                    <div className="label">Expected Net Realization</div>
                    <div className="val text-green fw-800 reco-price">
                      ₹{focusCrop.netRealization || 29}/kg
                    </div>
                  </div>
                </div>

                <div className="reco-reason">
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
          <div className="section-header">
            <h3>Active Crops Under Management</h3>
            <Link to="/crops" className="section-link">
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
          <div className="section-header">
            <h3>Mandi Price Snapshot — Tomato</h3>
            <Link to="/market" className="section-link">
              Full market intel →
            </Link>
          </div>

          <div className="table-scroll">
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
                        <span className="best-net-badge">
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
                      className={m.id === "nashik" ? "text-green fw-800" : "fw-800"}
                    >
                      ₹{m.netPerKg}/kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Weather Risk + Quick Actions */}
        <div>
          <div className="weather-section">
            <h4 className="weather-section-title">
              Weather Risk — Next 3 Days
            </h4>
            <div className="wx-strip">
              {weather.forecast.slice(0, 3).map((w, i) => (
                <div key={w.day} className="wx-day" data-first={i === 0 ? "true" : undefined}>
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

          <div className="quick-actions-section">
            <h4 className="quick-actions-title">
              Quick Farm-to-Market Actions
            </h4>

            {/* Smart Buyer Match Highlight */}
            <div className="buyer-match-highlight">
              <div className="buyer-match-header">
                <Users size={14} /> 3 Verified Buyers Active
              </div>
              <div className="buyer-match-detail">
                Sahyadri FPO & Reliance Fresh demanding Tomato at <strong>₹32.00/kg</strong> (+₹3.50/kg vs mandi).
              </div>
              <Link
                to="/buyers?crop=Tomato"
                className="buyer-match-link"
              >
                View Matched Buyers →
              </Link>
            </div>

            <div className="action-links">
              <Link className="btn btn-outline btn-block action-link" to="/crops/add">
                <Sprout size={18} color="#176B45" /> Register New Crop
              </Link>
              <Link className="btn btn-outline btn-block action-link" to="/buyers">
                <Users size={18} color="#176B45" /> Find Verified Buyers
              </Link>
              <Link className="btn btn-outline btn-block action-link" to="/lots/create">
                <Package size={18} color="#176B45" /> Create Selling Lot
              </Link>
              <Link className="btn btn-secondary btn-block action-link" to="/recommendation">
                <TrendingUp size={18} color="#E88922" /> AI Net Realization Matrix
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
