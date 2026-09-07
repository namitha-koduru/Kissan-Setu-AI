import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  initialCrops,
  initialLots,
  initialNotifications,
  initialOffers,
  initialTransaction,
} from "../data/demo";
import { useAuth } from "./AuthContext";
import type {
  CropRecord,
  LotRecord,
  NotificationItem,
  OfferRecord,
  OnboardingData,
  TransactionRecord,
} from "../types";

export interface ToastMessage {
  id: string;
  message: string;
}

interface AppStateValue {
  crops: CropRecord[];
  lots: LotRecord[];
  offers: OfferRecord[];
  transaction: TransactionRecord;
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  activeCropId: string;
  onboardData: OnboardingData;
  toasts: ToastMessage[];
  showToast: (message: string) => void;
  dismissToast: (id: string) => void;
  setActiveCropId: (id: string) => void;
  addCrop: (crop: CropRecord) => void;
  addLot: (lot: LotRecord) => void;
  updateOffer: (id: string, status: OfferRecord["status"]) => void;
  addOffer: (offer: OfferRecord) => void;
  markNotificationAsRead: (id?: string) => void;
  updateOnboardData: (data: Partial<OnboardingData>) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function cropIconFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("tomato")) return "🍅";
  if (n.includes("onion")) return "🧅";
  if (n.includes("potato")) return "🥔";
  if (n.includes("chilli") || n.includes("chili")) return "🌶️";
  if (n.includes("grape")) return "🍇";
  if (n.includes("pomegranate")) return "🍎";
  if (n.includes("wheat")) return "🌾";
  if (n.includes("cotton")) return "☁️";
  if (n.includes("rice") || n.includes("paddy")) return "🌾";
  if (n.includes("banana")) return "🍌";
  if (n.includes("mango")) return "🥭";
  if (n.includes("jackfruit") || n.includes("panasa")) return "🍈";
  return "🌱";
}

function buildUserCropRecords(cropNames: string[], location: string): CropRecord[] {
  return cropNames.map((name, idx) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const existing = initialCrops.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return {
        ...existing,
        id: `user-crop-${slug}-${idx}`,
        location: location || existing.location,
      };
    }
    return {
      id: `user-crop-${slug}-${idx}`,
      name,
      icon: cropIconFor(name),
      variety: "Local / Farm Selection",
      quantityKg: 500,
      unit: "kg",
      sowingDate: "2026-06-15",
      stage: "Near maturity",
      location: location || "Your Farm Location",
      expectedPrice: 32,
      harvestEst: "10–15 Sep 2026",
      harvestWindow: "3–5 days",
      recommendation: "SELL",
      bestMarket: "Local Regional Mandi",
      netRealization: 31,
      confidence: 84,
    };
  });
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const isDemoFarmer = user?.id === "u-farmer";

  const [crops, setCrops] = useState<CropRecord[]>(() => {
    if (user?.preferredCrops && user.preferredCrops.length > 0) {
      return buildUserCropRecords(user.preferredCrops, user.location || user.district || "India");
    }
    return isDemoFarmer ? initialCrops : [];
  });

  const [lots, setLots] = useState<LotRecord[]>(() => {
    return isDemoFarmer ? initialLots : [];
  });

  const [offers, setOffers] = useState<OfferRecord[]>(() => {
    return isDemoFarmer ? initialOffers : [];
  });

  const [transaction, setTransaction] = useState<TransactionRecord>(() => {
    return isDemoFarmer ? initialTransaction : {
      id: "TX-2026-0001",
      lotId: "KS-LOT-001",
      buyerName: "Regional Agri Procurer",
      crop: "Produce",
      quantityKg: 0,
      pricePerKg: 0,
      stages: [
        { label: "Contract Confirmed", done: false, date: "" },
        { label: "Pickup Scheduled", done: false, date: "" },
        { label: "In Transit", done: false, date: "" },
        { label: "Quality Verified", done: false, date: "" },
        { label: "Payment Settled", done: false, date: "" },
      ],
    };
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeCropId, setActiveCropId] = useState<string>(() => crops[0]?.id || "");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [onboardData, setOnboardData] = useState<OnboardingData>(() => ({
    village: user?.village || "",
    district: user?.district || "",
    state: user?.state || "",
    country: "India",
    crops: user?.preferredCrops || [],
    quantity: "",
    land: user?.landAcreage || "",
    markets: [],
  }));

  // Sync crops and onboarding data when authenticated user changes
  useEffect(() => {
    if (user) {
      if (user.preferredCrops && user.preferredCrops.length > 0) {
        const userCrops = buildUserCropRecords(user.preferredCrops, user.location || user.district || "India");
        setCrops(userCrops);
        if (userCrops[0]) {
          setActiveCropId(userCrops[0].id);
        }
      } else if (user.id === "u-farmer") {
        setCrops(initialCrops);
        setActiveCropId(initialCrops[0]?.id || "crop-tomato");
        setLots(initialLots);
        setOffers(initialOffers);
        setTransaction(initialTransaction);
      } else {
        // If regular registered user with no preferred crops set yet
        setCrops((prev) => prev.length > 0 ? prev : []);
        setLots((prev) => prev.length > 0 ? prev : []);
        setOffers((prev) => prev.length > 0 ? prev : []);
      }

      setOnboardData((prev) => ({
        ...prev,
        village: user.village || prev.village,
        district: user.district || prev.district,
        state: user.state || prev.state,
        crops: user.preferredCrops && user.preferredCrops.length > 0 ? user.preferredCrops : prev.crops,
        land: user.landAcreage || prev.land,
      }));
    }
  }, [user]);

  const showToast = useCallback((message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addCrop = useCallback(
    (crop: CropRecord) => {
      setCrops((prev) => [crop, ...prev]);
      setActiveCropId(crop.id);
      showToast(`Crop "${crop.name}" registered and AI analysis completed.`);
    },
    [showToast],
  );

  const addLot = useCallback(
    (lot: LotRecord) => {
      setLots((prev) => [lot, ...prev]);
      showToast(`Lot ${lot.id} created and opened for buyer offers.`);
    },
    [showToast],
  );

  const updateOffer = useCallback(
    (id: string, status: OfferRecord["status"]) => {
      setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      if (status === "Accepted") {
        const found = offers.find((o) => o.id === id);
        if (found) {
          setLots((prev) =>
            prev.map((l) => (l.id === found.lotId ? { ...l, status: "Offer Accepted" } : l)),
          );
          setTransaction((prev) => ({
            ...prev,
            lotId: found.lotId,
            buyerName: found.buyerName,
            pricePerKg: found.pricePerKg,
            quantityKg: found.quantityKg,
            stages: prev.stages.map((s, idx) =>
              idx <= 2 ? { ...s, done: true } : s,
            ),
          }));
        }
        showToast("Offer accepted! Transaction tracking initialized.");
      } else if (status === "Rejected") {
        showToast("Offer rejected.");
      } else if (status === "Countered") {
        showToast("Counter offer sent to buyer.");
      }
    },
    [offers, showToast],
  );

  const addOffer = useCallback((offer: OfferRecord) => {
    setOffers((prev) => [offer, ...prev]);
  }, []);

  const markNotificationAsRead = useCallback((id?: string) => {
    if (id) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, []);

  const updateOnboardData = useCallback((data: Partial<OnboardingData>) => {
    setOnboardData((prev) => ({ ...prev, ...data }));
  }, []);

  const unreadNotifsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      crops,
      lots,
      offers,
      transaction,
      notifications,
      unreadNotifsCount,
      activeCropId,
      onboardData,
      toasts,
      showToast,
      dismissToast,
      setActiveCropId,
      addCrop,
      addLot,
      updateOffer,
      addOffer,
      markNotificationAsRead,
      updateOnboardData,
    }),
    [
      crops,
      lots,
      offers,
      transaction,
      notifications,
      unreadNotifsCount,
      activeCropId,
      onboardData,
      toasts,
      showToast,
      dismissToast,
      setActiveCropId,
      addCrop,
      addLot,
      updateOffer,
      addOffer,
      markNotificationAsRead,
      updateOnboardData,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
