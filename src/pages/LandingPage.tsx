import { Link } from "react-router-dom";
import { Cloud, Handshake, Store } from "lucide-react";
import { PublicNav } from "../components/Navbar";
import { RecommendationCard } from "../components/RecommendationCard";
import { useLanguage } from "../context/LanguageContext";
import { decideAction } from "../engine/recommendation";
import { initialCrops, marketsByCrop, weatherByLocation } from "../data/demo";

const sampleRec = decideAction({
  crop: initialCrops[0],
  weather: weatherByLocation.Nashik,
  markets: marketsByCrop.Tomato,
  priceTrendDelta: 4,
});

export function LandingPage() {
  const { t } = useLanguage();
  return (
    <div>
      <PublicNav />
      <section className="hero">
        <div>
          <div className="eyebrow">KisanSetu AI · Maharashtra · SIH 2026</div>
          <h1>
            From knowing the market price
            <br />
            to knowing the best action.
          </h1>
          <p>
            AI-powered farm-to-market intelligence helping farmers and FPOs make better harvest,
            market and buyer decisions.
          </p>
          <div className="row">
            <Link className="btn btn-primary" to="/register">
              {t("getStarted")}
            </Link>
            <a className="btn btn-secondary" href="#how">
              {t("seeHow")}
            </a>
          </div>
          <p className="small" style={{ marginTop: 16 }}>
            We don’t just show farmers data. We help them decide what to do.
          </p>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="flow">
            <div className="flow-step">
              FARM
              <em>Crop, location, quantity, stage</em>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step">
              WEATHER + MARKET + BUYER DATA
              <em>Risk, prices, demand, distance</em>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step">
              AI DECISION ENGINE
              <em>Net realization scoring</em>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step">
              SELL / WAIT / SWITCH
              <em>Best market · expected earning</em>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step">
              BEST REALIZATION
              <em>Create lot → buyer offer → payment</em>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="landing-section">
        <h2>The problem</h2>
        <div className="problem-grid">
          <article className="problem-card">
            <Store color="#176B45" />
            <h3>Scattered market information</h3>
            <p>Prices, demand and distance sit in different places. Farmers cannot compare net earnings quickly.</p>
          </article>
          <article className="problem-card">
            <Cloud color="#176B45" />
            <h3>Uncertain selling decisions</h3>
            <p>Harvest timing is guessed. Rain risk and crop stage are not linked to a clear sell-or-wait action.</p>
          </article>
          <article className="problem-card">
            <Handshake color="#176B45" />
            <h3>Weak buyer connectivity</h3>
            <p>Verified buyers, lots and offers are hard to reach, especially for smallholders outside large mandis.</p>
          </article>
        </div>
      </section>

      <section id="how" className="landing-section">
        <h2>How KisanSetu works</h2>
        <div className="steps">
          {[
            ["01", "Add your crop", "Crop, location, quantity and sowing date."],
            ["02", "We analyze conditions", "Weather risk, harvest window and nearby demand."],
            ["03", "AI compares markets", "Price minus transport, storage and handling."],
            ["04", "Get the best action", "Sell, wait or switch — with a recommended buyer path."],
          ].map(([n, t2, d]) => (
            <article className="step-card" key={n}>
              <div className="step-num">{n}</div>
              <h3>{t2}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="decision" className="landing-section">
        <h2>Smart decision</h2>
        <p>A realistic recommendation for a Nashik tomato lot near maturity.</p>
        <RecommendationCard rec={sampleRec} />
      </section>

      <section className="landing-section">
        <h2>Why KisanSetu</h2>
        <div className="why-grid">
          {[
            ["Weather intelligence", "Rain probability used as selling risk, not as a weather app."],
            ["Harvest window", "AI-assisted window based on crop stage and upcoming risk."],
            ["Market intelligence", "Compare listed price with expected net realization."],
            ["Buyer matching", "Verified demand, quality and distance in one place."],
            ["Logistics", "Transport cost is part of the decision, not an afterthought."],
            ["Storage", "Holding cost and loss estimates before you wait."],
          ].map(([t2, d]) => (
            <article className="why-card" key={t2}>
              <h3>{t2}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>For farmers and FPOs</h2>
        <div className="audience-grid">
          <article className="audience-card">
            <h3>Individual farmers</h3>
            <p>Know whether to sell today, wait a few days, or take produce to a better market after costs.</p>
          </article>
          <article className="audience-card">
            <h3>Farmer Producer Organisations</h3>
            <p>Aggregate lots, show buyer interest, and negotiate from pooled volume instead of scattered small lots.</p>
          </article>
          <article className="audience-card">
            <h3>Buyers and programmes</h3>
            <p>Discover open lots, verify quality needs, and keep a clear trail from offer to payment tracking.</p>
          </article>
        </div>
      </section>

      <section className="final-cta">
        <h2>Make every harvest decision smarter.</h2>
        <p>From knowing the market price to knowing the best action.</p>
        <Link className="btn btn-primary" to="/register">
          {t("getStarted")}
        </Link>
      </section>
      <footer className="motif-footer">
        KisanSetu AI · Skill Squad · Smart India Hackathon 2026 · Problem SIH26132 · Government of Maharashtra
      </footer>
    </div>
  );
}
