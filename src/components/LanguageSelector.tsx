import { useLanguage } from "../context/LanguageContext";
import type { LanguageCode } from "../types";

export function LanguageSelector() {
  const { lang, setLang, languages } = useLanguage();
  return (
    <label className="lang-select">
      <span className="visually-hidden">Language</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as LanguageCode)}
        aria-label="Select language"
      >
        {(Object.keys(languages) as LanguageCode[]).map((code) => (
          <option key={code} value={code}>
            {languages[code].native}
          </option>
        ))}
      </select>
    </label>
  );
}
