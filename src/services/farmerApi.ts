import apiClient from "./api";
import { demoUsers } from "../data/demo";
import type { User } from "../types";

export interface FarmerBackendModel {
  id: number;
  name: string;
  phone: string;
  email?: string;
  preferred_language?: string;
  state?: string;
  district?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export const farmerApi = {
  async getFarmer(id: number = 1): Promise<User> {
    try {
      const data = await apiClient.get<FarmerBackendModel>(`/farmers/${id}`);
      return {
        id: `farmer-${data.id}`,
        name: data.name,
        email: data.email || `${data.name.toLowerCase().replace(/\s+/g, ".")}@agrimail.in`,
        role: "farmer",
        location: data.district && data.state ? `${data.district}, ${data.state}` : data.district || data.state || "Farm Location",
        district: data.district || "",
        state: data.state || "",
        initials: data.name.split(" ").map((n) => n[0]).join(""),
        landAcreage: "9.7 Acres",
        mobile: data.phone,
      };
    } catch (error) {
      console.warn("[farmerApi] Backend unavailable, using demo profile fallback:", error);
      return demoUsers[0];
    }
  },

  async updateFarmer(id: number, data: Partial<FarmerBackendModel>): Promise<FarmerBackendModel> {
    return apiClient.put<FarmerBackendModel>(`/farmers/${id}`, data);
  },

  async createFarmer(data: Partial<FarmerBackendModel>): Promise<FarmerBackendModel> {
    return apiClient.post<FarmerBackendModel>("/farmers", data);
  },
};

export default farmerApi;
