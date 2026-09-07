import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { LanguageCode } from "../types";
import { translations, languageMetadata } from "../translations";

interface LanguageContextValue {
  lang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  t: (key: string, defaultText?: string) => string;
  languages: typeof languageMetadata;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "kissansetu_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && saved in translations) {
        return saved;
      }
    } catch {
      // localStorage may be unavailable
    }
    return "en";
  });

  const setLang = (code: LanguageCode) => {
    if (code in translations) {
      setLangState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // ignore storage errors
      }
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: string, defaultText?: string): string => {
        const langDict = translations[lang];
        if (langDict && key in langDict) {
          return langDict[key];
        }
        const enDict = translations.en;
        if (enDict && key in enDict) {
          return enDict[key];
        }
        return defaultText || key;
      },
      languages: languageMetadata,
    }),
    [lang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export default LanguageContext;
