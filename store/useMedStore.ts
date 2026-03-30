import { create } from "zustand";

export type Ingredient = {
  name: string;
  concentration: string;
  purpose: string;
};

export type MedProduct = {
  brandName: string;
  manufacturer: string;
  form: string;
  ingredients: Ingredient[];
  servingSizeAlert: string | null;
  isBTC: boolean;
  genericKey: string;
};

type MedStore = {
  currentProduct: MedProduct | null;
  setCurrentProduct: (p: MedProduct | null) => void;
  rawFDAResult: any | null;
  setRawFDAResult: (r: any | null) => void;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  compareA: MedProduct | null;
  compareB: MedProduct | null;
  setCompareA: (p: MedProduct | null) => void;
  setCompareB: (p: MedProduct | null) => void;
  clearCompare: () => void;
};

export const useMedStore = create<MedStore>((set, get) => ({
  currentProduct: null,
  setCurrentProduct: (p) => set({ currentProduct: p }),
  rawFDAResult: null,
  setRawFDAResult: (r) => set({ rawFDAResult: r }),
  recentSearches: [],
  addRecentSearch: (q) => {
    const current = get().recentSearches;
    const filtered = current.filter((s) => s.toLowerCase() !== q.toLowerCase());
    set({ recentSearches: [q, ...filtered].slice(0, 8) });
  },
  clearRecentSearches: () => set({ recentSearches: [] }),
  compareA: null,
  compareB: null,
  setCompareA: (p) => set({ compareA: p }),
  setCompareB: (p) => set({ compareB: p }),
  clearCompare: () => set({ compareA: null, compareB: null }),
}));
