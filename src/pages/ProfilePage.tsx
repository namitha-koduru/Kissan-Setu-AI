import { useState, useRef } from "react";
import { LogOut, Check, Camera, Upload, Trash2, Edit3, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useAppState } from "../context/AppStateContext";
import { imageApi } from "../services/imageApi";
import apiClient from "../services/api";
import type { LanguageCode } from "../types";

export function ProfilePage() {
  const { user, updateUserProfile, logout } = useAuth();
  const { lang, setLang, t, languages } = useLanguage();
  const { onboardData, showToast } = useAppState();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.mobile || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editDistrict, setEditDistrict] = useState(user?.district || "Nashik");
  const [editState, setEditState] = useState(user?.state || "Maharashtra");
  const [editVillage, setEditVillage] = useState(user?.village || onboardData.village || "");
  const [editLandAcreage, setEditLandAcreage] = useState(user?.landAcreage || onboardData.land || "2.5 Acres");
  const [editOrgName, setEditOrgName] = useState(user?.organizationName || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Notification Preferences
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [offerAlerts, setOfferAlerts] = useState(true);

  const handleLanguageChange = (code: LanguageCode) => {
    setLang(code);
    showToast(t("profile.success", "Language updated successfully!"));
  };

  // Profile Photo Upload Flow
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoError("Please select a JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setPhotoError("Image size exceeds 8MB limit. Please upload a smaller photo.");
      return;
    }

    setPhotoError(null);
    setUploadingPhoto(true);

    try {
      // 1. Upload to Cloudinary via backend image service
      const res = await imageApi.uploadImage(file, "profile");
      const photoUrl = res.url || res.image_url;

      if (!photoUrl) {
        throw new Error("No image URL returned from upload server.");
      }

      // 2. Persist to PostgreSQL database
      const numericId = 1;
      if (user?.role === "buyer") {
        await apiClient.put(`/buyers/${numericId}`, { profile_picture_url: photoUrl });
      } else {
        await apiClient.put(`/farmers/${numericId}`, { profile_picture_url: photoUrl });
      }

      // 3. Update Auth context state
      updateUserProfile({ profilePictureUrl: photoUrl });
      showToast("Profile picture updated and saved successfully!");
    } catch (err: any) {
      console.warn("Profile photo upload error:", err);
      setPhotoError(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true);
    try {
      const numericId = 1;
      if (user?.role === "buyer") {
        await apiClient.put(`/buyers/${numericId}`, { profile_picture_url: null });
      } else {
        await apiClient.put(`/farmers/${numericId}`, { profile_picture_url: null });
      }
      updateUserProfile({ profilePictureUrl: undefined });
      showToast("Profile picture removed.");
    } catch (err) {
      console.warn("Could not remove photo:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Edit Profile Submit Flow
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    const locationStr = `${editVillage ? `${editVillage}, ` : ""}${editDistrict}, ${editState}`;
    const updates = {
      name: editName.trim(),
      mobile: editPhone.trim(),
      email: editEmail.trim(),
      district: editDistrict.trim(),
      state: editState.trim(),
      village: editVillage.trim(),
      location: locationStr,
      landAcreage: editLandAcreage,
      organizationName: editOrgName.trim() || undefined,
    };

    try {
      const numericId = 1;
      if (user?.role === "buyer") {
        await apiClient.put(`/buyers/${numericId}`, {
          name: updates.name,
          phone: updates.mobile,
          email: updates.email,
          location: updates.location,
          organization: updates.organizationName,
        });
      } else {
        await apiClient.put(`/farmers/${numericId}`, {
          name: updates.name,
          phone: updates.mobile,
          email: updates.email,
          state: updates.state,
          district: updates.district,
          village: updates.village,
          organization_name: updates.organizationName,
        });
      }

      updateUserProfile(updates);
      showToast("Profile details updated and saved to PostgreSQL.");
      setEditModalOpen(false);
    } catch (err: any) {
      console.warn("Failed to update profile:", err);
      showToast("Failed to save changes to database. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="wrap" style={{ maxWidth: 740, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>{t("profile.title", "Profile & Farm Settings")}</h1>
          <p className="page-subtitle">
            {t("profile.subtitle", "Manage your account, profile photo, farm details, language, and notification preferences.")}
          </p>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="card card-pad mb-lg" style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Real Profile Picture with Hover Upload Overlay */}
            <div style={{ position: "relative" }}>
              {user?.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={user?.name || "Profile"}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid var(--green-deep)",
                  }}
                />
              ) : (
                <div
                  className="avatar"
                  style={{
                    width: 72,
                    height: 72,
                    fontSize: "24px",
                    fontWeight: 800,
                    background: "var(--green-leaf)",
                    color: "#fff",
                  }}
                >
                  {user?.initials || user?.name?.slice(0, 2).toUpperCase() || "KS"}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                style={{ display: "none" }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Change Profile Photo"
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--green-deep)",
                  color: "#FFFFFF",
                  border: "2px solid #FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                {uploadingPhoto ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>

            <div>
              <div className="flex flex-center gap-xs">
                <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{user?.name || "Ramesh Patil"}</h2>
                <ShieldCheck size={18} color="var(--green-deep)" />
              </div>
              <p style={{ color: "var(--ink-soft)", fontSize: "13.5px", margin: "3px 0 0" }}>
                {t("nav.accountRole", "Role")}: <strong>{user?.role?.toUpperCase() || "FARMER"}</strong> · {user?.location || (user?.district ? `${user.district}, ${user.state}` : "India")}
              </p>
              {user?.organizationName && (
                <div style={{ fontSize: "12px", color: "var(--navy)", fontWeight: 700, marginTop: 2 }}>
                  🏛 {user.organizationName}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-xs">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setEditName(user?.name || "");
                setEditPhone(user?.mobile || "");
                setEditEmail(user?.email || "");
                setEditDistrict(user?.district || "Nashik");
                setEditState(user?.state || "Maharashtra");
                setEditVillage(user?.village || onboardData.village || "");
                setEditLandAcreage(user?.landAcreage || onboardData.land || "2.5 Acres");
                setEditOrgName(user?.organizationName || "");
                setEditModalOpen(true);
              }}
            >
              <Edit3 size={14} /> Edit Profile
            </button>
            {user?.profilePictureUrl && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleRemovePhoto}
                style={{ color: "var(--danger)" }}
                title="Remove profile picture"
              >
                <Trash2 size={14} /> Remove Photo
              </button>
            )}
          </div>
        </div>

        {photoError && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: "#FEE2E2",
              color: "#991B1B",
              fontSize: "12.5px",
              marginBottom: 12,
            }}
          >
            ⚠️ {photoError}
          </div>
        )}

        <div className="pf-row">
          <span className="l">Phone Number</span>
          <span className="v">{user?.mobile || "98765 43210"}</span>
        </div>
        <div className="pf-row">
          <span className="l">Email Address</span>
          <span className="v">{user?.email || "farmer@kisansetu.in"}</span>
        </div>
        <div className="pf-row">
          <span className="l">{t("onboarding.village", "Farm Parcel Location")}</span>
          <span className="v">{user?.village || onboardData.village || "Dindori"}, {user?.district || onboardData.district || "Nashik"}, {user?.state || onboardData.state || "Maharashtra"}</span>
        </div>
        <div className="pf-row">
          <span className="l">{t("onboarding.landAcreage", "Land Under Cultivation")}</span>
          <span className="v">{user?.landAcreage || onboardData.land || "2.5 Acres"}</span>
        </div>
      </div>

      {/* Crops & Preferred Markets */}
      <div className="card card-pad mb-lg" style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          {t("crops.title", "Crops & Tracked Markets")}
        </h3>
        <div className="pf-row">
          <span className="l">{t("onboarding.primaryCrops", "Cultivated Crops")}</span>
          <span className="v">
            {user?.cropAllocations && user.cropAllocations.length > 0
              ? user.cropAllocations.map((a) => `${a.crop} (${a.area} ${a.unit})`).join(", ")
              : onboardData.crops.length > 0
              ? onboardData.crops.join(", ")
              : "Cotton (1.5 Acres), Tomato (1.0 Acre)"}
          </span>
        </div>
        <div className="pf-row">
          <span className="l">{t("market.nearbyMandis", "Tracked Mandi Hubs")}</span>
          <span className="v">{onboardData.markets.length > 0 ? onboardData.markets.join(", ") : `${user?.district || "Nashik"} APMC Central Mandi`}</span>
        </div>
      </div>

      {/* Language Selection Grid */}
      <div className="card card-pad mb-lg" style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          {t("profile.languagePref", "Application Language Preference")}
        </h3>
        <div className="lang-grid">
          {(Object.keys(languages) as LanguageCode[]).map((code) => {
            const isSelected = lang === code;
            return (
              <div
                key={code}
                className={`lang-opt ${isSelected ? "selected" : ""}`}
                onClick={() => handleLanguageChange(code)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{languages[code].native} ({languages[code].name})</span>
                  {isSelected && <Check size={16} color="#176B45" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card card-pad mb-xl" style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: 14 }}>
          {t("nav.notifications", "Notification & Alert Preferences")}
        </h3>
        <div className="pf-row">
          <span className="l">{t("market.title", "Real-time Mandi Price Surge Alerts")}</span>
          <button
            type="button"
            className={`btn btn-sm ${priceAlerts ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPriceAlerts(!priceAlerts)}
          >
            {priceAlerts ? "Enabled" : "Disabled"}
          </button>
        </div>
        <div className="pf-row">
          <span className="l">{t("weather.title", "Severe Weather Risk Warnings")}</span>
          <button
            type="button"
            className={`btn btn-sm ${weatherAlerts ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setWeatherAlerts(!weatherAlerts)}
          >
            {weatherAlerts ? "Enabled" : "Disabled"}
          </button>
        </div>
        <div className="pf-row">
          <span className="l">{t("offers.title", "Instant Direct Buyer Procurement Offers")}</span>
          <button
            type="button"
            className={`btn btn-sm ${offerAlerts ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setOfferAlerts(!offerAlerts)}
          >
            {offerAlerts ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      <button
        className="btn btn-secondary btn-block"
        type="button"
        onClick={logout}
        style={{ color: "var(--danger)", borderColor: "#F5C6C2", marginBottom: 30 }}
      >
        <LogOut size={16} /> {t("nav.signOut", "Sign Out of Session")}
      </button>

      {/* EDIT PROFILE MODAL */}
      {editModalOpen && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 520, borderRadius: 16, padding: 24, background: "#FFFFFF" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-between flex-center mb-md">
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Edit Account Profile</h3>
              <button type="button" className="icon-btn" onClick={() => setEditModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex-col gap-sm">
              <div className="field">
                <label>Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    className="form-control"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/[^\d+]/g, ""))}
                    required
                  />
                </div>
                <div className="field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
              </div>

              {user?.role === "fpo" || user?.role === "buyer" ? (
                <div className="field">
                  <label>Organization / Collective Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editOrgName}
                    onChange={(e) => setEditOrgName(e.target.value)}
                  />
                </div>
              ) : null}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>District / Mandi Hub</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>Village / Locality</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editVillage}
                    onChange={(e) => setEditVillage(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Cultivated Land Area</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editLandAcreage}
                    onChange={(e) => setEditLandAcreage(e.target.value)}
                    placeholder="e.g. 3.0 Acres"
                  />
                </div>
              </div>

              <div className="flex gap-sm" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving to PostgreSQL..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
