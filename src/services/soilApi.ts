/**
 * Soil API Service for KissanSetuAI Frontend
 * Connects to /api/soil endpoints for soil test data, NPK classification, and pH management.
 */

import apiClient from "./api";

export interface SoilProfile {
  id?: number;
  farmer_id?: number;
  soil_type?: string;
  ph?: number | null;
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
  organic_carbon?: number | null;
  moisture?: number | null;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SoilInterpretation {
  soil_condition: string;
  ph_status: string;
  nitrogen_status: string;
  phosphorus_status: string;
  potassium_status: string;
  organic_carbon_status: string;
  moisture_status: string;
  observations: string[];
  recommendations: string[];
  has_data: boolean;
  profile?: SoilProfile | null;
}

export interface SoilProfileInput {
  farmer_id?: number;
  soil_type?: string;
  ph?: number | null;
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
  organic_carbon?: number | null;
  moisture?: number | null;
  source?: string;
}

class SoilApi {
  async getInterpretation(farmerId: number = 1): Promise<SoilInterpretation> {
    return apiClient.get<SoilInterpretation>(`/soil?farmer_id=${farmerId}`);
  }

  async createOrUpdate(data: SoilProfileInput): Promise<SoilInterpretation> {
    return apiClient.post<SoilInterpretation>("/soil", data);
  }

  async update(farmerId: number = 1, data: Partial<SoilProfileInput>): Promise<SoilInterpretation> {
    return apiClient.put<SoilInterpretation>(`/soil?farmer_id=${farmerId}`, data);
  }
}

export const soilApi = new SoilApi();
export default soilApi;
