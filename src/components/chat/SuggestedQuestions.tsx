import React from "react";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  language?: string;
  disabled?: boolean;
}

const QUESTIONS_BY_LANG: Record<string, Array<{ icon: string; text: string }>> = {
  hi: [
    { icon: "🍅", text: "मुझे टमाटर की फसल की तुड़ाई कब करनी चाहिए?" },
    { icon: "⚖️", text: "क्या मुझे फसल अभी बेचनी चाहिए या रुकना चाहिए?" },
    { icon: "💰", text: "मंडी में मुझे क्या भाव मिलने की उम्मीद है?" },
    { icon: "🌿", text: "फसल के स्वास्थ्य और पैदावार को कैसे सुधारें?" },
  ],
  mr: [
    { icon: "🍅", text: "टोमॅटो पिकाची काढणी कधी करावी?" },
    { icon: "⚖️", text: "मी आता विकावे की थांबावे?" },
    { icon: "💰", text: "बाजारात मला काय भाव मिळू शकतो?" },
    { icon: "🌿", text: "पिकाचे आरोग्य आणि प्रत कशी सुधारावी?" },
  ],
  te: [
    { icon: "🍅", text: "టమోటా పంటను ఎప్పుడు కోత కోయాలి?" },
    { icon: "⚖️", text: "నేను ఇప్పుడే అమ్మాలా లేక వేచి ఉండాలా?" },
    { icon: "💰", text: "నేను ఎలాంటి ధరను ఆశించవచ్చు?" },
    { icon: "🌿", text: "పంట ఆరోగ్యాన్ని ఎలా మెరుగుపరచాలి?" },
  ],
  ta: [
    { icon: "🍅", text: "தக்காளி அறுவடை செய்ய சிறந்த நேரம் எது?" },
    { icon: "⚖️", text: "இப்போது விற்க வேண்டுமா அல்லது காத்திருக்க வேண்டுமா?" },
    { icon: "💰", text: "நான் என்ன விலையை எதிர்பார்க்கலாம்?" },
    { icon: "🌿", text: "பயிர் ஆரோக்கியத்தை எவ்வாறு மேம்படுத்துவது?" },
  ],
  kn: [
    { icon: "🍅", text: "ಟೊಮೆಟೊ ಬೆಳೆಯನ್ನು ಯಾವಾಗ ಕೊಯ್ಲು ಮಾಡಬೇಕು?" },
    { icon: "⚖️", text: "ನಾನು ಈಗ ಮಾರಾಟ ಮಾಡಬೇಕೇ ಅಥವಾ ಕಾಯಬೇಕೇ?" },
    { icon: "💰", text: "ನಾನು ಯಾವ ಬೆಲೆಯನ್ನು ನಿರೀಕ್ಷಿಸಬಹುದು?" },
    { icon: "🌿", text: "ಬೆಳೆಯ ಆರೋಗ್ಯವನ್ನು ಹೇಗೆ ಸುಧಾರಿಸಬಹುದು?" },
  ],
  bn: [
    { icon: "🍅", text: "টমেটো ফসল কখন তোলা উচিত?" },
    { icon: "⚖️", text: "আমার কি এখনই বিক্রি করা উচিত নাকি অপেক্ষা করা উচিত?" },
    { icon: "💰", text: "আমি কী দাম পেতে পারি?" },
    { icon: "🌿", text: "ফসলের গুণমান কীভাবে উন্নত করা যায়?" },
  ],
  ml: [
    { icon: "🍅", text: "തക്കാളി വിളവെടുക്കാൻ അനുയോജ്യമായ സമയം എപ്പോഴാണ്?" },
    { icon: "⚖️", text: "ഇപ്പോൾ വിൽക്കണോ അതോ കാത്തിരിക്കണോ?" },
    { icon: "💰", text: "എനിക്ക് എന്ത് വില പ്രതീക്ഷിക്കാം?" },
    { icon: "🌿", text: "വിളവിൻ്റെ ആരോഗ്യം എങ്ങനെ മെച്ചപ്പെടുത്താം?" },
  ],
  en: [
    { icon: "🍅", text: "When should I harvest my tomato?" },
    { icon: "⚖️", text: "Should I sell now or wait?" },
    { icon: "💰", text: "What price can I expect?" },
    { icon: "🌿", text: "How can I improve crop health?" },
  ],
};

const TITLE_BY_LANG: Record<string, string> = {
  hi: "सुझाए गए प्रश्न",
  mr: "सुचवलेले प्रश्न",
  te: "సూచించిన ప్రశ్నలు",
  ta: "பரிந்துரைக்கப்பட்ட கேள்விகள்",
  kn: "ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು",
  bn: "প্রস্তাবিত প্রশ্নাবলী",
  ml: "നിർദ്ദേശിച്ച ചോദ്യങ്ങൾ",
  en: "Suggested Inquiries",
};

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelect,
  language = "en",
  disabled = false,
}) => {
  const list = QUESTIONS_BY_LANG[language] || QUESTIONS_BY_LANG.en;
  const title = TITLE_BY_LANG[language] || TITLE_BY_LANG.en;

  return (
    <div style={{ marginTop: 12, marginBottom: 14 }}>
      <p
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: "var(--ink-soft)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        💡 {title}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 8,
        }}
      >
        {list.map((item, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.text)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              fontSize: 12.5,
              fontWeight: 600,
              background: "var(--bg-warm)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              color: "var(--navy)",
              cursor: disabled ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = "var(--green-deep)";
                e.currentTarget.style.background = "#FFFFFF";
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = "var(--line)";
                e.currentTarget.style.background = "var(--bg-warm)";
              }
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
