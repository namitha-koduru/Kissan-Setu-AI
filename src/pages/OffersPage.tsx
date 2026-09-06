import { useState } from "react";
import { OfferCard } from "../components/OfferCard";
import { EmptyState } from "../components/States";
import { useAppState } from "../context/AppStateContext";
import { lotService } from "../services/lotService";

export function OffersPage() {
  const { offers, updateOffer } = useAppState();
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState(30);
  const [note, setNote] = useState<string | null>(null);

  async function respond(id: string, status: "Accepted" | "Rejected" | "Countered") {
    const offer = offers.find((o) => o.id === id);
    if (!offer) return;
    await lotService.respondOffer(offer, status);
    updateOffer(id, status);
    if (status === "Accepted") {
      setNote(`Offer accepted. Logistics and payment tracking can now start for lot ${offer.lotId}.`);
    } else if (status === "Rejected") {
      setNote("Offer rejected. Other buyers can still bid on the open lot.");
    } else {
      setNote(`Counter sent at ₹${counterPrice}/kg. Waiting for the buyer to respond.`);
      setCounterFor(null);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Buyer offers</h1>
      <p className="page-sub">Accept, reject or counter. This is the last step of the demo market-linkage flow.</p>
      {note && <article className="card" style={{ marginBottom: 16 }}>{note}</article>}
      {offers.length === 0 ? (
        <EmptyState title="No offers yet" text="Create a lot to receive sample buyer interest." />
      ) : (
        <div className="stack">
          {offers.map((o) => (
            <div key={o.id}>
              <OfferCard
                offer={o}
                onAccept={() => void respond(o.id, "Accepted")}
                onReject={() => void respond(o.id, "Rejected")}
                onCounter={() => setCounterFor(o.id)}
              />
              {counterFor === o.id && (
                <div className="card" style={{ marginTop: 8 }}>
                  <div className="field">
                    <label htmlFor="cp">Counter price (₹/kg)</label>
                    <input id="cp" type="number" value={counterPrice} onChange={(e) => setCounterPrice(Number(e.target.value))} />
                  </div>
                  <button className="btn btn-primary" type="button" onClick={() => void respond(o.id, "Countered")}>
                    Send counter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
