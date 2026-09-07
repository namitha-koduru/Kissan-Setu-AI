import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import LanguageSelector from "../components/chat/LanguageSelector";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import SuggestedQuestions from "../components/chat/SuggestedQuestions";
import chatApi, { type ChatMessageItem, type ConversationDetail } from "../services/chatApi";
import voiceApi from "../services/voiceApi";
import { Mic } from "lucide-react";

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cropIdParam = searchParams.get("crop_id");
  const cropNameParam = searchParams.get("crop_name");
  const modeParam = searchParams.get("mode");

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationDetail[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
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
          sources: response.sources,
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
        sources: response.sources,
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


  const handleSendVoice = async (audioBlob: Blob, imageFile?: File | null) => {
    if (isLoading) return;

    setError(null);
    const previewUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;
    const tempUserMsgId = `user_${Date.now()}`;

    // Place temporary voice message in chat
    const userMsg: ChatMessageItem = {
      id: tempUserMsgId,
      role: "user",
      content: "🎙 Transcribing speech...",
      image_url: previewUrl,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setLoadingStage("Transcribing spoken audio...");

    try {
      setTimeout(() => {
        setLoadingStage("Querying farm intelligence & market data...");
      }, 1000);

      setTimeout(() => {
        setLoadingStage("Generating voice advisory response...");
      }, 2400);

      const cropIdNum = cropIdParam ? parseInt(cropIdParam, 10) : undefined;
      const res = await voiceApi.voiceChat({
        audio: audioBlob,
        image: imageFile,
        language: selectedLanguage,
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
      if (res.language) {
        setSelectedLanguage(res.language);
      }

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
      setError("Failed to process voice query. Please try speaking again or use text chat.");
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
      <div className="chat-header">
        <div>
          <div className="flex flex-center gap-md">
            <span style={{ fontSize: "24px" }}>🌾</span>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Ask KissanSetu
            </h1>
            <span className="page-tag">
              Phase 7 Voice AI
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "2px", margin: 0 }}>
            {cropNameParam
              ? `Focused on ${cropNameParam} • Speak naturally or upload leaf photos for comprehensive guidance`
              : "Your multilingual AI farming companion with speech recognition, vision AI, and guaranteed in-hand market intelligence"}
          </p>
        </div>

        <div className="flex flex-center gap-md">
          <button
            type="button"
            onClick={() => setVoiceModeActive(!voiceModeActive)}
            className={`voice-mode-btn ${voiceModeActive ? "active" : ""}`}
          >
            <Mic size={14} />
            <span>{voiceModeActive ? "Voice Mode Active" : "Enable Voice Mode"}</span>
          </button>

          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
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
            <span>New Advisory</span>
          </button>

          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", padding: "8px 6px 0" }}>
            Recent Discussions
          </div>

          <div className="conversation-list">
            {conversations.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--ink-soft)", padding: "10px", fontStyle: "italic" }}>
                No past discussions yet. Tap the mic to speak your question!
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
                      {isVoice ? "🎙 " : isVision ? "📷 " : "💬 "}{conv.title || "Farming Advisory"}
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
            ⚡ <strong>Farm Context:</strong> Ramesh Kumar (Nashik) • Tomatoes, Onions
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div className="chat-main">
          {/* Top Chat Bar */}
          <div className="chat-top-bar">
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

          {/* Persistent Suggested Questions */}
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
              onSendVoice={handleSendVoice}
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
