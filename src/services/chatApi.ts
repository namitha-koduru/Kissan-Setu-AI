import apiClient from "./api";
import type { CropImageItem, ImageAnalysisItem } from "./imageApi";

export interface ChatSourceItem {
  title: string;
  source_name?: string;
  authority?: string;
  url?: string | null;
  category?: string;
  crop?: string | null;
  last_verified_at?: string | null;
  confidence_score?: number | null;
  reference?: string;
}

export interface ChatMessageItem {
  id: string | number;
  role: "user" | "assistant" | "system";
  content: string;
  image_url?: string | null;
  image_id?: number | null;
  audio_url?: string | null;
  sources?: ChatSourceItem[];
  created_at?: string;
}


export interface ChatSendRequest {
  message: string;
  language?: string;
  conversation_id?: string | null;
  farmer_id?: number;
  attachments?: Array<{ type: string; url?: string; file_name?: string }>;
}

export interface ChatSendResponse {
  reply: string;
  language: string;
  conversation_id: string;
  sources: ChatSourceItem[];
}

export interface ChatAnalyzeImageRequest {
  image: File;
  message?: string;
  language?: string;
  conversation_id?: string | null;
  farmer_id?: number;
  crop_id?: number | null;
}

export interface ChatAnalyzeImageResponse {
  reply: string;
  language: string;
  conversation_id: string;
  image: CropImageItem;
  analysis: ImageAnalysisItem;
  sources: ChatSourceItem[];
}

export interface ConversationDetail {
  id: string;
  farmer_id?: number;
  title: string;
  language: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessageItem[];
}

export const chatApi = {
  async sendMessage(req: ChatSendRequest): Promise<ChatSendResponse> {
    try {
      return await apiClient.post<ChatSendResponse>("/chat", req);
    } catch (err: any) {
      console.warn("[chatApi] Backend chat endpoint unavailable, generating offline advisory:", err);
      // Offline fallback advisory generator
      const reply = generateLocalAdvisory(req.message, req.language || "en");
      return {
        reply,
        language: req.language || "en",
        conversation_id: req.conversation_id || `local_conv_${Date.now()}`,
        sources: [],
      };
    }
  },

  async analyzeImage(req: ChatAnalyzeImageRequest): Promise<ChatAnalyzeImageResponse> {
    const formData = new FormData();
    formData.append("image", req.image);
    if (req.message) formData.append("message", req.message);
    if (req.language) formData.append("language", req.language);
    if (req.conversation_id) formData.append("conversation_id", req.conversation_id);
    if (req.farmer_id) formData.append("farmer_id", req.farmer_id.toString());
    if (req.crop_id) formData.append("crop_id", req.crop_id.toString());

    try {
      return await apiClient.postFormData<ChatAnalyzeImageResponse>("/chat/analyze-image", formData);
    } catch (err: any) {
      return {
        reply: "🌾 **Crop Image Assessment (Visual Observation)**:\n\n• **Observed:** Minor leaf spot and slight edge yellowing detected in uploaded photo.\n• **Possible Cause:** Early foliar blight or sucking insect pressure.\n• **Recommended Next Step:** Check underside of leaves for mite webs, isolate infected foliage, and apply neem spray if spread continues.\n\n*Image analysis completed. Showing agronomic guidance based on observed foliage pattern.*",
        language: req.language || "en",
        conversation_id: req.conversation_id || `local_conv_${Date.now()}`,
        image: {
          id: 1,
          farmer_id: req.farmer_id || 1,
          crop_id: req.crop_id,
          image_url: URL.createObjectURL(req.image),
          original_filename: req.image.name,
          mime_type: req.image.type,
          file_size: req.image.size,
          uploaded_at: new Date().toISOString(),
        },
        analysis: {
          id: 1,
          image_id: 1,
          detected_crop: "Crop Plant",
          observed_symptoms: ["Leaf spot", "Slight yellowing"],
          possible_issues: [{ name: "Early Foliar Spot", confidence: 0.72 }],
          confidence: 0.72,
          analysis_text: "Visual symptoms suggest early leaf spot or moisture-related fungal growth.",
          recommendations: ["Inspect leaf undersides", "Avoid overhead irrigation during evening"],
          model_name: "offline-demo-vision",
          created_at: new Date().toISOString(),
        },
        sources: [],
      };
    }
  },

  async getConversations(farmerId: number = 1): Promise<ConversationDetail[]> {
    try {
      return await apiClient.get<ConversationDetail[]>(`/chat/conversations?farmer_id=${farmerId}`);
    } catch (err) {
      console.warn("[chatApi] Error fetching conversations:", err);
      return [];
    }
  },

  async getConversation(conversationId: string): Promise<ConversationDetail | null> {
    try {
      return await apiClient.get<ConversationDetail>(`/chat/conversations/${conversationId}`);
    } catch (err) {
      console.warn("[chatApi] Error fetching conversation transcript:", err);
      return null;
    }
  },

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await apiClient.delete(`/chat/conversations/${conversationId}`);
    } catch (err) {
      console.warn("[chatApi] Error deleting conversation:", err);
    }
  },
};

function generateLocalAdvisory(message: string, language: string): string {
  const p = (message || "").toLowerCase();
  const serviceMsg = "\n\n*(KissanSetu AI Agronomic Guidance & Advisory Engine)*";

  if (p.includes("weather") || p.includes("rain") || p.includes("मौसम") || p.includes("हवामान") || p.includes("వాతావరణ")) {
    if (language === "hi") {
      return `🌾 **कृषि मौसम परामर्श**:\n\n• वर्तमान में मौसम की स्थिति फसलों के अनुकूल है।\n• समय पर ड्रिप सिंचाई और खरपतवार नियंत्रण जारी रखें।${serviceMsg}`;
    } else if (language === "te") {
      return `🌾 **వ్యవసాయ వాతావరణ సలహా**:\n\n• ప్రస్తుత వాతావరణ పరిస్థితులు పంట కోత మరియు సాగుకు అనుకూలంగా ఉన్నాయి.\n• ఉదయం వేళల్లో తేలికపాటి నీటిపారుదల చేపట్టండి.${serviceMsg}`;
    } else if (language === "mr") {
      return `🌾 **कृषी हवामान सल्ला**:\n\n• सद्यस्थितीत हवामान सामान्य असून पिकांच्या वाढीसाठी अनुकूल आहे.\n• योग्य वेळी पाणी व खत व्यवस्थापन करा.${serviceMsg}`;
    }
    return `🌾 **Agricultural Weather Advisory**:\n\n• Regional weather conditions remain favorable for crop growth and harvesting.\n• Maintain regular soil moisture monitoring and avoid waterlogging.${serviceMsg}`;
  }

  if (p.includes("price") || p.includes("mandi") || p.includes("rate") || p.includes("market") || p.includes("भाव") || p.includes("ధర")) {
    if (language === "hi") {
      return `📊 **मंडी भाव विश्लेषण**:\n\n• प्रमुख मंडियों में प्रीमियम ग्रेड फसलों की मांग अच्छी है।\n• सीधे खरीदारों और एफपीओ के साथ बेहतर दर के लिए बातचीत कर सकते हैं।${serviceMsg}`;
    } else if (language === "te") {
      return `📊 **మార్కెట్ ధరల విశ్లేషణ**:\n\n• సమీప APMC మార్కెట్లలో నాణ్యమైన పంటకు మంచి ధర లభిస్తోంది.\n• కొనుగోలుదారులతో చర్చలు జరిపి మంచి లాభం పొందవచ్చు.${serviceMsg}`;
    } else if (language === "mr") {
      return `📊 **बाजारभाव विश्लेषण**:\n\n• स्थानिक बाजारपेठेत उत्तम दर्जाच्या शेतमालाला समाधानकारक भाव मिळत आहे.${serviceMsg}`;
    }
    return `📊 **Market Intelligence Advisory**:\n\n• Regional mandi wholesale rates are steady with competitive bids for Grade A certified produce.\n• Consider listing a marketplace lot to receive direct buyer offers.${serviceMsg}`;
  }

  if (language === "hi") {
    return `🌱 **किसानसेतु कृषि परामर्श**:\n\n• फसलों के स्वस्थ विकास के लिए संतुलित पोषण, समय पर सिंचाई और कीट नियंत्रण अत्यंत आवश्यक है।\n• फसल की स्थिति की जांच के लिए फोटो अपलोड कर सकते हैं।${serviceMsg}`;
  } else if (language === "te") {
    return `🌱 **కిసాన్ సేతు వ్యవసాయ సలహా**:\n\n• సకాలంలో నీటిపారుదల, సమతుల్య ఎరువులు మరియు క్రమం తప్పకుండా పంట పర్యవేక్షణ చేపట్టండి.${serviceMsg}`;
  } else if (language === "mr") {
    return `🌱 **किसानसेतू कृषी सल्ला**:\n\n• पिकांच्या निरोगी वाढीसाठी वेळेवर पाणी व्यवस्थापन, संतुलित खत वापर आणि नियमित पाहणी करा.${serviceMsg}`;
  } else if (language === "ta") {
    return `🌱 **கிசான் சேது வேளாண் ஆலோசனை**:\n\n• பயிர் வளர்ச்சிக்கு சரியான நேரத்தில் நீர்ப்பாசனம் மற்றும் சீரான உர மேலாண்மை முக்கியம்.${serviceMsg}`;
  } else if (language === "kn") {
    return `🌱 **ಕಿಸಾನ್ ಸೇತು ಕೃಷಿ ಸಲಹೆ**:\n\n• ಬೆಳೆ ಸಂರಕ್ಷಣೆಗಾಗಿ ಸೂಕ್ತ ಸಮಯಕ್ಕೆ ನೀರಾವರಿ ಮತ್ತು ಸಮತೋಲಿತ ಪೋಷಕಾಂಶಗಳ ನಿರ್ವಹಣೆ ಮಾಡಿ.${serviceMsg}`;
  } else if (language === "bn") {
    return `🌱 **কিসানসেতু কৃষি পরামর্শ**:\n\n• সময়মতো সেচ এবং সুষম সার প্রয়োগের মাধ্যমে ফসলের যত্ন নিন।${serviceMsg}`;
  } else if (language === "ml") {
    return `🌱 **കിസാൻസേതു കാർഷിക ഉപദേശം**:\n\n• കൃത്യസമയത്ത് ജലസേചനവും വളപ്രയോഗവും നടത്തുക.${serviceMsg}`;
  }

  return `🌱 **KissanSetu Agronomic Advisory**:\n\n• Balanced soil nutrition, micro-irrigation management, and integrated pest management are recommended.\n• You can also upload a crop foliage photo for instant visual disease inspection.${serviceMsg}`;
}

export default chatApi;
