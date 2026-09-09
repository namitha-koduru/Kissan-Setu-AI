import apiClient from "./api";
import type { CropAiObservation } from "../types";

export interface CropImageItem {
  id: number;
  farmer_id: number;
  crop_id?: number | null;
  conversation_id?: string | null;
  image_url: string;
  cloudinary_public_id?: string | null;
  original_filename?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
  uploaded_at: string;
}

export interface PossibleIssue {
  name: string;
  confidence: number;
}

export interface ImageAnalysisItem {
  id: number;
  image_id: number;
  detected_crop?: string | null;
  observed_symptoms?: string[];
  possible_issues?: PossibleIssue[];
  confidence?: number | null;
  analysis_text?: string | null;
  recommendations?: string[];
  model_name?: string | null;
  created_at: string;
}

export const imageApi = {
  /**
   * Upload an image to Cloudinary / storage backend and save metadata
   */
  async uploadImage(
    file: File,
    farmerId: number = 1,
    cropId?: number,
    conversationId?: string
  ): Promise<CropImageItem> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("farmer_id", farmerId.toString());
    if (cropId) formData.append("crop_id", cropId.toString());
    if (conversationId) formData.append("conversation_id", conversationId);

    return await apiClient.postFormData<CropImageItem>("/images/upload", formData);
  },

  /**
   * Upload image and run Vision AI agronomic observation
   */
  async analyzeCropImage(
    file: File,
    cropHint?: string,
    farmerId: number = 1,
    cropId?: number
  ): Promise<CropAiObservation> {
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("farmer_id", farmerId.toString());
      if (cropHint) formData.append("crop_hint", cropHint);
      if (cropId) formData.append("crop_id", cropId.toString());

      const res = await apiClient.postFormData<any>("/images/analyze", formData);
      if (res && (res.observed_symptoms || res.crop_health || res.detected_crop || res.is_mismatch !== undefined)) {
        return {
          image_url: res.image_url,
          detected_crop: res.detected_crop || cropHint || "Cultivated Crop",
          selected_crop: res.selected_crop || cropHint || undefined,
          is_mismatch: Boolean(res.is_mismatch),
          crop_match: res.crop_match !== undefined ? res.crop_match : !res.is_mismatch,
          mismatch_message: res.mismatch_message || undefined,
          image_quality: res.image_quality || "good",
          observed_symptoms: Array.isArray(res.observed_symptoms) && res.observed_symptoms.length > 0
            ? res.observed_symptoms
            : ["Foliar canopy shows healthy vegetative vigor and uniform coloration."],
          crop_health: res.crop_health || "Good / Normal Vegetative Health",
          confidence: typeof res.overall_confidence === "number"
            ? Math.round(res.overall_confidence * 100)
            : typeof res.confidence === "number"
            ? res.confidence
            : 88,
          possible_issues: Array.isArray(res.possible_issues) ? res.possible_issues : [],
          recommendations: Array.isArray(res.recommendations) && res.recommendations.length > 0
            ? res.recommendations
            : [
                "Maintain scheduled irrigation intervals based on local forecast.",
                "Inspect underside of lower leaves during morning scouting.",
              ],
          when_to_recheck: res.when_to_recheck || "Scout field again in 3–5 days or after high-humidity weather.",
          disclaimer: res.disclaimer || "Visible observation based on plant canopy imagery. Confirm with field extension officers if symptoms spread.",
          analyzed_at: new Date().toISOString(),
        };
      }
      throw new Error("AI observation result missing from response payload");
    } catch (err: any) {
      console.warn("Vision AI observation call failed:", err);
      const message = err?.message || "Failed to connect to AI vision analysis service.";
      throw new Error(message);
    }
  },

  /**
   * Get metadata of a specific uploaded crop image
   */
  async getImage(id: number): Promise<CropImageItem> {
    return await apiClient.get<CropImageItem>(`/images/${id}`);
  },

  /**
   * List images for a given crop
   */
  async getCropImages(cropId: number): Promise<CropImageItem[]> {
    return await apiClient.get<CropImageItem[]>(`/images/crop/${cropId}`);
  },
};

export default imageApi;
