import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import LanguageSelector from "../components/chat/LanguageSelector";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import SuggestedQuestions from "../components/chat/SuggestedQuestions";
import chatApi, { type ChatMessageItem, type ConversationDetail } from "../services/chatApi";
import voiceApi from "../services/voiceApi";
import { useLanguage } from "../context/LanguageContext";
import type { LanguageCode } from "../types";
import { Mic } from "lucide-react";

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cropIdParam = searchParams.get("crop_id");
  const cropNameParam = searchParams.get("crop_name");
  const modeParam = searchParams.get("mode");

  const { lang, setLang, t } = useLanguage();

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<{ text: string; image?: File | null }>({ text: "" });
  const [voiceModeActive, setVoiceModeActive] = useState<boolean>(modeParam === "voice");

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
    if (conv.language && conv.language !== lang) {
      setLang(conv.language as LanguageCode);
    }
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

  const handleLanguageChange = (code: string) => {
    setLang(code as LanguageCode);
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
      setLoadingStage(t("chat.analyzing", "Analyzing with AI..."));

      try {
        const cropIdNum = cropIdParam ? parseInt(cropIdParam, 10) : undefined;
        const response = await chatApi.analyzeImage({
          image: imageFile,
          message: text.trim() || undefined,
          language: lang,
          conversation_id: conversationId,
          farmer_id: 1,
          crop_id: cropIdNum,
        });

        setConversationId(response.conversation_id);

        const asstMsg: ChatMessageItem = {
          id: `asst_${Date.now()}`,
          role: "assistant",
          content: response.reply,
          sources: response.sources,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, asstMsg]);
        loadConversations();
      } catch (err: any) {
        setError(err.message || t("common.error", "Failed to analyze crop image. Please check image format and try again."));
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
    setLoadingStage(t("chat.analyzing", "Analyzing with AI..."));

    try {
      const response = await chatApi.sendMessage({
        message: text,
        language: lang,
        conversation_id: conversationId,
        farmer_id: 1,
      });

      setConversationId(response.conversation_id);

      const asstMsg: ChatMessageItem = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: response.reply,
        sources: response.sources,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, asstMsg]);
      loadConversations();
    } catch (err: any) {
      setError(t("common.error", "Unable to reach KissanSetu AI right now. Please try again."));
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  const handleSendVoice = async (audioBlob: Blob, imageFile?: File | null) => {
    if (isLoading) return;

    setError(null);
    const previewUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;
    const tempUserMsgId = `user_${Date.now()}`;

    // Place temporary voice message in chat
    const userMsg: ChatMessageItem = {
      id: tempUserMsgId,
      role: "user",
      content: `🎙 ${t("chat.analyzing", "Transcribing speech...")}`,
      image_url: previewUrl,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setLoadingStage(t("chat.analyzing", "Processing voice input with AI..."));

    try {
      const cropIdNum = cropIdParam ? parseInt(cropIdParam, 10) : undefined;
      const res = await voiceApi.voiceChat({
        audio: audioBlob,
        image: imageFile,
        language: lang,
        conversation_id: conversationId,
        farmer_id: 1,
        crop_id: cropIdNum,
      });

      // Update user message with transcript
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempUserMsgId
            ? { ...m, content: `🎙 ${res.transcript}` }
            : m
        )
      );

      setConversationId(res.conversation_id);

      // Add assistant response with audio playback & verified knowledge citations
      const asstMsg: ChatMessageItem = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: res.response,
        audio_url: res.audio?.url,
        sources: res.sources,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, asstMsg]);
      loadConversations();
    } catch (err: any) {
      setError(t("common.error", "Failed to process voice query. Please try speaking again or use text chat."));
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
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "16px" }}>
      {/* Top Header */}
      <div className="chat-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="flex flex-center gap-sm">
            <span style={{ fontSize: "22px" }}>🌾</span>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--navy)", margin: 0 }}>
              {t("chat.title", "Ask KissanSetu AI")}
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "3px", margin: 0 }}>
            {cropNameParam
              ? `${t("crops.cropName", "Crop")}: ${cropNameParam} • ${t("chat.subtitle", "Your multilingual farming assistant")}`
              : t("chat.subtitle", "Your multilingual farming assistant")}
          </p>
        </div>

        <div className="flex flex-center gap-sm flex-wrap">
          <button
            type="button"
            onClick={() => setVoiceModeActive(!voiceModeActive)}
            className={`voice-mode-btn ${voiceModeActive ? "active" : ""}`}
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            <Mic size={14} />
            <span>{voiceModeActive ? t("chat.voiceActive", "Voice Active") : t("chat.enableVoice", "Voice Mode")}</span>
          </button>

          <LanguageSelector
            selectedLanguage={lang}
            onSelectLanguage={handleLanguageChange}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Main Layout Card */}
      <div className="chat-layout">
        {/* Left Sidebar: Conversations History */}
        <div className="chat-sidebar">
          <button
            type="button"
            onClick={handleNewConversation}
            className="new-advisory-btn"
          >
            <span>+</span>
            <span>{t("chat.newAdvisory", "New Advisory")}</span>
          </button>

          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", padding: "8px 6px 0" }}>
            {t("chat.recentDiscussions", "Recent Discussions")}
          </div>

          <div className="conversation-list">
            {conversations.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--ink-soft)", padding: "10px", fontStyle: "italic" }}>
                {t("chat.noDiscussions", "No past discussions yet. Type or tap the mic to speak!")}
              </p>
            ) : (
              conversations.map((conv) => {
                const isActive = conversationId === conv.id;
                const isVoice = conv.title?.includes("🎙");
                const isVision = conv.title?.toLowerCase().includes("crop") || conv.title?.toLowerCase().includes("leaf") || conv.title?.toLowerCase().includes("inspection");
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv)}
                    className={`conversation-item ${isActive ? "active" : ""}`}
                  >
                    <span className="conversation-title">
                      {isVoice ? "🎙 " : isVision ? "📷 " : "💬 "}{conv.title || t("chat.title", "Farming Advisory")}
                    </span>
                    <span className="conversation-meta">
                      {conv.created_at ? conv.created_at.slice(0, 10) : "Today"} • {conv.language?.toUpperCase() || "EN"}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div style={{ padding: "10px 6px", borderTop: "1px solid var(--line)", fontSize: "11px", color: "var(--ink-soft)" }}>
            ⚡ <strong>KissanSetu AI:</strong> {t("landing.verifiedIntelligence", "Verified ICAR & APMC Data")}
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div className="chat-main">
          {/* Top Chat Bar */}
          <div className="chat-top-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                {conversationId ? t("chat.title", "Active Discussion") : t("chat.newAdvisory", "New Discussion")}
              </span>
              <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
                • {t("profile.languagePref", "Language")}: {lang.toUpperCase()}
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
                {t("chat.clear", "Clear")}
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
            language={lang}
          />

          {/* Persistent Suggested Questions */}
          {messages.length > 0 && (
            <div style={{ padding: "0 20px" }}>
              <SuggestedQuestions
                onSelect={(q) => handleSendMessage(q)}
                language={lang}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <div style={{ padding: "16px 20px", background: "var(--white)", borderTop: "1px solid var(--line)" }}>
            <ChatInput
              onSendMessage={handleSendMessage}
              onSendVoice={handleSendVoice}
              isLoading={isLoading}
              loadingStage={loadingStage}
              language={lang}
              placeholder={t("chat.placeholder", "Ask any question about crops, irrigation, weather, markets, or general topics...")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
