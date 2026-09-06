import {
  createContext,
  useCallback,
  useContext,
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

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [crops, setCrops] = useState<CropRecord[]>(initialCrops);
  const [lots, setLots] = useState<LotRecord[]>(initialLots);
  const [offers, setOffers] = useState<OfferRecord[]>(initialOffers);
  const [transaction, setTransaction] = useState<TransactionRecord>(initialTransaction);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeCropId, setActiveCropId] = useState<string>(initialCrops[0]?.id || "crop-tomato");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [onboardData, setOnboardData] = useState<OnboardingData>({
    village: "Niphad",
    district: "Nashik",
    state: "Maharashtra",
    crops: ["Tomato", "Onion"],
    quantity: "500 kg",
    land: "2.5 acres",
    markets: ["Nashik", "Ahmednagar", "Pune"],
  });

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
