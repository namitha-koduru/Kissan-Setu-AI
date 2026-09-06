import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { LanguageCode } from "../types";

const labels: Record<LanguageCode, { name: string; native: string }> = {
  en: { name: "English", native: "English" },
  hi: { name: "Hindi", native: "हिन्दी" },
  mr: { name: "Marathi", native: "मराठी" },
  te: { name: "Telugu", native: "తెలుగు" },
};

const phrases: Record<LanguageCode, Record<string, string>> = {
  en: {
    getStarted: "Get Started",
    seeHow: "See How It Works",
    dashboard: "Dashboard",
    myCrops: "My Crops",
    market: "Market",
    buyers: "Buyers",
    recommendations: "Recommendations",
    offers: "Offers",
    tagline: "From knowing the market price to knowing the best action.",
    sellNow: "SELL NOW",
    wait: "WAIT",
    switch: "SWITCH",
    demo: "Demo data",
  },
  hi: {
    getStarted: "शुरू करें",
    seeHow: "कैसे काम करता है",
    dashboard: "डैशबोर्ड",
    myCrops: "मेरी फसल",
    market: "बाज़ार",
    buyers: "खरीदार",
    recommendations: "सलाह",
    offers: "ऑफ़र",
    tagline: "केवल भाव जानना नहीं — सही फ़ैसला जानना।",
    sellNow: "अभी बेचें",
    wait: "प्रतीक्षा",
    switch: "बाज़ार बदलें",
    demo: "डेमो डेटा",
  },
  mr: {
    getStarted: "सुरु करा",
    seeHow: "कसे काम करते",
    dashboard: "डॅशबोर्ड",
    myCrops: "माझी पिके",
    market: "बाजार",
    buyers: "खरेदीदार",
    recommendations: "सल्ला",
    offers: "ऑफर",
    tagline: "फक्त भाव नव्हे — योग्य निर्णय.",
    sellNow: "आता विका",
    wait: "थांबा",
    switch: "बाजार बदला",
    demo: "डेमो डेटा",
  },
  te: {
    getStarted: "ప్రారంభించండి",
    seeHow: "ఎలా పనిచేస్తుంది",
    dashboard: "డాష్‌బోర్డ్",
    myCrops: "నా పంటలు",
    market: "మార్కెట్",
    buyers: "కొనుగోలుదారులు",
    recommendations: "సలహా",
    offers: "ఆఫర్లు",
    tagline: "ధర తెలుసుకోవడం నుంచి సరైన నిర్ణయం వరకు.",
    sellNow: "ఇప్పుడు అమ్మండి",
    wait: "వేచి ఉండండి",
    switch: "మార్కెట్ మార్చండి",
    demo: "డెమో డేటా",
  },
};

interface LanguageContextValue {
  lang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  t: (key: string) => string;
  languages: typeof labels;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>("en");
  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: string) => phrases[lang][key] ?? phrases.en[key] ?? key,
      languages: labels,
    }),
    [lang],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
