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
  // Current looked-up product (from Lookup tab)
  currentProduct: MedProduct | null;
  setCurrentProduct: (p: MedProduct | null) => void;

  // Compare slots
  compareA: MedProduct | null;
  compareB: MedProduct | null;
  setCompareA: (p: MedProduct | null) => void;
  setCompareB: (p: MedProduct | null) => void;
  clearCompare: () => void;
};

export const useMedStore = create<MedStore>((set) => ({
  currentProduct: null,
  setCurrentProduct: (p) => set({ currentProduct: p }),
  compareA: null,
  compareB: null,
  setCompareA: (p) => set({ compareA: p }),
  setCompareB: (p) => set({ compareB: p }),
  clearCompare: () => set({ compareA: null, compareB: null }),
}));
