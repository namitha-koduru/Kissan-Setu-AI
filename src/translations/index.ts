import { en } from "./en";
import { hi } from "./hi";
import { te } from "./te";
import { mr } from "./mr";
import { ta } from "./ta";
import { kn } from "./kn";
import { bn } from "./bn";
import { ml } from "./ml";
import type { LanguageCode } from "../types";

export const translations: Record<LanguageCode, Record<string, string>> = {
  en,
  hi,
  te,
  mr,
  ta,
  kn,
  bn,
  ml,
};

export const languageMetadata: Record<
  LanguageCode,
  { name: string; native: string; flag?: string }
> = {
  en: { name: "English", native: "English" },
  hi: { name: "Hindi", native: "हिन्दी" },
  te: { name: "Telugu", native: "తెలుగు" },
  mr: { name: "Marathi", native: "मराठी" },
  ta: { name: "Tamil", native: "தமிழ்" },
  kn: { name: "Kannada", native: "ಕನ್ನಡ" },
  bn: { name: "Bengali", native: "বাংলা" },
  ml: { name: "Malayalam", native: "മലയാളം" },
};

export type TranslationKey = keyof typeof en;
