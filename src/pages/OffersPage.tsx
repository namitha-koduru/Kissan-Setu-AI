import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { OfferCard } from "../components/OfferCard";
import { EmptyState } from "../components/States";
import { useAppState } from "../context/AppStateContext";

export function OffersPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { offers, updateOffer } = useAppState();

  const lotFilter = params.get("lot");
  const [counterId, setCounterId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(31.5);

  const displayedOffers = lotFilter ? offers.filter((o) => o.lotId === lotFilter) : offers;

  const handleAccept = (id: string, lotId: string) => {
    updateOffer(id, "Accepted");
    navigate(`/transactions?lot=${lotId}`);
  };

  const handleReject = (id: string) => {
    updateOffer(id, "Rejected");
  };

  const handleSendCounter = (id: string) => {
    updateOffer(id, "Countered");
    setCounterId(null);
  };

  return (
    <div className="wrap">
      <div className="page-header" style={{ padding: "20px 0 14px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Buyer Offers & Bids</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginTop: 2 }}>
          {lotFilter ? (
            <>
              Showing direct offers for <strong>Lot {lotFilter}</strong>
            </>
          ) : (
            "Review, accept, counter or reject incoming price offers from verified procurers."
          )}
        </p>
      </div>

      <div>
        {displayedOffers.length === 0 ? (
          <EmptyState
            title="No offers pending on this lot"
            text="When buyers review your published lots, their price bids and procurement terms will show up here."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {displayedOffers.map((o) => (
              <div key={o.id}>
                <OfferCard
                  offer={o}
                  onAccept={() => handleAccept(o.id, o.lotId)}
                  onReject={() => handleReject(o.id)}
                  onCounter={() => setCounterId(o.id)}
                />

                {counterId === o.id && (
                  <div className="card card-pad" style={{ marginTop: 8, background: "#FDFCF8", border: "1.5px solid var(--saffron)" }}>
                    <h4 style={{ fontSize: "15px", fontWeight: 800, marginBottom: 8 }}>
                      Submit Counter Offer to {o.buyerName}
                    </h4>
                    <div className="field" style={{ maxWidth: 300 }}>
                      <label>Your Counter Price (₹/kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(Number(e.target.value))}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={() => handleSendCounter(o.id)}
                      >
                        Send Counter Offer
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => setCounterId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
