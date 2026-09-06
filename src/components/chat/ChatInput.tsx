import React, { useState, useRef } from "react";

interface ChatInputProps {
  onSendMessage: (text: string, imageFile?: File | null) => void;
  isLoading: boolean;
  language?: string;
  placeholder?: string;
  loadingStage?: string;
}

const PLACEHOLDERS_BY_LANG: Record<string, string> = {
  hi: "अपनी फसल, सिंचाई, मौसम या मंडी से जुड़ा प्रश्न यहाँ पूछें...",
  mr: "पिकाचे नियोजन, सिंचन, हवामान किंवा बाजारभावाबाबत विचारा...",
  te: "మీ పంట సాగు, నీటి పారుదల లేదా మార్కెట్ ధరల గురించి అడగండి...",
  en: "Ask about crop symptoms, irrigation, weather risk, or mandi prices...",
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  language = "en",
  placeholder,
  loadingStage,
}) => {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultPlaceholder =
    placeholder || PLACEHOLDERS_BY_LANG[language] || PLACEHOLDERS_BY_LANG.en;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size exceeds 10 MB limit. Please select a smaller photo.");
        return;
      }
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !selectedImage) || isLoading) return;

    onSendMessage(text.trim(), selectedImage);
    setText("");
    handleRemoveImage();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Image Preview Card */}
      {selectedImage && imagePreviewUrl && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: "var(--cream)",
            padding: "8px 12px",
            borderRadius: "12px",
            border: "1px solid var(--line-strong)",
            maxWidth: "fit-content",
            boxShadow: "var(--shadow-1)",
          }}
        >
          <img
            src={imagePreviewUrl}
            alt="Preview"
            style={{
              width: "48px",
              height: "48px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid var(--line)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--ink)",
                maxWidth: "180px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedImage.name}
            </span>
            <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
              {(selectedImage.size / 1024).toFixed(0)} KB • Vision AI ready
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            title="Remove image"
            style={{
              background: "rgba(0,0,0,0.06)",
              border: "none",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "12px",
              color: "var(--ink-soft)",
              marginLeft: "6px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Input Bar */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "10px",
          background: "var(--white)",
          padding: "10px 14px",
          borderRadius: "16px",
          border: "1.5px solid var(--line-strong)",
          boxShadow: "0 4px 16px rgba(23, 50, 30, 0.08)",
          transition: "border-color 0.2s ease",
        }}
      >
        {/* Hidden File Input for Camera/Gallery */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          style={{ display: "none" }}
          id="chat-crop-image-upload"
        />

        <button
          type="button"
          title="Upload or capture crop/leaf photo"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          style={{
            background: selectedImage ? "var(--green-light)" : "none",
            border: selectedImage ? "1px solid var(--green-deep)" : "none",
            fontSize: "18px",
            color: selectedImage ? "var(--green-deep)" : "var(--ink-soft)",
            cursor: isLoading ? "not-allowed" : "pointer",
            padding: "6px 8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          📷
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={selectedImage ? "Add notes about this leaf (optional) and send..." : defaultPlaceholder}
          disabled={isLoading}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            lineHeight: "1.5",
            padding: "6px 2px",
            maxHeight: "120px",
            color: "var(--ink)",
            background: "transparent",
          }}
        />

        <button
          type="submit"
          disabled={isLoading || (!text.trim() && !selectedImage)}
          style={{
            background: isLoading || (!text.trim() && !selectedImage)
              ? "var(--line-strong)"
              : "linear-gradient(135deg, var(--green-deep), var(--green-leaf))",
            color: "var(--white)",
            border: "none",
            borderRadius: "12px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: isLoading || (!text.trim() && !selectedImage) ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: isLoading || (!text.trim() && !selectedImage) ? "none" : "0 3px 8px rgba(23, 107, 69, 0.3)",
            transition: "all 0.15s ease",
            height: "38px",
          }}
        >
          {isLoading ? (
            <>
              <span style={{ fontSize: "14px", animation: "pulse 1.5s infinite" }}>⏳</span>
              <span style={{ fontSize: "13px" }}>{loadingStage || "Processing..."}</span>
            </>
          ) : (
            <>
              <span>{selectedImage ? "Analyze" : "Send"}</span>
              <span>➔</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
