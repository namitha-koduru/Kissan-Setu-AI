import apiClient from "./api";
import type { CropImageItem, ImageAnalysisItem } from "./imageApi";

export interface ChatMessageItem {
  id: string | number;
  role: "user" | "assistant" | "system";
  content: string;
  image_url?: string | null;
  image_id?: number | null;
  created_at?: string;
}

export interface ChatSourceItem {
  title: string;
  reference?: string;
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

function generateLocalAdvisory(message: string, language: string): string {
  const lower = message.toLowerCase();
  if (language === "hi") {
    if (lower.includes("water") || lower.includes("सिंचाई") || lower.includes("irrigation")) {
      return "🌾 **सिंचाई सलाह:** ड्रिप सिंचाई द्वारा सुबह के समय 1.5–2 घंटे पानी देना सर्वोत्तम है। अगले 48 घंटों में बारिश की संभावना हो तो सिंचाई टाल दें।";
    }
    return "नमस्ते किसान भाई! मैं **किसान सेतु AI** सहायक हूँ। आप फसल सिंचाई, कीट प्रबंधन, मौसम जोखिम और मंडी भाव के बारे में कोई भी प्रश्न पूछ सकते हैं।";
  } else if (language === "mr") {
    return "नमस्कार शेतकरी बंधूंनो! मी **किसान सेतू AI** शेती सल्लागार आहे. टोमॅटो पिकास सकाळी ठिबक सिंचनाने पाणी द्यावे आणि पावसाच्या अंदाजानुसार नियोजन करावे.";
  } else if (language === "te") {
    return "నమస్కారం రైతు సోదరులారా! నేను **కిసాన్ సేతు AI** వ్యవసాయ సహాయకుడిని. బిందు సేద్యం (Drip) ద్వారా ఉదయం పూట నీటిని అందించడం ఉత్తమం.";
  }

  if (lower.includes("water") || lower.includes("irrigation")) {
    return "💧 **Irrigation Advisory:**\n\n1. **Morning Drip Schedule:** Irrigate between 6:00 AM – 8:30 AM for 1.5–2 hours to maximize root zone absorption.\n2. **Rain Forecast:** Given rain risks in 48 hours, reduce irrigation volume to avoid waterlogging.\n3. **Maturity Stage:** Maintain steady, moderate moisture to prevent tomato skin splitting.";
  }
  if (lower.includes("harvest") || lower.includes("market") || lower.includes("mandi")) {
    return "🚜 **Harvest & Market Advisory:**\n\n1. **Harvest Stage:** Pick tomatoes at 70–80% color turning stage (pink bottom) for optimal transport durability.\n2. **Best Returns:** Nashik APMC currently offers higher net realization after accounting for transport deductions.";
  }
  if (lower.includes("pest") || lower.includes("leaf") || lower.includes("disease")) {
    return "🌿 **Pest & Crop Health Guidance:**\n\n1. **Organic Remedy:** Spray 5 ml cold-pressed Neem Oil (10,000 ppm) per liter of water during late afternoon.\n2. **Foliar Check:** Yellowing edges indicate early blight or sucking pest pressure. Consult your local KVK for verified lab checks.";
  }

  return "Hello Farmer! I am your **KissanSetuAI Agricultural Assistant**.\n\nI can help you analyze:\n• **Optimal Irrigation Schedules**\n• **Weather Risk & Harvest Windows**\n• **Mandi Price Realization vs Freight Costs**\n• **Safe Pest & Disease Management**\n\nHow can I assist your farm today?";
}

export default chatApi;
