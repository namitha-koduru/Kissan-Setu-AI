import React from "react";
import { Globe } from "lucide-react";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#FFFFFF",
        border: "1px solid var(--line-strong)",
        borderRadius: 8,
        padding: "4px 8px",
      }}
    >
      <Globe size={14} color="var(--green-deep)" />
      <select
        value={selectedLanguage}
        disabled={disabled}
        onChange={(e) => onSelectLanguage(e.target.value)}
        aria-label="Select Language"
        style={{
          border: "none",
          background: "transparent",
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--navy)",
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          paddingRight: 4,
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
