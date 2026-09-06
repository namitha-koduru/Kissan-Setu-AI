import React from "react";

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
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-soft)" }}>
        🌐 भाषा / Language:
      </span>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              disabled={disabled}
              onClick={() => onSelectLanguage(lang.code)}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: isSelected ? 600 : 500,
                borderRadius: "20px",
                border: isSelected ? "1.5px solid var(--green-deep)" : "1px solid var(--line-strong)",
                background: isSelected ? "var(--green-light)" : "var(--white)",
                color: isSelected ? "var(--green-deep)" : "var(--ink)",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
              title={lang.name}
            >
              {lang.nativeName}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSelector;
