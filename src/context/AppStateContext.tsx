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
  initialCropsByUserId,
  initialLotsByUserId,
  initialNotifications,
  initialOffers,
  initialTransaction,
} from "../data/demo";
import { useAuth } from "./AuthContext";
import type {
  CropAllocation,
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
  updateCrop: (id: string, updates: Partial<CropRecord>) => void;
  setTransaction: (tx: TransactionRecord | ((prev: TransactionRecord) => TransactionRecord)) => void;
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
  if (n.includes("soybean") || n.includes("soya")) return "🌱";
  if (n.includes("maize") || n.includes("corn")) return "🌽";
  return "🌱";
}

function buildUserCropRecords(
  cropNames: string[],
  location: string,
  allocations?: CropAllocation[],
): CropRecord[] {
  return cropNames.map((name, idx) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const matchedAlloc = allocations?.find(
      (a) => a.crop.toLowerCase() === name.toLowerCase(),
    );
    const acreage = matchedAlloc && matchedAlloc.area > 0 ? matchedAlloc.area : undefined;
    const acreageUnit = matchedAlloc?.unit || "Acres";

    return {
      id: `user-crop-${slug}-${idx}`,
      name,
      icon: cropIconFor(name),
      variety: "Certified Selection",
      quantityKg: acreage ? Math.round(acreage * 400) : 500,
      unit: "kg",
      acreage,
      acreageUnit,
      sowingDate: "2026-06-15",
      stage: "Near maturity",
      location: location || "Farm Location",
      expectedPrice: 32,
      harvestEst: "10–15 Sep 2026",
      harvestWindow: "3–5 days",
      recommendation: "SELL",
      bestMarket: "Local Regional Mandi",
      netRealization: 31,
      confidence: 88,
    };
  });
}

function getStorageKey(userId: string | undefined, prefix: string) {
  return `kisansetu-${prefix}-${userId || "guest"}`;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [crops, setCrops] = useState<CropRecord[]>(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(getStorageKey(user.id, "crops"));
        if (stored) return JSON.parse(stored);
      } catch {}
      if (user.role === "buyer") return [];
      if (initialCropsByUserId[user.id]) return initialCropsByUserId[user.id];
      if (user.preferredCrops && user.preferredCrops.length > 0) {
        return buildUserCropRecords(
          user.preferredCrops,
          user.location || user.district || "",
          user.cropAllocations,
        );
      }
    }
    return [];
  });

  const [lots, setLots] = useState<LotRecord[]>(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(getStorageKey(user.id, "lots"));
        if (stored) return JSON.parse(stored);
      } catch {}
      if (user.role === "buyer") return [];
      if (initialLotsByUserId[user.id]) return initialLotsByUserId[user.id];
    }
    return [];
  });

  const [offers, setOffers] = useState<OfferRecord[]>(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(getStorageKey(user.id, "offers"));
        if (stored) return JSON.parse(stored);
      } catch {}
      if (user.id === "farmer-1" || user.id === "u-farmer") return initialOffers;
    }
    return [];
  });

  const [transaction, setTransaction] = useState<TransactionRecord>(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(getStorageKey(user.id, "tx"));
        if (stored) return JSON.parse(stored);
      } catch {}
      if (user.id === "farmer-1" || user.id === "u-farmer" || user.role === "farmer") {
        return initialTransaction;
      }
    }
    return {
      id: "TX-2026-9848",
      lotId: "LOT-F1-001",
      buyerName: "Bharat Agro Processing",
      farmerName: "Ramesh Naidu",
      crop: "Cotton (Grade A)",
      quantityKg: 500,
      pricePerKg: 70,
      grossAmount: 35000,
      transportCharges: 800,
      netRealization: 34200,
      stages: [
        { label: "Contract Confirmed", done: true, date: "05 Sep, 10:20 AM" },
        { label: "Pickup Scheduled", done: true, date: "08 Sep, 8:00 AM" },
        { label: "Transit to Hub", done: false, date: "Pending" },
        { label: "Quality Acceptance", done: false, date: "Pending" },
        { label: "Payment Settlement", done: false, date: "Pending" },
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

  // Synchronize state when authenticated user switches
  useEffect(() => {
    if (user) {
      const userCropKey = getStorageKey(user.id, "crops");
      const userLotKey = getStorageKey(user.id, "lots");
      const userOfferKey = getStorageKey(user.id, "offers");
      const userTxKey = getStorageKey(user.id, "tx");

      const storedCrops = localStorage.getItem(userCropKey);
      const storedLots = localStorage.getItem(userLotKey);
      const storedOffers = localStorage.getItem(userOfferKey);
      const storedTx = localStorage.getItem(userTxKey);

      // 1. Crops
      if (user.role === "buyer") {
        setCrops([]);
        setActiveCropId("");
      } else if (storedCrops) {
        try {
          const parsed = JSON.parse(storedCrops);
          setCrops(parsed);
          if (parsed[0]) setActiveCropId(parsed[0].id);
        } catch {}
      } else if (initialCropsByUserId[user.id]) {
        const fixture = initialCropsByUserId[user.id];
        setCrops(fixture);
        if (fixture[0]) setActiveCropId(fixture[0].id);
      } else if (user.preferredCrops && user.preferredCrops.length > 0) {
        const userCrops = buildUserCropRecords(
          user.preferredCrops,
          user.location || user.district || "",
          user.cropAllocations,
        );
        setCrops(userCrops);
        if (userCrops[0]) setActiveCropId(userCrops[0].id);
      } else {
        setCrops([]);
        setActiveCropId("");
      }

      // 2. Lots (Buyers have NO seller lots)
      if (user.role === "buyer") {
        setLots([]);
      } else if (storedLots) {
        try {
          setLots(JSON.parse(storedLots));
        } catch {}
      } else if (initialLotsByUserId[user.id]) {
        setLots(initialLotsByUserId[user.id]);
      } else {
        setLots([]);
      }

      // 3. Offers
      if (storedOffers) {
        try {
          setOffers(JSON.parse(storedOffers));
        } catch {}
      } else if (user.id === "farmer-1" || user.id === "u-farmer") {
        setOffers(initialOffers);
      } else {
        setOffers([]);
      }

      // 4. Transaction
      if (storedTx) {
        try {
          setTransaction(JSON.parse(storedTx));
        } catch {}
      } else {
        setTransaction(initialTransaction);
      }

      setOnboardData((prev) => ({
        ...prev,
        village: user.village || prev.village,
        district: user.district || prev.district,
        state: user.state || prev.state,
        crops:
          user.preferredCrops && user.preferredCrops.length > 0
            ? user.preferredCrops
            : prev.crops,
        land: user.landAcreage || prev.land,
      }));
    } else {
      setCrops([]);
      setLots([]);
      setOffers([]);
    }
  }, [user]);

  // Persist crops on change
  useEffect(() => {
    if (user?.id && user.role !== "buyer") {
      localStorage.setItem(getStorageKey(user.id, "crops"), JSON.stringify(crops));
    }
  }, [crops, user?.id, user?.role]);

  // Persist lots on change
  useEffect(() => {
    if (user?.id && user.role !== "buyer") {
      localStorage.setItem(getStorageKey(user.id, "lots"), JSON.stringify(lots));
    }
  }, [lots, user?.id, user?.role]);

  // Persist offers on change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(getStorageKey(user.id, "offers"), JSON.stringify(offers));
    }
  }, [offers, user?.id]);

  // Persist transaction on change
  useEffect(() => {
    if (user?.id && transaction && transaction.quantityKg > 0) {
      localStorage.setItem(getStorageKey(user.id, "tx"), JSON.stringify(transaction));
    }
  }, [transaction, user?.id]);

  const showToast = useCallback((message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
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
      if (user?.role === "buyer") {
        showToast("Lot creation is available to Farmers and FPOs.");
        return;
      }
      setLots((prev) => [lot, ...prev]);
      // Populate matched offer
      const matchingOffer: OfferRecord = {
        id: `off-${lot.id.replace(/[^0-9]/g, "") || Date.now()}`,
        lotId: lot.id,
        buyerName: "FreshFarm Foods",
        verified: true,
        pricePerKg: Math.max(lot.expectedPrice, 32),
        quantityKg: lot.quantityKg,
        quality: lot.quality || "Grade A",
        expiresInDays: "2 days",
        status: "Pending",
      };
      setOffers((prev) => [matchingOffer, ...prev]);
      showToast(`Lot ${lot.id} created and opened for buyer offers.`);
    },
    [user?.role, showToast],
  );

  const updateOffer = useCallback(
    (id: string, status: OfferRecord["status"]) => {
      setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      if (status === "Accepted") {
        const found = offers.find((o) => o.id === id);
        if (found) {
          const associatedLot = lots.find((l) => l.id === found.lotId);
          const finalCrop = associatedLot?.crop || "Cotton";
          const finalQty = found.quantityKg || associatedLot?.quantityKg || 500;
          const finalPrice = found.pricePerKg || 32;

          setLots((prev) =>
            prev.map((l) => (l.id === found.lotId ? { ...l, status: "Offer Accepted" } : l)),
          );
          setTransaction({
            id: `TX-2026-${found.lotId.replace(/[^0-9]/g, "") || "9848"}`,
            lotId: found.lotId,
            buyerName: found.buyerName,
            farmerName: user?.name || "Registered Producer",
            crop: finalCrop,
            pricePerKg: finalPrice,
            quantityKg: finalQty,
            grossAmount: finalPrice * finalQty,
            transportCharges: 800,
            netRealization: finalPrice * finalQty - 800,
            stages: [
              { label: "Contract Confirmed & Verified", done: true, date: "Today, 10:30 AM" },
              { label: "Logistics & Pickup Scheduled", done: true, date: "Today, 11:15 AM" },
              { label: "Produce In Transit", done: false, date: "Pending" },
              { label: "Weighing & Quality Acceptance", done: false, date: "Pending" },
              { label: "Payment Record & Settlement", done: false, date: "Pending" },
            ],
          });
        }
        showToast("Offer accepted! Transaction tracking initialized.");
      } else if (status === "Rejected") {
        showToast("Offer rejected.");
      } else if (status === "Countered") {
        showToast("Counter offer sent to buyer.");
      }
    },
    [offers, lots, user?.name, showToast],
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

  const updateCrop = useCallback((id: string, updates: Partial<CropRecord>) => {
    setCrops((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
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
      setTransaction,
      notifications,
      unreadNotifsCount,
      activeCropId,
      onboardData,
      toasts,
      showToast,
      dismissToast,
      setActiveCropId,
      addCrop,
      updateCrop,
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
      setTransaction,
      notifications,
      unreadNotifsCount,
      activeCropId,
      onboardData,
      toasts,
      showToast,
      dismissToast,
      setActiveCropId,
      addCrop,
      updateCrop,
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
