import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppStateProvider } from "./context/AppStateContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AppLayout } from "./layouts/AppLayout";
import { AdminPage } from "./pages/AdminPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { BuyersPage } from "./pages/BuyersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FarmerPage } from "./pages/FarmerPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { LotsPage } from "./pages/LotsPage";
import { MarketPage } from "./pages/MarketPage";
import { OffersPage } from "./pages/OffersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RecommendationPage } from "./pages/RecommendationPage";
import { RegisterPage } from "./pages/RegisterPage";
import { WeatherPage } from "./pages/WeatherPage";

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
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/farmer" element={<FarmerPage />} />
                <Route path="/market" element={<MarketPage />} />
                <Route path="/recommendation" element={<RecommendationPage />} />
                <Route path="/buyers" element={<BuyersPage />} />
                <Route path="/lots" element={<LotsPage />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/weather" element={<WeatherPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminGate />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppStateProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
