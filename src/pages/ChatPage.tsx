import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import LanguageSelector from "../components/chat/LanguageSelector";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import SuggestedQuestions from "../components/chat/SuggestedQuestions";
import chatApi, { type ChatMessageItem, type ConversationDetail } from "../services/chatApi";

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cropIdParam = searchParams.get("crop_id");
  const cropNameParam = searchParams.get("crop_name");

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationDetail[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<{ text: string; image?: File | null }>({ text: "" });

  // Load past conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const list = await chatApi.getConversations(1);
    setConversations(list);
  };

  const handleSelectConversation = async (conv: ConversationDetail) => {
    setConversationId(conv.id);
    setSelectedLanguage(conv.language || "en");
    setError(null);
    const full = await chatApi.getConversation(conv.id);
    if (full && full.messages) {
      setMessages(full.messages);
    } else {
      setMessages([]);
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  };

  const handleSendMessage = async (text: string, imageFile?: File | null) => {
    if ((!text.trim() && !imageFile) || isLoading) return;

    setError(null);
    setLastPrompt({ text, image: imageFile });

    // If an image is attached, run the Vision AI workflow
    if (imageFile) {
      const previewUrl = URL.createObjectURL(imageFile);
      const userMsg: ChatMessageItem = {
        id: `user_${Date.now()}`,
        role: "user",
        content: text.trim() || `Uploaded crop/leaf image: ${imageFile.name}`,
        image_url: previewUrl,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setLoadingStage("Uploading crop image...");

      try {
        // Stage 2 indicator
        setTimeout(() => {
          setLoadingStage("Analyzing visible symptoms with Vision AI...");
        }, 1200);

        setTimeout(() => {
          setLoadingStage("Preparing localized guidance...");
        }, 2800);

        const cropIdNum = cropIdParam ? parseInt(cropIdParam, 10) : undefined;
        const response = await chatApi.analyzeImage({
          image: imageFile,
          message: text.trim() || undefined,
          language: selectedLanguage,
          conversation_id: conversationId,
          farmer_id: 1,
          crop_id: cropIdNum,
        });

        setConversationId(response.conversation_id);
        if (response.language) {
          setSelectedLanguage(response.language);
        }

        const asstMsg: ChatMessageItem = {
          id: `asst_${Date.now()}`,
          role: "assistant",
          content: response.reply,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, asstMsg]);
        loadConversations();
      } catch (err: any) {
        setError(err.message || "Failed to analyze crop image. Please check image format and try again.");
      } finally {
        setIsLoading(false);
        setLoadingStage("");
      }
      return;
    }

    // Standard text message
    const userMsg: ChatMessageItem = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setLoadingStage("Analyzing field data & weather risks...");

    try {
      const response = await chatApi.sendMessage({
        message: text,
        language: selectedLanguage,
        conversation_id: conversationId,
        farmer_id: 1,
      });

      setConversationId(response.conversation_id);
      if (response.language) {
        setSelectedLanguage(response.language);
      }

      const asstMsg: ChatMessageItem = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: response.reply,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, asstMsg]);
      loadConversations();
    } catch (err: any) {
      setError("Unable to reach KissanSetu AI right now. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  const handleRetry = () => {
    if (lastPrompt.text || lastPrompt.image) {
      handleSendMessage(lastPrompt.text, lastPrompt.image);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>🌾</span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Ask KissanSetu
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                background: "var(--green-light)",
                color: "var(--green-deep)",
                padding: "2px 8px",
                borderRadius: "12px",
                border: "1px solid rgba(23, 107, 69, 0.2)",
              }}
            >
              Vision AI v3.0
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "2px", margin: 0 }}>
            {cropNameParam
              ? `Focused on ${cropNameParam} • Upload leaf photos for symptom inspection or ask agronomic queries`
              : "Your AI farming companion for crop health, leaf inspection, weather risks, and mandi realization"}
          </p>
        </div>

        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          disabled={isLoading}
        />
      </div>

      {/* Main Layout Card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "16px",
          minHeight: "640px",
          background: "var(--white)",
          borderRadius: "18px",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow-2)",
          overflow: "hidden",
        }}
      >
        {/* Left Sidebar: Conversations History */}
        <div
          style={{
            borderRight: "1px solid var(--line)",
            background: "var(--cream)",
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={handleNewConversation}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 14px",
              background: "var(--green-deep)",
              color: "var(--white)",
              border: "none",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(23, 107, 69, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <span>+</span>
            <span>New Advisory</span>
          </button>

          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", padding: "8px 6px 0" }}>
            Recent Discussions
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {conversations.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--ink-soft)", padding: "10px", fontStyle: "italic" }}>
                No past discussions yet. Start a new question or upload a leaf photo!
              </p>
            ) : (
              conversations.map((conv) => {
                const isActive = conversationId === conv.id;
                const isVision = conv.title?.toLowerCase().includes("crop") || conv.title?.toLowerCase().includes("leaf") || conv.title?.toLowerCase().includes("inspection");
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: isActive ? "1.5px solid var(--green-deep)" : "1px solid transparent",
                      background: isActive ? "var(--green-light)" : "transparent",
                      color: "var(--ink)",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                      {isVision ? "📷 " : "💬 "}{conv.title || "Farming Advisory"}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--ink-soft)", marginTop: "2px" }}>
                      {conv.created_at ? conv.created_at.slice(0, 10) : "Today"} • {conv.language?.toUpperCase() || "EN"}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div style={{ padding: "10px 6px", borderTop: "1px solid var(--line)", fontSize: "11px", color: "var(--ink-soft)" }}>
            ⚡ <strong>Farm Context:</strong> Ramesh Kumar (Nashik) • Tomatoes, Onions
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-soft)" }}>
          {/* Top Chat Bar */}
          <div
            style={{
              padding: "12px 20px",
              background: "var(--white)",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                {conversationId ? "Active Discussion" : "New Discussion"}
              </span>
              <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                • Language: {selectedLanguage.toUpperCase()}
              </span>
              {cropNameParam && (
                <span
                  style={{
                    fontSize: "11px",
                    background: "var(--cream)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    color: "var(--green-deep)",
                    fontWeight: 600,
                  }}
                >
                  🌾 {cropNameParam}
                </span>
              )}
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleNewConversation}
                style={{
                  background: "none",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "8px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  color: "var(--ink-soft)",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Chat Transcript Window */}
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            loadingStage={loadingStage}
            error={error}
            onRetry={handleRetry}
            onSelectQuestion={(q) => handleSendMessage(q)}
            language={selectedLanguage}
          />

          {/* Persistent Suggested Questions (if in an active chat) */}
          {messages.length > 0 && (
            <div style={{ padding: "0 20px" }}>
              <SuggestedQuestions
                onSelect={(q) => handleSendMessage(q)}
                language={selectedLanguage}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <div style={{ padding: "16px 20px", background: "var(--white)", borderTop: "1px solid var(--line)" }}>
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              loadingStage={loadingStage}
              language={selectedLanguage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
