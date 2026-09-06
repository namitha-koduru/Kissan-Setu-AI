import React, { useState } from "react";
import type { ChatMessageItem } from "../../services/chatApi";
import { VoicePlayback } from "./VoicePlayback";
import { Mic, ShieldCheck, BookOpen, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageItem;
  isLatest?: boolean;
  language?: string;
  autoPlayVoice?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLatest = false,
  language = "en",
  autoPlayVoice = false,
}) => {
  const isUser = message.role === "user";
  const [showFullImage, setShowFullImage] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(true);

  // Formatter for markdown, bold, lists, and agricultural inspection headers

  const formatContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lIdx) => {
      // Process bold formatting **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const inner = part.slice(2, -2);
          return (
            <strong
              key={pIdx}
              style={{
                color: isUser ? "inherit" : "var(--green-deep)",
                fontWeight: 700,
              }}
            >
              {inner}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith("•") || line.trim().startsWith("*") || line.trim().startsWith("-")) {
        return (
          <div key={lIdx} style={{ display: "flex", gap: "8px", margin: "3px 0 3px 6px" }}>
            <span style={{ color: isUser ? "inherit" : "var(--green-deep)", fontWeight: "bold" }}>•</span>
            <span>{formattedLine}</span>
          </div>
        );
      }

      if (line.trim().match(/^\d+\./)) {
        return (
          <div key={lIdx} style={{ margin: "4px 0 4px 6px" }}>
            <span>{formattedLine}</span>
          </div>
        );
      }

      return (
        <div key={lIdx} style={{ minHeight: line.trim() ? "auto" : "6px", margin: "2px 0" }}>
          {formattedLine}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "16px",
        gap: "10px",
        alignItems: "flex-start",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--green-deep), var(--green-leaf))",
            color: "var(--white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "bold",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(23, 107, 69, 0.25)",
          }}
          title="KissanSetu AI"
        >
          🌾
        </div>
      )}

      <div
        style={{
          maxWidth: "85%",
          padding: "12px 16px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, var(--green-deep), #1e7a50)"
            : "var(--white)",
          color: isUser ? "var(--white)" : "var(--ink)",
          border: isUser ? "none" : "1px solid var(--line-strong)",
          boxShadow: isUser
            ? "0 4px 12px rgba(23, 107, 69, 0.2)"
            : "var(--shadow-1)",
          fontSize: "14px",
          lineHeight: "1.6",
          wordBreak: "break-word",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: isUser ? "rgba(255,255,255,0.85)" : "var(--green-deep)",
            }}
          >
            {isUser ? "You (Farmer)" : "KissanSetu AI"}
          </span>
          {message.created_at && (
            <span
              style={{
                fontSize: "10px",
                color: isUser ? "rgba(255,255,255,0.7)" : "var(--ink-soft)",
                marginLeft: "12px",
              }}
            >
              {message.created_at.slice(11, 16)}
            </span>
          )}
        </div>

        {/* Attached Crop Image if present */}
        {message.image_url && (
          <div style={{ marginBottom: "10px" }}>
            <div
              onClick={() => setShowFullImage(true)}
              style={{
                cursor: "pointer",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1.5px solid rgba(255,255,255,0.3)",
                maxWidth: "240px",
                maxHeight: "200px",
                background: "#000",
                display: "inline-block",
                position: "relative",
              }}
              title="Click to view full image"
            >
              <img
                src={message.image_url.startsWith("http") || message.image_url.startsWith("blob:") ? message.image_url : `http://localhost:8000${message.image_url}`}
                alt="Uploaded Crop"
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "180px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "4px",
                  right: "6px",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                🔍 Click to zoom
              </div>
            </div>
          </div>
        )}

        <div>{formatContent(message.content)}</div>

        {/* Verified Knowledge & Research Sources (Phase 8 RAG Grounding) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(23, 107, 69, 0.05), rgba(46, 139, 87, 0.03))",
              border: "1px solid rgba(23, 107, 69, 0.18)",
            }}
          >
            <div
              onClick={() => setSourcesOpen(!sourcesOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={16} color="var(--green-deep)" />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--green-deep)",
                    letterSpacing: "0.2px",
                  }}
                >
                  Verified Research Citations ({message.sources.length})
                </span>
              </div>
              <div style={{ color: "var(--ink-soft)", display: "flex", alignItems: "center" }}>
                {sourcesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {sourcesOpen && (
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {message.sources.map((src, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "6px",
                      background: "var(--white)",
                      border: "1px solid var(--line-strong)",
                      fontSize: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 600, color: "var(--ink)" }}>
                        <BookOpen size={13} color="var(--green-leaf)" />
                        <span>{src.title}</span>
                      </div>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open official advisory link"
                          style={{
                            color: "var(--green-deep)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "2px",
                            fontSize: "11px",
                            fontWeight: 600,
                            textDecoration: "none",
                            flexShrink: 0,
                          }}
                        >
                          Official Link <ExternalLink size={11} />
                        </a>
                      )}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      {src.authority && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "var(--green-deep)",
                            background: "rgba(23, 107, 69, 0.1)",
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          🏛 {src.authority}
                        </span>
                      )}
                      {src.category && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--ink-soft)",
                            background: "#f0f2f5",
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {src.category.replace(/_/g, " ").toLowerCase()}
                        </span>
                      )}
                      {src.crop && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#8c5600",
                            background: "#fff5e6",
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          🌱 {src.crop}
                        </span>
                      )}
                      {src.last_verified_at && (
                        <span style={{ fontSize: "10px", color: "var(--ink-soft)", marginLeft: "auto" }}>
                          Verified: {src.last_verified_at}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assistant Voice Playback */}
        {!isUser && (
          <div style={{ marginTop: "6px" }}>
            <VoicePlayback
              audioUrl={message.audio_url}
              textToSpeak={message.content.replace(/[*_#•]/g, "")}
              language={language}
              autoPlay={isLatest && autoPlayVoice}
            />
          </div>
        )}
      </div>


      {isUser && (
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--saffron), #f29938)",
            color: "var(--white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: "bold",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(232, 137, 34, 0.25)",
          }}
          title="Farmer Profile"
        >
          {message.content.startsWith("🎙") ? <Mic size={18} color="#FFF" /> : "👨‍🌾"}
        </div>
      )}

      {/* Lightbox Modal */}
      {showFullImage && message.image_url && (
        <div
          onClick={() => setShowFullImage(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "zoom-out",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}>
            <img
              src={message.image_url.startsWith("http") || message.image_url.startsWith("blob:") ? message.image_url : `http://localhost:8000${message.image_url}`}
              alt="Crop inspection preview"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            />
            <button
              onClick={() => setShowFullImage(false)}
              style={{
                position: "absolute",
                top: "-14px",
                right: "-14px",
                background: "var(--white)",
                color: "var(--ink)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
