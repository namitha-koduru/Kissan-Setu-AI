import React from "react";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  language?: string;
  disabled?: boolean;
}

const QUESTIONS_BY_LANG: Record<string, Array<{ icon: string; text: string }>> = {
  hi: [
    { icon: "🍅", text: "टमाटर की फसल की तुड़ाई कब करनी चाहिए?" },
    { icon: "🌧️", text: "क्या आगामी बारिश से मेरी फसल को नुकसान होगा?" },
    { icon: "💧", text: "टमाटर में ड्रिप सिंचाई कितने घंटे करनी चाहिए?" },
    { icon: "🌿", text: "पत्तियों पर कीट या धब्बे दिखने पर क्या जैविक उपचार करें?" },
    { icon: "🏪", text: "नासिक और लासलगांव में से किस मंडी में बेहतर भाव मिलेगा?" },
  ],
  mr: [
    { icon: "🍅", text: "टोमॅटो पिकाची काढणी कधी करावी?" },
    { icon: "🌧️", text: "पुढील दोन दिवसांतील पावसाचा पिकावर काय परिणाम होईल?" },
    { icon: "💧", text: "ठिबक सिंचनाने पाणी देण्याचे योग्य नियोजन काय आहे?" },
    { icon: "🌿", text: "पानांवर कीड किंवा पिवळे डाग पडल्यास काय करावे?" },
    { icon: "🏪", text: "कोणत्या जवळच्या बाजार समितीत (APMC) जास्त नफा मिळेल?" },
  ],
  te: [
    { icon: "🍅", text: "టమోటా పంటను ఎప్పుడు కోత కోయాలి?" },
    { icon: "🌧️", text: "వర్షం వల్ల నా పంటకు ఏదైనా నష్టం జరుగుతుందా?" },
    { icon: "💧", text: "డ్రిప్ ద్వారా నీటిని ఎన్ని గంటలు అందించాలి?" },
    { icon: "🌿", text: "ఆకులపై తెగుళ్లు కనిపిస్తే ఏ మందులు వాడాలి?" },
    { icon: "🏪", text: "ఏ మార్కెట్‌లో మంచి గిట్టుబాటు ధర లభిస్తుంది?" },
  ],
  en: [
    { icon: "🍅", text: "When should I harvest my tomato crop?" },
    { icon: "🌧️", text: "Will upcoming rain affect my near-maturity crop?" },
    { icon: "💧", text: "How often should I irrigate with drip system?" },
    { icon: "🌿", text: "What should I do if I see pests or yellow spots on leaves?" },
    { icon: "🏪", text: "Which nearby APMC mandi offers the best net realization?" },
  ],
};

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelect,
  language = "en",
  disabled = false,
}) => {
  const list = QUESTIONS_BY_LANG[language] || QUESTIONS_BY_LANG.en;

  return (
    <div style={{ marginTop: "12px", marginBottom: "16px" }}>
      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-soft)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        💡 {language === "hi" ? "सुझाए गए प्रश्न" : language === "mr" ? "सुचवलेले प्रश्न" : language === "te" ? "సూచించిన ప్రశ్నలు" : "Suggested Inquiries"}
      </p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {list.map((item, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.text)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              fontSize: "13px",
              background: "var(--white)",
              border: "1px solid var(--line-strong)",
              borderRadius: "16px",
              color: "var(--ink)",
              cursor: disabled ? "not-allowed" : "pointer",
              boxShadow: "var(--shadow-1)",
              transition: "all 0.15s ease",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = "var(--green-deep)";
                e.currentTarget.style.background = "var(--green-light)";
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = "var(--line-strong)";
                e.currentTarget.style.background = "var(--white)";
              }
            }}
          >
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
