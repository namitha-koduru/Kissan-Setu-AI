import { Link } from "react-router-dom";
import {
  CloudSun,
  Store,
  Users,
  Truck,
  Warehouse,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PublicNav } from "../components/Navbar";
import { DecisionBadge } from "../components/DecisionBadge";

export function LandingPage() {
  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <PublicNav />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-pattern" />
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow" style={{ color: "#BFE6D3" }}>
              SIH26132 · Government of Maharashtra · Skill Squad
            </span>
            <h1>
              From knowing the market price<br />
              to knowing the best action.
            </h1>
            <p className="lede">
              AI-powered farm-to-market intelligence helping farmers and FPOs decide when to harvest, where to sell, and whether to sell now or wait.
            </p>
            <p className="sub">
              KisanSetu AI combines weather risk, crop maturity, mandi prices, buyer demand, and logistics into one explainable recommendation.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-saffron" to="/register">
                Get Started Free <ArrowRight size={16} />
              </Link>
              <a className="btn btn-outline" href="#how" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
                See How It Works
              </a>
            </div>
          </div>

          <div className="flow-card">
            <div style={{ fontSize: "11.5px", fontWeight: 800, color: "rgba(255,255,255,0.6)", marginBottom: 14, letterSpacing: "0.06em" }}>
              INTELLIGENT DECISION ENGINE FLOW
            </div>
            <div className="flow-row">
              <span className="flow-chip">🌾 FARM (Crop, Stage, Qty, Location)</span>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-row" style={{ justifyContent: "center" }}>
              <span className="flow-chip">🌦️ WEATHER RISK</span>
              <span className="flow-chip">📊 MANDI PRICES</span>
              <span className="flow-chip">🤝 BUYER DEMAND</span>
              <span className="flow-chip">🚚 LOGISTICS</span>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-row">
              <span className="flow-chip" style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.4)", width: "100%", textAlign: "center" }}>
                ⚡ AI NET REALIZATION SCORING ENGINE
              </span>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-row" style={{ justifyContent: "center" }}>
              <span className="flow-chip" style={{ background: "rgba(23,107,69,0.8)" }}>SELL NOW</span>
              <span className="flow-chip" style={{ background: "rgba(180,121,12,0.8)" }}>WAIT</span>
              <span className="flow-chip" style={{ background: "rgba(23,50,77,0.8)" }}>SWITCH MARKET</span>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-row">
              <span className="flow-chip flow-final" style={{ width: "100%", textAlign: "center" }}>
                ✓ RECOMMENDED: NASHIK MARKET · ₹29/kg NET (+₹5/kg over distant mandis)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="section wrap" id="problem">
        <div className="section-head">
          <span className="eyebrow">The Real Problem</span>
          <h2>Farmers lose income between the field and the mandi</h2>
          <p>
            Not from poor crops — but from critical selling decisions made without holistic market & logistics intelligence.
          </p>
        </div>
        <div className="grid-3">
          <div className="num-card">
            <div className="n">01</div>
            <h3>Scattered Market Information</h3>
            <p>Mandi prices are scattered across agents and boards without factoring transport costs and handling spoilage.</p>
          </div>
          <div className="num-card">
            <div className="n">02</div>
            <h3>Uncertain Harvest & Selling Timing</h3>
            <p>Farmers struggle to know if harvesting 2 days earlier prevents weather damage or yields higher net realization.</p>
          </div>
          <div className="num-card">
            <div className="n">03</div>
            <h3>Weak Buyer Linkages & High Intermediaries</h3>
            <p>Verified institutional buyers exist nearby, but farmers lack direct discovery, lots creation, and offer negotiation tools.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section wrap" id="how">
        <div className="section-head">
          <span className="eyebrow">How It Works</span>
          <h2>Five steps from field to verified sale</h2>
          <p>Each step feeds into the next, culminating in one actionable recommendation with transparent reasoning.</p>
        </div>
        <div className="steps-row">
          <div className="step-card">
            <div className="n">1</div>
            <h4>Add Crop</h4>
            <p>Enter crop variety, quantity, location and current crop stage.</p>
          </div>
          <div className="step-card">
            <div className="n">2</div>
            <h4>Analyze Conditions</h4>
            <p>We read localized rain risk and harvest windows together.</p>
          </div>
          <div className="step-card">
            <div className="n">3</div>
            <h4>Compare Mandis</h4>
            <p>Nearby markets compared on transport deduction & net realization.</p>
          </div>
          <div className="step-card">
            <div className="n">4</div>
            <h4>AI Recommendation</h4>
            <p>Clear SELL, WAIT, or SWITCH call with complete reasons shown.</p>
          </div>
          <div className="step-card">
            <div className="n">5</div>
            <h4>Direct Buyer Sale</h4>
            <p>Create a lot, receive offers from verified buyers, and track settlement.</p>
          </div>
        </div>
      </section>

      {/* Decision Showcase Preview */}
      <section className="section wrap" id="decision">
        <div className="section-head">
          <span className="eyebrow">Smart Decision Center</span>
          <h2>One clear recommendation. Fully explained.</h2>
          <p>Never a black-box answer — KisanSetu demonstrates exactly why an action maximizes farmer earnings.</p>
        </div>
        <div className="reco-card" style={{ maxWidth: 680, margin: "0 auto" }}>
          <div className="reco-head">
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>
                LIVE AI RECOMMENDATION
              </div>
              <DecisionBadge decision="SELL" size="lg" />
            </div>
            <span className="demo-tag">DEMO CALCULATION</span>
          </div>
          <div className="reco-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ fontSize: "20px" }}>🍅 Tomato · 500 kg (Hybrid F1)</h3>
                <p style={{ color: "var(--ink-soft)", fontSize: "13.5px", marginTop: 2 }}>
                  Stage: Near maturity · Location: Nashik
                </p>
              </div>
              <span className="badge-pill badge-high">94% Confidence</span>
            </div>

            <div className="reco-grid">
              <div className="reco-stat">
                <div className="label">Recommended Market</div>
                <div className="val" style={{ color: "var(--green-deep)" }}>Nashik Market Yard</div>
              </div>
              <div className="reco-stat">
                <div className="label">Expected Net Realization</div>
                <div className="val" style={{ color: "var(--green-deep)", fontSize: "20px" }}>₹29.00 / kg</div>
              </div>
              <div className="reco-stat">
                <div className="label">Buyer Wholesale Demand</div>
                <div className="val">HIGH (3 Active Buyers)</div>
              </div>
              <div className="reco-stat">
                <div className="label">Upcoming Weather Risk</div>
                <div className="val" style={{ color: "var(--terracotta)" }}>MEDIUM (Rain in 48 hrs)</div>
              </div>
            </div>

            <div className="reco-reason">
              ✓ <strong>Why SELL NOW?</strong> Buyer demand is high in Nashik giving ₹29/kg net realization. Transport to Pune is ₹2,800 dropping Pune's net realization to ₹24/kg despite a higher raw price of ₹32/kg. Rain risk jumps to 70% after Day 2.
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <Link className="btn btn-primary" to="/login" style={{ flex: 1 }}>
                Explore Decision Center
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="section wrap" id="features">
        <div className="section-head">
          <span className="eyebrow">Enterprise Features</span>
          <h2>Built around profitable farmer actions</h2>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon"><CloudSun size={20} /></div>
            <div>
              <h4>Weather Risk Intelligence</h4>
              <p>Localized precipitation and humidity mapped directly to crop vulnerability stages.</p>
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon"><Store size={20} /></div>
            <div>
              <h4>Net Realization Price Discovery</h4>
              <p>Compare mandis after deducting freight, unloading, handling loss and storage fees.</p>
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon"><Sparkles size={20} /></div>
            <div>
              <h4>Harvest Window Timing</h4>
              <p>AI-assisted window predicting the safest and most profitable 3-day harvest frame.</p>
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon"><Users size={20} /></div>
            <div>
              <h4>Verified Buyer Marketplace</h4>
              <p>Direct linkage to certified institutional procurers, retail chains and exporters.</p>
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon"><Truck size={20} /></div>
            <div>
              <h4>Integrated Logistics</h4>
              <p>Automatic freight estimation per kilometer and pooled vehicle recommendations.</p>
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon"><Warehouse size={20} /></div>
            <div>
              <h4>FPO Pooling Dashboard</h4>
              <p>Aggregate produce from dozens of smallholders for collective bargaining power.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="wrap" style={{ paddingBottom: 60 }}>
        <div className="final-cta">
          <h2>Make every harvest and selling decision smarter.</h2>
          <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: 500, margin: "0 auto 24px" }}>
            Join Maharashtra farmers and FPOs transforming price discovery and market linkages.
          </p>
          <Link className="btn btn-saffron" to="/register" style={{ padding: "14px 32px", fontSize: "16px" }}>
            Start Decision Analysis Now
          </Link>
        </div>
      </section>

      <footer className="wrap app-footer">
        <span>© 2026 KisanSetu AI · Team Skill Squad · Smart India Hackathon 2026 · Problem SIH26132</span>
        <span>Government of Maharashtra · Agriculture, FoodTech & Rural Development</span>
      </footer>
    </div>
  );
}
