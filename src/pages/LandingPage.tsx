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
import { useLanguage } from "../context/LanguageContext";

export function LandingPage() {
  const { t } = useLanguage();

  return (
    <div style={{ background: "var(--bg-soft)", minHeight: "100vh" }}>
      <PublicNav />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-pattern" />
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow" style={{ color: "#BFE6D3" }}>
              {t("nav.credit", "Smart India Hackathon 2026 · SIH26132 · Pan-India Agriculture Intelligence")}
            </span>
            <h1>
              {t("landing.tagline", "From knowing the market price to knowing the best action.")}
            </h1>
            <p className="lede">
              {t("landing.heroTitle", "AI-powered farm-to-market intelligence helping farmers and FPOs decide when to harvest, where to sell, and whether to sell now or wait.")}
            </p>
            <p className="sub">
              {t("landing.heroSubtitle", "KissanSetu AI combines weather risk, crop maturity, mandi prices, buyer demand, and logistics into one explainable recommendation.")}
            </p>
            <div className="hero-actions">
              <Link className="btn btn-saffron" to="/register">
                {t("landing.getStarted", "Get Started Free")} <ArrowRight size={16} />
              </Link>
              <a className="btn btn-outline" href="#how" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
                {t("landing.seeHow", "See How It Works")}
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
              <span className="flow-chip">🌦️ {t("nav.weather", "Weather Risk")}</span>
              <span className="flow-chip">📊 {t("nav.market", "Mandi Prices")}</span>
              <span className="flow-chip">🤝 {t("nav.buyers", "Buyer Demand")}</span>
              <span className="flow-chip">🚚 {t("transactions.logistics", "Logistics")}</span>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-row">
              <span className="flow-chip" style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.4)", width: "100%", textAlign: "center" }}>
                ⚡ AI NET REALIZATION SCORING ENGINE
              </span>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-row" style={{ justifyContent: "center" }}>
              <span className="flow-chip" style={{ background: "rgba(23,107,69,0.8)" }}>{t("decision.sell", "SELL NOW")}</span>
              <span className="flow-chip" style={{ background: "rgba(180,121,12,0.8)" }}>{t("decision.wait", "WAIT")}</span>
              <span className="flow-chip" style={{ background: "rgba(23,50,77,0.8)" }}>{t("decision.switch", "SWITCH MARKET")}</span>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-row">
              <span className="flow-chip flow-final" style={{ width: "100%", textAlign: "center" }}>
                ✓ {t("recommendations.decision", "RECOMMENDED")}: NASHIK MARKET · ₹29/kg NET
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tricolour ribbon divider */}
      <div className="tricolour-bar-smooth" />

      {/* The Problem Section */}
      <section className="section wrap" id="problem">
        <div className="section-head">
          <span className="eyebrow">{t("landing.theProblem", "The Problem")}</span>
          <h2>{t("landing.heroTitle", "Farmers lose income between the field and the mandi")}</h2>
          <p>
            {t("landing.heroSubtitle", "Not from poor crops — but from critical selling decisions made without holistic market & logistics intelligence.")}
          </p>
        </div>
        <div className="grid-3">
          <div className="num-card">
            <div className="n">01</div>
            <h3>{t("market.title", "Scattered Market Information")}</h3>
            <p>{t("market.subtitle", "Mandi prices are scattered without factoring transport costs and handling spoilage.")}</p>
          </div>
          <div className="num-card">
            <div className="n">02</div>
            <h3>{t("recommendations.title", "Uncertain Harvest & Selling Timing")}</h3>
            <p>{t("recommendations.subtitle", "Farmers struggle to know if harvesting earlier prevents weather damage or yields higher net realization.")}</p>
          </div>
          <div className="num-card">
            <div className="n">03</div>
            <h3>{t("buyers.title", "Weak Buyer Linkages & High Intermediaries")}</h3>
            <p>{t("buyers.subtitle", "Verified institutional buyers exist nearby, but farmers lack direct discovery, lots creation, and offer negotiation tools.")}</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section wrap" id="how">
        <div className="section-head">
          <span className="eyebrow">{t("landing.howItWorks", "How It Works")}</span>
          <h2>{t("landing.seeHow", "Five steps from field to verified sale")}</h2>
          <p>{t("landing.heroSubtitle", "Each step feeds into the next, culminating in one actionable recommendation with transparent reasoning.")}</p>
        </div>
        <div className="steps-row">
          <div className="step-card">
            <div className="n">1</div>
            <h4>{t("crops.addCrop", "Add Crop")}</h4>
            <p>{t("crops.subtitle", "Enter crop variety, quantity, location and current crop stage.")}</p>
          </div>
          <div className="step-card">
            <div className="n">2</div>
            <h4>{t("weather.title", "Analyze Conditions")}</h4>
            <p>{t("weather.subtitle", "We read localized rain risk and harvest windows together.")}</p>
          </div>
          <div className="step-card">
            <div className="n">3</div>
            <h4>{t("market.nearbyMandis", "Compare Mandis")}</h4>
            <p>{t("market.subtitle", "Nearby markets compared on transport deduction & net realization.")}</p>
          </div>
          <div className="step-card">
            <div className="n">4</div>
            <h4>{t("nav.recommendations", "AI Recommendation")}</h4>
            <p>{t("recommendations.subtitle", "Clear SELL, WAIT, or SWITCH call with complete reasons shown.")}</p>
          </div>
          <div className="step-card">
            <div className="n">5</div>
            <h4>{t("buyers.title", "Direct Buyer Sale")}</h4>
            <p>{t("buyers.subtitle", "Create a lot, receive offers from verified buyers, and track settlement.")}</p>
          </div>
        </div>
      </section>

      {/* Decision Showcase Preview */}
      <section className="section wrap" id="decision">
        <div className="section-head">
          <span className="eyebrow">{t("nav.recommendations", "Smart Decision Center")}</span>
          <h2>{t("landing.tagline", "One clear recommendation. Fully explained.")}</h2>
          <p>{t("recommendations.subtitle", "Never a black-box answer — KisanSetu demonstrates exactly why an action maximizes farmer earnings.")}</p>
        </div>
        <div className="reco-card" style={{ maxWidth: 680, margin: "0 auto" }}>
          <div className="reco-head">
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>
                LIVE AI RECOMMENDATION
              </div>
              <DecisionBadge decision="SELL" size="lg" />
            </div>
            <span className="demo-tag">{t("common.demo", "DEMO CALCULATION")}</span>
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
                <div className="label">{t("market.bestMarket", "Recommended Market")}</div>
                <div className="val" style={{ color: "var(--green-deep)" }}>Nashik Market Yard</div>
              </div>
              <div className="reco-stat">
                <div className="label">{t("market.netInHand", "Expected Net Realization")}</div>
                <div className="val" style={{ color: "var(--green-deep)", fontSize: "20px" }}>₹29.00 / kg</div>
              </div>
              <div className="reco-stat">
                <div className="label">{t("buyers.demand", "Buyer Wholesale Demand")}</div>
                <div className="val">HIGH (3 Active Buyers)</div>
              </div>
              <div className="reco-stat">
                <div className="label">{t("dashboard.farmRisks", "Upcoming Weather Risk")}</div>
                <div className="val" style={{ color: "var(--terracotta)" }}>MEDIUM (Rain in 48 hrs)</div>
              </div>
            </div>

            <div className="reco-reason">
              ✓ <strong>Why SELL NOW?</strong> Buyer demand is high in Nashik giving ₹29/kg net realization. Transport to Pune is ₹2,800 dropping Pune's net realization to ₹24/kg despite a higher raw price of ₹32/kg. Rain risk jumps to 70% after Day 2.
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <Link className="btn btn-primary" to="/login" style={{ flex: 1 }}>
                {t("nav.recommendations", "Explore Decision Center")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="section wrap" id="features">
        <div className="section-head">
          <span className="eyebrow">{t("landing.features", "Enterprise Features")}</span>
          <h2>{t("landing.whyKissanSetu", "Built around profitable farmer actions")}</h2>
        </div>
        <div className="grid-3">
          <div className="feat-card">
            <div className="feat-icon"><CloudSun size={20} /></div>
            <div>
              <h4>{t("weather.title", "Weather Risk Intelligence")}</h4>
              <p>{t("weather.subtitle", "Localized precipitation and humidity mapped directly to crop vulnerability stages.")}</p>
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon"><Store size={20} /></div>
            <div>
              <h4>{t("market.title", "Net Realization Price Discovery")}</h4>
              <p>{t("market.subtitle", "Compare mandis after deducting freight, unloading, handling loss and storage fees.")}</p>
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon"><Sparkles size={20} /></div>
            <div>
              <h4>{t("chat.title", "AI Harvest Window & Chat")}</h4>
              <p>{t("chat.subtitle", "AI-assisted window predicting the safest and most profitable harvest timing and agronomy.")}</p>
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon"><Users size={20} /></div>
            <div>
              <h4>{t("buyers.title", "Verified Buyer Marketplace")}</h4>
              <p>{t("buyers.subtitle", "Direct linkage to certified institutional procurers, retail chains and exporters.")}</p>
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon"><Truck size={20} /></div>
            <div>
              <h4>{t("transactions.title", "Integrated Logistics & Trade")}</h4>
              <p>{t("transactions.subtitle", "Automatic freight estimation per kilometer and pooled vehicle recommendations.")}</p>
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon"><Warehouse size={20} /></div>
            <div>
              <h4>{t("fpo.title", "FPO Pooling Dashboard")}</h4>
              <p>{t("fpo.subtitle", "Aggregate produce from dozens of smallholders for collective bargaining power.")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="wrap" style={{ paddingBottom: 60 }}>
        <div className="final-cta">
          <h2>{t("landing.tagline", "Make every harvest and selling decision smarter.")}</h2>
          <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: 500, margin: "0 auto 24px" }}>
            {t("landing.heroSubtitle", "Join Indian farmers and FPOs transforming price discovery and market linkages nationwide.")}
          </p>
          <Link className="btn btn-saffron" to="/register" style={{ padding: "14px 32px", fontSize: "16px" }}>
            {t("landing.getStarted", "Start Decision Analysis Now")}
          </Link>
        </div>
      </section>

      <footer className="wrap app-footer">
        <span>© 2026 KissanSetu AI · Team Skill Squad · Smart India Hackathon 2026 · SIH26132</span>
        <span>Agriculture, FoodTech & Rural Development · Pan-India Platform</span>
      </footer>
    </div>
  );
}

export default LandingPage;
