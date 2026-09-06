import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppStateProvider } from "./context/AppStateContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AppLayout } from "./layouts/AppLayout";
import { ToastContainer } from "./components/Toast";

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
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/crops" element={<CropsPage />} />
                <Route path="/farmer" element={<Navigate to="/crops" replace />} />
                <Route path="/crops/add" element={<AddCropPage />} />
                <Route path="/crops/:id" element={<CropDetailsPage />} />
                <Route path="/recommendation" element={<RecommendationPage />} />
                <Route path="/market" element={<MarketPage />} />
                <Route path="/markets" element={<Navigate to="/market" replace />} />
                <Route path="/buyers" element={<BuyersPage />} />
                <Route path="/buyers/:id" element={<BuyerDetailPage />} />
                <Route path="/lots" element={<LotsPage />} />
                <Route path="/lots/create" element={<CreateLotPage />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/transactions" element={<TransactionPage />} />
                <Route path="/weather" element={<WeatherPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/fpo" element={<FPOPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminGate />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastContainer />
          </BrowserRouter>
        </AppStateProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
