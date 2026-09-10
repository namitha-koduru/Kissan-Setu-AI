import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, User, Building2, RefreshCw, CheckCircle2 } from "lucide-react";
import apiClient from "../services/api";
import { useAuth } from "../context/AuthContext";
import { subscribeNegotiationRoom } from "../services/websocket";

export interface NegotiationMessage {
  id?: number;
  lot_id: number;
  offer_id?: number | null;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  receiver_id?: string | null;
  message: string;
  proposed_price?: number | null;
  proposed_quantity?: number | null;
  created_at?: string;
}

interface Props {
  lotId: number | string;
  lotCropName?: string;
  lotQuantityKg?: number;
  askingPrice?: number;
  offerId?: number;
  counterpartName?: string;
  counterpartRole?: string;
  counterpartLocation?: string;
  onClose: () => void;
}

export function NegotiationChatModal({
  lotId,
  lotCropName = "Produce",
  lotQuantityKg,
  askingPrice,
  offerId,
  counterpartName,
  counterpartRole,
  counterpartLocation,
  onClose,
}: Props) {
  const { user } = useAuth();
  const numericLotId = typeof lotId === "number" ? lotId : parseInt(String(lotId).replace(/\D/g, "")) || 1;
  
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState<string>(askingPrice ? String(askingPrice) : "");
  const [proposedQuantity, setProposedQuantity] = useState<string>(lotQuantityKg ? String(lotQuantityKg) : "");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<NegotiationMessage[]>(`/negotiations/lot/${numericLotId}`);
      if (res) {
        setMessages(res);
      }
    } catch (err) {
      console.warn("Could not fetch remote negotiation messages, using local fallback", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to Live WebSocket Room for instant zero-latency messages
    const sub = subscribeNegotiationRoom(numericLotId, (event) => {
      if (event.type === "NEW_MESSAGE" && event.message) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === event.message.id)) return prev;
          return [...prev, event.message];
        });
      }
    });

    return () => {
      sub.close();
    };
  }, [numericLotId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const currentSenderId = String(user?.id || "u-1");
    const currentSenderName = user?.name || "Market Participant";
    const currentSenderRole = user?.role || "buyer";

    const payload = {
      lot_id: numericLotId,
      offer_id: offerId || null,
      sender_id: currentSenderId,
      sender_name: currentSenderName,
      sender_role: currentSenderRole,
      message: newMessage.trim(),
      proposed_price: proposedPrice ? parseFloat(proposedPrice) : null,
      proposed_quantity: proposedQuantity ? parseFloat(proposedQuantity) : null,
    };

    try {
      setSending(true);
      const res = await apiClient.post<NegotiationMessage>(
        `/negotiations/lot/${numericLotId}/messages`,
        payload
      );
      if (res) {
        setMessages((prev) => [...prev, res]);
      }
      setNewMessage("");
    } catch (err) {
      console.warn("Failed to persist negotiation message:", err);
      // Client optimistic state
      setMessages((prev) => [
        ...prev,
        {
          ...payload,
          id: Date.now(),
          created_at: new Date().toISOString(),
        },
      ]);
      setNewMessage("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 30, 20, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "540px",
          height: "90vh",
          maxHeight: "680px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1px solid #D5E5D8",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            background: "linear-gradient(135deg, #176B45 0%, #115234 100%)",
            color: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageSquare size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800 }}>
                Bargaining & Direct Negotiation
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>
                Lot #{numericLotId} · {lotCropName} {lotQuantityKg ? `(${lotQuantityKg} kg)` : ""}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={fetchMessages}
              style={{
                background: "transparent",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: "6px",
              }}
              title="Refresh messages"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: 28,
                height: 28,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Counterpart Identity Strip */}
        <div
          style={{
            background: "#F4F8F5",
            padding: "8px 18px",
            borderBottom: "1px solid #E2ECE4",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px",
            color: "#2C3E30",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "14px" }}>
              {counterpartRole === "buyer" ? "🏢" : counterpartRole === "fpo" ? "🌾" : "👨‍🌾"}
            </span>
            <span style={{ fontWeight: 700 }}>
              {counterpartName || (user?.role === "buyer" ? "Producer (Farmer)" : "Institutional Procurer")}
            </span>
            {counterpartLocation && (
              <span style={{ color: "#667085" }}>· 📍 {counterpartLocation}</span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#176B45", fontWeight: 700, marginLeft: 4 }}>
              <CheckCircle2 size={12} /> Verified Trade
            </span>
          </div>
          <div style={{ fontSize: "12px" }}>
            Asking: <strong>₹{askingPrice || 30}/kg</strong> · {lotQuantityKg || 500} kg
          </div>
        </div>

        {/* Message Log */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            background: "#F9FAF8",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                margin: "auto",
                textAlign: "center",
                color: "#7A8C7F",
                fontSize: "13px",
                maxWidth: "280px",
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>No negotiation messages yet.</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
                Propose a rate or send counter-terms to begin bargaining.
              </p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe = String(m.sender_id) === String(user?.id);
              return (
                <div
                  key={m.id || idx}
                  style={{
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#6B7C72",
                      marginBottom: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {m.sender_role === "buyer" ? <Building2 size={11} /> : <User size={11} />}
                    <span style={{ fontWeight: 700 }}>{m.sender_name}</span>
                    <span style={{ textTransform: "uppercase", fontSize: "9.5px", opacity: 0.8 }}>
                      ({m.sender_role})
                    </span>
                  </div>

                  <div
                    style={{
                      background: isMe ? "#176B45" : "#FFFFFF",
                      color: isMe ? "#FFFFFF" : "#1A2E20",
                      padding: "10px 14px",
                      borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      border: isMe ? "none" : "1px solid #E2ECE4",
                      fontSize: "13.5px",
                      lineHeight: "1.4",
                    }}
                  >
                    {m.message}

                    {(m.proposed_price || m.proposed_quantity) && (
                      <div
                        style={{
                          marginTop: "6px",
                          paddingTop: "6px",
                          borderTop: `1px dashed ${isMe ? "rgba(255,255,255,0.3)" : "#E2ECE4"}`,
                          display: "flex",
                          gap: "8px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                        }}
                      >
                        {m.proposed_price && (
                          <span
                            style={{
                              background: isMe ? "rgba(255,255,255,0.2)" : "#EAF4EE",
                              color: isMe ? "#FFFFFF" : "#176B45",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            ₹{m.proposed_price}/kg
                          </span>
                        )}
                        {m.proposed_quantity && (
                          <span
                            style={{
                              background: isMe ? "rgba(255,255,255,0.2)" : "#EAF4EE",
                              color: isMe ? "#FFFFFF" : "#176B45",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {m.proposed_quantity} kg
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: "10px", color: "#8E9E94", marginTop: "2px" }}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: "12px 16px",
            background: "#FFFFFF",
            borderTop: "1px solid #E2ECE4",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11.5px", color: "#6B7C72", fontWeight: 700 }}>₹/kg:</span>
              <input
                type="number"
                step={0.5}
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder="Rate"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  border: "1px solid #CCD8D0",
                  fontSize: "12px",
                }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11.5px", color: "#6B7C72", fontWeight: 700 }}>Qty:</span>
              <input
                type="number"
                value={proposedQuantity}
                onChange={(e) => setProposedQuantity(e.target.value)}
                placeholder="Kg"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  border: "1px solid #CCD8D0",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your bargaining offer or reply..."
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #CCD8D0",
                fontSize: "13.5px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              style={{
                background: "#176B45",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "0 16px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
