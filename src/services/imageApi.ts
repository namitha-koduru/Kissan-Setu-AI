import apiClient from "./api";

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
