import React, { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import SuggestedQuestions from "./SuggestedQuestions";
import type { ChatMessageItem } from "../../services/chatApi";

interface ChatWindowProps {
  messages: ChatMessageItem[];
  isLoading: boolean;
  loadingStage?: string;
  error?: string | null;
  onRetry?: () => void;
  onSelectQuestion: (q: string) => void;
  language: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  loadingStage,
  error,
  onRetry,
  onSelectQuestion,
  language,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, error]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      {messages.length === 0 ? (
        <div
          style={{
            margin: "auto",
            maxWidth: "580px",
            textAlign: "center",
            padding: "24px 16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--green-light)",
              color: "var(--green-deep)",
              fontSize: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              boxShadow: "var(--shadow-1)",
            }}
          >
            🌱
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
            Ask KissanSetu AI
          </h3>
          <p style={{ fontSize: "14px", color: "var(--ink-soft)", lineHeight: "1.5", marginBottom: "20px" }}>
            Your 24/7 intelligent agricultural companion. Upload crop leaf photos for instant Vision AI symptoms assessment, or ask about irrigation, weather risks, and mandi realization in your language.
          </p>

          <SuggestedQuestions
            onSelect={onSelectQuestion}
            language={language}
            disabled={isLoading}
          />
        </div>
      ) : (
        <>
          {messages.map((msg, idx) => (
            <ChatMessage
              key={msg.id || idx}
              message={msg}
              isLatest={idx === messages.length - 1}
            />
          ))}

          {isLoading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "var(--green-light)",
                  color: "var(--green-deep)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                🌾
              </div>
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: "16px 16px 16px 4px",
                  background: "var(--white)",
                  border: "1px solid var(--line-strong)",
                  fontSize: "13px",
                  color: "var(--ink-soft)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "var(--shadow-1)",
                }}
              >
                <span>{loadingStage || "Analyzing field data & weather risks..."}</span>
                <span style={{ animation: "pulse 1.5s infinite" }}>⏳</span>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                margin: "10px 0",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "var(--danger-soft)",
                border: "1px solid rgba(163, 55, 43, 0.2)",
                color: "var(--danger)",
                fontSize: "13px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>⚠️ {error}</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  style={{
                    background: "var(--danger)",
                    color: "var(--white)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
