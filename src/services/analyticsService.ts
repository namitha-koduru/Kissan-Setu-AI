import { api } from "./http";

export const analyticsService = {
  async summary() {
    return api.get(() => ({
      priceTrend: [
        { label: "May", tomato: 24, onion: 16 },
        { label: "Jun", tomato: 26, onion: 17 },
        { label: "Jul", tomato: 27, onion: 18 },
        { label: "Aug", tomato: 29, onion: 19 },
        { label: "Sep", tomato: 30, onion: 18 },
      ],
      realization: [
        { market: "Market A", net: 26 },
        { market: "Nashik", net: 29 },
        { market: "Pune", net: 25 },
      ],
      volume: [
        { crop: "Tomato", kg: 500 },
        { crop: "Onion", kg: 1200 },
        { crop: "Chilli", kg: 180 },
        { crop: "Potato", kg: 0 },
      ],
      demand: [
        { name: "Tomato", value: 82 },
        { name: "Onion", value: 70 },
        { name: "Chilli", value: 64 },
        { name: "Potato", value: 48 },
      ],
      decisions: [
        { month: "May", sell: 4, wait: 3, switch: 1 },
        { month: "Jun", sell: 5, wait: 2, switch: 2 },
        { month: "Jul", sell: 3, wait: 4, switch: 1 },
        { month: "Aug", sell: 6, wait: 2, switch: 1 },
      ],
    }));
  },
};
