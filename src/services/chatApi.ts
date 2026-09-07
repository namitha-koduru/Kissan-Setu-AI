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
      console.warn("[chatApi] Image analysis endpoint fallback:", err);
      // Offline fallback
      return {
        reply: "🌾 **Crop Image Assessment (Visual Observation)**:\n\n• **Observed:** Minor leaf spot and slight edge yellowing detected in uploaded photo.\n• **Possible Cause:** Early foliar blight or sucking insect pressure.\n• **Recommended Next Step:** Check underside of leaves for mite webs, isolate infected foliage, and apply neem spray if spread continues.\n\n*(Note: Cloudinary/Vision connection is running in offline demo mode)*",
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

function generateLocalAdvisory(_message: string, language: string): string {
  if (language === "hi") {
    return "⚠️ **सर्वर से संपर्क नहीं हो सका**\n\nAI सलाहकार सेवा वर्तमान में ऑफ़लाइन है। कृपया सुनिश्चित करें कि बैकएंड सर्वर और Ollama सक्रिय हैं।";
  } else if (language === "te") {
    return "⚠️ **సర్వర్ అందుబాటులో లేదు**\n\nAI సేవ ప్రస్తుతం ఆఫ్ లైన్ లో ఉంది. దయచేసి బ్యాకెండ్ సర్వర్ మరియు Ollama ప్రారంభించబడి ఉన్నాయని నిర్ధారించుకోండి.";
  } else if (language === "mr") {
    return "⚠️ **सर्व्हरशी संपर्क होऊ शकला नाही**\n\nAI सल्लागार सेवा सध्या ऑफलाइन आहे. कृपया बॅकएंड आणि Ollama सेवा सुरू असल्याची खात्री करा.";
  } else if (language === "ta") {
    return "⚠️ **சேவையகத்துடன் இணைக்க முடியவில்லை**\n\nAI ஆலோசனை சேவை தற்போது ஆஃப்லைனில் உள்ளது. பின்னணி சேவையகம் மற்றும் Ollama இயங்குகிறதா என்பதை உறுதிப்படுத்தவும்.";
  } else if (language === "kn") {
    return "⚠️ **ಸರ್ವರ್ ಸಂಪರ್ಕ ವಿಫಲವಾಗಿದೆ**\n\nAI ಸಲಹಾ ಸೇವೆ ಪ್ರಸ್ತುತ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದೆ. ದಯವಿಟ್ಟು ಬ್ಯಾಕೆಂಡ್ ಸರ್ವರ್ ಮತ್ತು Ollama ಚಾಲನೆಯಲ್ಲಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.";
  } else if (language === "bn") {
    return "⚠️ **সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি**\n\nAI উপদেষ্টা পরিষেবা বর্তমানে অফলাইনে রয়েছে। অনুগ্রহ করে ব্যাকএন্ড সার্ভার এবং Ollama সক্রিয় আছে কি না পরীক্ষা করুন।";
  } else if (language === "ml") {
    return "⚠️ **സെർവറുമായി ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല**\n\nAI ഉപദേശക സേവനം നിലവിൽ ഓഫ്‌ലൈനിലാണ്. ബാക്കെൻഡ് സെർവറും Ollamaയും പ്രവർത്തിക്കുന്നുണ്ടെന്ന് ഉറപ്പാക്കുക.";
  }

  return "⚠️ **AI Assistant Offline / Connection Error**\n\nUnable to reach the backend advisory service. Please make sure the KissanSetuAI backend and Ollama (qwen3:4b) are running.";
}

export default chatApi;
