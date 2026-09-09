import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppStateProvider } from "./context/AppStateContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AppLayout } from "./layouts/AppLayout";
import { ToastContainer } from "./components/Toast";
import { RoleGate } from "./components/RoleGate";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CropsPage } from "./pages/CropsPage";
import { AddCropPage } from "./pages/AddCropPage";
import { CropDetailsPage } from "./pages/CropDetailsPage";
import { RecommendationPage } from "./pages/RecommendationPage";
import { MarketPage } from "./pages/MarketPage";
import { BuyersPage } from "./pages/BuyersPage";
import { BuyerDetailPage } from "./pages/BuyerDetailPage";
import { LotsPage } from "./pages/LotsPage";
import { CreateLotPage } from "./pages/CreateLotPage";
import { OffersPage } from "./pages/OffersPage";
import { TransactionPage } from "./pages/TransactionPage";
import { WeatherPage } from "./pages/WeatherPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { FPOPage } from "./pages/FPOPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { ChatPage } from "./pages/ChatPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function AdminGate() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <AdminPage />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppStateProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Authenticated App Shell */}
              <Route element={<AppLayout />}>
                {/* Farmer Core Production Routes */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/crops"
                  element={
                    <RoleGate
                      allowedRoles={["farmer", "fpo"]}
                      fallbackPath="/buyers"
                      blockedMessage="Crop management is available to Farmers and FPOs."
                    >
                      <CropsPage />
                    </RoleGate>
                  }
                />
                <Route path="/farmer" element={<Navigate to="/crops" replace />} />
                <Route
                  path="/crops/add"
                  element={
                    <RoleGate
                      allowedRoles={["farmer", "fpo"]}
                      fallbackPath="/buyers"
                      blockedMessage="Crop registration is available to Farmers and FPOs."
                    >
                      <AddCropPage />
                    </RoleGate>
                  }
                />
                <Route
                  path="/crops/:id"
                  element={
                    <RoleGate
                      allowedRoles={["farmer", "fpo"]}
                      fallbackPath="/buyers"
                      blockedMessage="Crop details are available to Farmers and FPOs."
                    >
                      <CropDetailsPage />
                    </RoleGate>
                  }
                />
                <Route path="/recommendation" element={<RecommendationPage />} />
                <Route path="/weather" element={<WeatherPage />} />
                <Route path="/chat" element={<ChatPage />} />

                {/* Marketplace & Lot Routes */}
                <Route path="/market" element={<MarketPage />} />
                <Route path="/markets" element={<Navigate to="/market" replace />} />
                <Route path="/lots" element={<LotsPage />} />
                <Route path="/available-lots" element={<Navigate to="/lots" replace />} />
                <Route
                  path="/lots/create"
                  element={
                    <RoleGate
                      allowedRoles={["farmer", "fpo"]}
                      fallbackPath="/buyers"
                      blockedMessage="Lot creation is available to Farmers and FPOs."
                    >
                      <CreateLotPage />
                    </RoleGate>
                  }
                />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/transactions" element={<TransactionPage />} />

                {/* Buyer & Procurement Routes */}
                <Route path="/buyers" element={<BuyersPage />} />
                <Route path="/procurement" element={<Navigate to="/buyers" replace />} />
                <Route path="/buyers/:id" element={<BuyerDetailPage />} />

                {/* FPO Aggregation Routes */}
                <Route
                  path="/fpo"
                  element={
                    <RoleGate
                      allowedRoles={["fpo", "admin"]}
                      fallbackPath="/dashboard"
                      blockedMessage="FPO Aggregation Portal is available to FPO accounts."
                    >
                      <FPOPage />
                    </RoleGate>
                  }
                />
                <Route path="/fpo/members" element={<Navigate to="/fpo?tab=members" replace />} />
                <Route path="/fpo/aggregation" element={<Navigate to="/fpo?tab=aggregation" replace />} />

                {/* Profile & Analytics */}
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminGate />} />
              </Route>

              {/* Branded 404 Fallback for unknown routes */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <ToastContainer />
          </BrowserRouter>
        </AppStateProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
