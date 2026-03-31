import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLOR, FONT, RADIUS, SPACE } from "../../store/theme";
import { useMedStore } from "../../store/useMedStore";

type PriceItem = {
  name: string;
  store: string;
  count: string;
  price: number;
  pricePerPill: number;
  isGeneric: boolean;
  url: string;
};

type SearchedProduct = {
  genericName: string;
  strength: string;
  items: PriceItem[];
};

// Static fallback prices — used when the live worker is unreachable or offline.
// Update these manually once or twice a year. Live prices come from the worker.
const PRICE_DB: Record<string, SearchedProduct> = {
  acetaminophen: {
    genericName: "Acetaminophen",
    strength: "500 mg",
    items: [
      {
        name: "Equate Acetaminophen",
        store: "Walmart",
        count: "100 ct",
        price: 4.88,
        pricePerPill: 0.05,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+acetaminophen+500mg+100ct",
      },
      {
        name: "CVS Health Acetaminophen",
        store: "CVS",
        count: "100 ct",
        price: 6.99,
        pricePerPill: 0.07,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+acetaminophen+500mg",
      },
      {
        name: "Amazon Basic Care Acetaminophen",
        store: "Amazon",
        count: "100 ct",
        price: 7.49,
        pricePerPill: 0.07,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+acetaminophen+500mg",
      },
      {
        name: "Walgreens Acetaminophen",
        store: "Walgreens",
        count: "100 ct",
        price: 7.99,
        pricePerPill: 0.08,
        isGeneric: true,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=acetaminophen+500mg+100ct",
      },
      {
        name: "Tylenol Extra Strength",
        store: "Amazon",
        count: "100 ct",
        price: 11.47,
        pricePerPill: 0.11,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=tylenol+extra+strength+500mg+100ct",
      },
      {
        name: "Tylenol Extra Strength",
        store: "Walmart",
        count: "100 ct",
        price: 12.98,
        pricePerPill: 0.13,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=tylenol+extra+strength+500mg+100ct",
      },
      {
        name: "Tylenol Extra Strength",
        store: "CVS",
        count: "100 ct",
        price: 14.99,
        pricePerPill: 0.15,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=tylenol+extra+strength+500mg",
      },
      {
        name: "Tylenol Extra Strength",
        store: "Walgreens",
        count: "100 ct",
        price: 15.99,
        pricePerPill: 0.16,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=tylenol+extra+strength+500mg",
      },
    ],
  },
  ibuprofen: {
    genericName: "Ibuprofen",
    strength: "200 mg",
    items: [
      {
        name: "Equate Ibuprofen",
        store: "Walmart",
        count: "100 ct",
        price: 4.48,
        pricePerPill: 0.04,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+ibuprofen+200mg+100ct",
      },
      {
        name: "CVS Health Ibuprofen",
        store: "CVS",
        count: "100 ct",
        price: 5.99,
        pricePerPill: 0.06,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+ibuprofen+200mg",
      },
      {
        name: "Amazon Basic Care Ibuprofen",
        store: "Amazon",
        count: "100 ct",
        price: 6.49,
        pricePerPill: 0.06,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+ibuprofen+200mg",
      },
      {
        name: "Walgreens Ibuprofen",
        store: "Walgreens",
        count: "100 ct",
        price: 6.99,
        pricePerPill: 0.07,
        isGeneric: true,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=ibuprofen+200mg+100ct",
      },
      {
        name: "Advil",
        store: "Amazon",
        count: "100 ct",
        price: 10.97,
        pricePerPill: 0.11,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=advil+200mg+100ct",
      },
      {
        name: "Advil",
        store: "Walmart",
        count: "100 ct",
        price: 11.98,
        pricePerPill: 0.12,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=advil+200mg+100ct",
      },
      {
        name: "Advil",
        store: "CVS",
        count: "100 ct",
        price: 13.99,
        pricePerPill: 0.14,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=advil+200mg",
      },
      {
        name: "Advil",
        store: "Walgreens",
        count: "100 ct",
        price: 14.49,
        pricePerPill: 0.14,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=advil+200mg",
      },
    ],
  },
  loratadine: {
    genericName: "Loratadine",
    strength: "10 mg",
    items: [
      {
        name: "Equate Loratadine",
        store: "Walmart",
        count: "30 ct",
        price: 6.88,
        pricePerPill: 0.23,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+loratadine+10mg+30ct",
      },
      {
        name: "CVS Health Loratadine",
        store: "CVS",
        count: "30 ct",
        price: 7.99,
        pricePerPill: 0.27,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+loratadine+10mg",
      },
      {
        name: "Walgreens Loratadine",
        store: "Walgreens",
        count: "30 ct",
        price: 9.49,
        pricePerPill: 0.32,
        isGeneric: true,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=loratadine+10mg+30ct",
      },
      {
        name: "Amazon Basic Care Loratadine",
        store: "Amazon",
        count: "30 ct",
        price: 10.99,
        pricePerPill: 0.37,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+loratadine+10mg",
      },
      {
        name: "Claritin",
        store: "Amazon",
        count: "30 ct",
        price: 12.47,
        pricePerPill: 0.42,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=claritin+10mg+30ct",
      },
      {
        name: "Claritin",
        store: "Walmart",
        count: "30 ct",
        price: 13.88,
        pricePerPill: 0.46,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=claritin+10mg+30ct",
      },
      {
        name: "Claritin",
        store: "CVS",
        count: "30 ct",
        price: 17.49,
        pricePerPill: 0.58,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=claritin+10mg",
      },
      {
        name: "Claritin",
        store: "Walgreens",
        count: "30 ct",
        price: 18.99,
        pricePerPill: 0.63,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=claritin+10mg+30ct",
      },
    ],
  },
  cetirizine: {
    genericName: "Cetirizine",
    strength: "10 mg",
    items: [
      {
        name: "Equate Cetirizine",
        store: "Walmart",
        count: "45 ct",
        price: 7.88,
        pricePerPill: 0.18,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+cetirizine+10mg",
      },
      {
        name: "CVS Health Cetirizine",
        store: "CVS",
        count: "45 ct",
        price: 9.49,
        pricePerPill: 0.21,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+cetirizine+10mg",
      },
      {
        name: "Amazon Basic Care Cetirizine",
        store: "Amazon",
        count: "45 ct",
        price: 9.99,
        pricePerPill: 0.22,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+cetirizine+10mg",
      },
      {
        name: "Zyrtec",
        store: "Amazon",
        count: "45 ct",
        price: 19.97,
        pricePerPill: 0.44,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=zyrtec+10mg+45ct",
      },
      {
        name: "Zyrtec",
        store: "Walmart",
        count: "45 ct",
        price: 21.98,
        pricePerPill: 0.49,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=zyrtec+10mg",
      },
      {
        name: "Zyrtec",
        store: "CVS",
        count: "45 ct",
        price: 24.99,
        pricePerPill: 0.56,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=zyrtec+10mg",
      },
      {
        name: "Zyrtec",
        store: "Walgreens",
        count: "45 ct",
        price: 25.99,
        pricePerPill: 0.58,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=zyrtec+10mg",
      },
    ],
  },
  omeprazole: {
    genericName: "Omeprazole",
    strength: "20 mg",
    items: [
      {
        name: "Equate Omeprazole",
        store: "Walmart",
        count: "42 ct",
        price: 9.88,
        pricePerPill: 0.24,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+omeprazole+20mg",
      },
      {
        name: "CVS Health Omeprazole",
        store: "CVS",
        count: "42 ct",
        price: 11.99,
        pricePerPill: 0.29,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+omeprazole+20mg",
      },
      {
        name: "Amazon Basic Care Omeprazole",
        store: "Amazon",
        count: "42 ct",
        price: 12.49,
        pricePerPill: 0.3,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+omeprazole+20mg",
      },
      {
        name: "Prilosec OTC",
        store: "Amazon",
        count: "42 ct",
        price: 21.97,
        pricePerPill: 0.52,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=prilosec+otc+20mg+42ct",
      },
      {
        name: "Prilosec OTC",
        store: "Walmart",
        count: "42 ct",
        price: 22.98,
        pricePerPill: 0.55,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=prilosec+otc+20mg",
      },
      {
        name: "Prilosec OTC",
        store: "CVS",
        count: "42 ct",
        price: 25.99,
        pricePerPill: 0.62,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=prilosec+otc",
      },
      {
        name: "Prilosec OTC",
        store: "Walgreens",
        count: "42 ct",
        price: 26.99,
        pricePerPill: 0.64,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=prilosec+otc",
      },
    ],
  },
  naproxen: {
    genericName: "Naproxen",
    strength: "220 mg",
    items: [
      {
        name: "Equate Naproxen",
        store: "Walmart",
        count: "100 ct",
        price: 6.48,
        pricePerPill: 0.06,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+naproxen+220mg",
      },
      {
        name: "CVS Health Naproxen",
        store: "CVS",
        count: "100 ct",
        price: 7.99,
        pricePerPill: 0.08,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+naproxen+220mg",
      },
      {
        name: "Amazon Basic Care Naproxen",
        store: "Amazon",
        count: "100 ct",
        price: 8.49,
        pricePerPill: 0.08,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+naproxen+220mg",
      },
      {
        name: "Aleve",
        store: "Amazon",
        count: "100 ct",
        price: 13.97,
        pricePerPill: 0.14,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=aleve+220mg+100ct",
      },
      {
        name: "Aleve",
        store: "Walmart",
        count: "100 ct",
        price: 14.98,
        pricePerPill: 0.15,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=aleve+220mg",
      },
      {
        name: "Aleve",
        store: "CVS",
        count: "100 ct",
        price: 16.99,
        pricePerPill: 0.17,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=aleve+220mg",
      },
      {
        name: "Aleve",
        store: "Walgreens",
        count: "100 ct",
        price: 17.49,
        pricePerPill: 0.17,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=aleve+220mg",
      },
    ],
  },
  aspirin: {
    genericName: "Aspirin",
    strength: "81 mg",
    items: [
      {
        name: "Equate Aspirin",
        store: "Walmart",
        count: "120 ct",
        price: 3.88,
        pricePerPill: 0.03,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+aspirin+81mg",
      },
      {
        name: "CVS Health Aspirin",
        store: "CVS",
        count: "120 ct",
        price: 4.99,
        pricePerPill: 0.04,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+aspirin+81mg",
      },
      {
        name: "Amazon Basic Care Aspirin",
        store: "Amazon",
        count: "120 ct",
        price: 5.49,
        pricePerPill: 0.05,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+aspirin+81mg",
      },
      {
        name: "Bayer Aspirin",
        store: "Amazon",
        count: "120 ct",
        price: 9.97,
        pricePerPill: 0.08,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=bayer+aspirin+81mg+120ct",
      },
      {
        name: "Bayer Aspirin",
        store: "Walmart",
        count: "120 ct",
        price: 10.48,
        pricePerPill: 0.09,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=bayer+aspirin+81mg",
      },
      {
        name: "Bayer Aspirin",
        store: "CVS",
        count: "120 ct",
        price: 11.99,
        pricePerPill: 0.1,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=bayer+aspirin+81mg",
      },
      {
        name: "Bayer Aspirin",
        store: "Walgreens",
        count: "120 ct",
        price: 12.49,
        pricePerPill: 0.1,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=bayer+aspirin+81mg",
      },
    ],
  },
  diphenhydramine: {
    genericName: "Diphenhydramine",
    strength: "25 mg",
    items: [
      {
        name: "Equate Diphenhydramine",
        store: "Walmart",
        count: "100 ct",
        price: 3.98,
        pricePerPill: 0.04,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+diphenhydramine+25mg",
      },
      {
        name: "CVS Health Diphenhydramine",
        store: "CVS",
        count: "100 ct",
        price: 5.49,
        pricePerPill: 0.05,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+diphenhydramine+25mg",
      },
      {
        name: "Amazon Basic Care Diphenhydramine",
        store: "Amazon",
        count: "100 ct",
        price: 5.99,
        pricePerPill: 0.06,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+diphenhydramine+25mg",
      },
      {
        name: "Benadryl",
        store: "Amazon",
        count: "100 ct",
        price: 14.97,
        pricePerPill: 0.15,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=benadryl+25mg+100ct",
      },
      {
        name: "Benadryl",
        store: "Walmart",
        count: "100 ct",
        price: 15.98,
        pricePerPill: 0.16,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=benadryl+25mg",
      },
      {
        name: "Benadryl",
        store: "CVS",
        count: "100 ct",
        price: 17.99,
        pricePerPill: 0.18,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=benadryl+25mg",
      },
      {
        name: "Benadryl",
        store: "Walgreens",
        count: "100 ct",
        price: 18.49,
        pricePerPill: 0.18,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=benadryl+25mg",
      },
    ],
  },
  famotidine: {
    genericName: "Famotidine",
    strength: "20 mg",
    items: [
      {
        name: "Equate Famotidine",
        store: "Walmart",
        count: "50 ct",
        price: 7.48,
        pricePerPill: 0.15,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+famotidine+20mg",
      },
      {
        name: "CVS Health Famotidine",
        store: "CVS",
        count: "50 ct",
        price: 9.49,
        pricePerPill: 0.19,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+famotidine+20mg",
      },
      {
        name: "Amazon Basic Care Famotidine",
        store: "Amazon",
        count: "50 ct",
        price: 9.99,
        pricePerPill: 0.2,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+famotidine+20mg",
      },
      {
        name: "Pepcid AC",
        store: "Amazon",
        count: "50 ct",
        price: 19.97,
        pricePerPill: 0.4,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=pepcid+ac+20mg+50ct",
      },
      {
        name: "Pepcid AC",
        store: "Walmart",
        count: "50 ct",
        price: 20.98,
        pricePerPill: 0.42,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=pepcid+ac+20mg",
      },
      {
        name: "Pepcid AC",
        store: "CVS",
        count: "50 ct",
        price: 22.99,
        pricePerPill: 0.46,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=pepcid+ac+20mg",
      },
      {
        name: "Pepcid AC",
        store: "Walgreens",
        count: "50 ct",
        price: 23.49,
        pricePerPill: 0.47,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=pepcid+ac+20mg",
      },
    ],
  },
  loperamide: {
    genericName: "Loperamide",
    strength: "2 mg",
    items: [
      {
        name: "Equate Loperamide",
        store: "Walmart",
        count: "48 ct",
        price: 5.48,
        pricePerPill: 0.11,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+loperamide+2mg",
      },
      {
        name: "CVS Health Loperamide",
        store: "CVS",
        count: "48 ct",
        price: 6.99,
        pricePerPill: 0.15,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+loperamide+2mg",
      },
      {
        name: "Amazon Basic Care Loperamide",
        store: "Amazon",
        count: "48 ct",
        price: 7.49,
        pricePerPill: 0.16,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+loperamide+2mg",
      },
      {
        name: "Imodium AD",
        store: "Amazon",
        count: "48 ct",
        price: 14.97,
        pricePerPill: 0.31,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=imodium+ad+2mg+48ct",
      },
      {
        name: "Imodium AD",
        store: "Walmart",
        count: "48 ct",
        price: 15.48,
        pricePerPill: 0.32,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=imodium+ad+2mg",
      },
      {
        name: "Imodium AD",
        store: "CVS",
        count: "48 ct",
        price: 17.49,
        pricePerPill: 0.36,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=imodium+ad+2mg",
      },
      {
        name: "Imodium AD",
        store: "Walgreens",
        count: "48 ct",
        price: 17.99,
        pricePerPill: 0.37,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=imodium+ad+2mg",
      },
    ],
  },
  simethicone: {
    genericName: "Simethicone",
    strength: "125 mg",
    items: [
      {
        name: "Equate Gas Relief",
        store: "Walmart",
        count: "72 ct",
        price: 5.48,
        pricePerPill: 0.08,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+simethicone+125mg",
      },
      {
        name: "CVS Health Gas Relief",
        store: "CVS",
        count: "72 ct",
        price: 7.49,
        pricePerPill: 0.1,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+simethicone+125mg",
      },
      {
        name: "Amazon Basic Care Gas Relief",
        store: "Amazon",
        count: "72 ct",
        price: 7.99,
        pricePerPill: 0.11,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+simethicone+125mg",
      },
      {
        name: "Gas-X Extra Strength",
        store: "Amazon",
        count: "72 ct",
        price: 15.97,
        pricePerPill: 0.22,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=gas-x+extra+strength+125mg",
      },
      {
        name: "Gas-X Extra Strength",
        store: "Walmart",
        count: "72 ct",
        price: 16.48,
        pricePerPill: 0.23,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=gas-x+extra+strength+125mg",
      },
      {
        name: "Gas-X Extra Strength",
        store: "CVS",
        count: "72 ct",
        price: 17.99,
        pricePerPill: 0.25,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=gas-x+extra+strength",
      },
      {
        name: "Gas-X Extra Strength",
        store: "Walgreens",
        count: "72 ct",
        price: 18.49,
        pricePerPill: 0.26,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=gas-x+extra+strength",
      },
    ],
  },
  guaifenesin: {
    genericName: "Guaifenesin",
    strength: "400 mg",
    items: [
      {
        name: "Equate Chest Congestion",
        store: "Walmart",
        count: "100 ct",
        price: 7.48,
        pricePerPill: 0.07,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+guaifenesin+400mg",
      },
      {
        name: "CVS Health Guaifenesin",
        store: "CVS",
        count: "100 ct",
        price: 8.99,
        pricePerPill: 0.09,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+guaifenesin+400mg",
      },
      {
        name: "Amazon Basic Care Guaifenesin",
        store: "Amazon",
        count: "100 ct",
        price: 9.49,
        pricePerPill: 0.09,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+guaifenesin+400mg",
      },
      {
        name: "Mucinex",
        store: "Amazon",
        count: "100 ct",
        price: 23.97,
        pricePerPill: 0.24,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=mucinex+400mg+100ct",
      },
      {
        name: "Mucinex",
        store: "Walmart",
        count: "100 ct",
        price: 24.98,
        pricePerPill: 0.25,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=mucinex+400mg",
      },
      {
        name: "Mucinex",
        store: "CVS",
        count: "100 ct",
        price: 26.99,
        pricePerPill: 0.27,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=mucinex+400mg",
      },
      {
        name: "Mucinex",
        store: "Walgreens",
        count: "100 ct",
        price: 27.49,
        pricePerPill: 0.27,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=mucinex+400mg",
      },
    ],
  },
  dextromethorphan: {
    genericName: "Dextromethorphan",
    strength: "15 mg",
    items: [
      {
        name: "Equate Cough Relief",
        store: "Walmart",
        count: "40 ct",
        price: 4.98,
        pricePerPill: 0.12,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+dextromethorphan+cough",
      },
      {
        name: "CVS Health Cough Relief",
        store: "CVS",
        count: "40 ct",
        price: 6.49,
        pricePerPill: 0.16,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+dextromethorphan",
      },
      {
        name: "Amazon Basic Care Cough Relief",
        store: "Amazon",
        count: "40 ct",
        price: 6.99,
        pricePerPill: 0.17,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+dextromethorphan",
      },
      {
        name: "Robitussin DM",
        store: "Amazon",
        count: "40 ct",
        price: 12.97,
        pricePerPill: 0.32,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=robitussin+cough+dm",
      },
      {
        name: "Robitussin DM",
        store: "Walmart",
        count: "40 ct",
        price: 13.48,
        pricePerPill: 0.34,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=robitussin+dm",
      },
      {
        name: "Robitussin DM",
        store: "CVS",
        count: "40 ct",
        price: 14.99,
        pricePerPill: 0.37,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=robitussin+dm",
      },
      {
        name: "Robitussin DM",
        store: "Walgreens",
        count: "40 ct",
        price: 15.49,
        pricePerPill: 0.39,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=robitussin+dm",
      },
    ],
  },
  melatonin: {
    genericName: "Melatonin",
    strength: "5 mg",
    items: [
      {
        name: "Equate Melatonin",
        store: "Walmart",
        count: "120 ct",
        price: 8.88,
        pricePerPill: 0.07,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+melatonin+5mg",
      },
      {
        name: "CVS Health Melatonin",
        store: "CVS",
        count: "120 ct",
        price: 10.99,
        pricePerPill: 0.09,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+melatonin+5mg",
      },
      {
        name: "Amazon Basic Care Melatonin",
        store: "Amazon",
        count: "120 ct",
        price: 11.49,
        pricePerPill: 0.1,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+melatonin+5mg",
      },
      {
        name: "Natrol Melatonin",
        store: "Amazon",
        count: "120 ct",
        price: 14.97,
        pricePerPill: 0.12,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=natrol+melatonin+5mg+120ct",
      },
      {
        name: "Natrol Melatonin",
        store: "Walmart",
        count: "120 ct",
        price: 15.48,
        pricePerPill: 0.13,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=natrol+melatonin+5mg",
      },
      {
        name: "Natrol Melatonin",
        store: "CVS",
        count: "120 ct",
        price: 16.99,
        pricePerPill: 0.14,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=natrol+melatonin+5mg",
      },
      {
        name: "Natrol Melatonin",
        store: "Walgreens",
        count: "120 ct",
        price: 17.49,
        pricePerPill: 0.15,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=natrol+melatonin+5mg",
      },
    ],
  },
  calcium: {
    genericName: "Calcium Carbonate",
    strength: "600 mg",
    items: [
      {
        name: "Equate Calcium",
        store: "Walmart",
        count: "100 ct",
        price: 5.88,
        pricePerPill: 0.06,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+calcium+600mg",
      },
      {
        name: "CVS Health Calcium",
        store: "CVS",
        count: "100 ct",
        price: 7.49,
        pricePerPill: 0.07,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+calcium+600mg",
      },
      {
        name: "Amazon Basic Care Calcium",
        store: "Amazon",
        count: "100 ct",
        price: 7.99,
        pricePerPill: 0.08,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+calcium+600mg",
      },
      {
        name: "Caltrate 600",
        store: "Amazon",
        count: "100 ct",
        price: 14.97,
        pricePerPill: 0.15,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=caltrate+600+mg+100ct",
      },
      {
        name: "Caltrate 600",
        store: "Walmart",
        count: "100 ct",
        price: 15.48,
        pricePerPill: 0.15,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=caltrate+600mg",
      },
      {
        name: "Caltrate 600",
        store: "CVS",
        count: "100 ct",
        price: 16.99,
        pricePerPill: 0.17,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=caltrate+600",
      },
      {
        name: "Caltrate 600",
        store: "Walgreens",
        count: "100 ct",
        price: 17.49,
        pricePerPill: 0.17,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=caltrate+600",
      },
    ],
  },
  "vitamin d": {
    genericName: "Vitamin D3",
    strength: "1000 IU",
    items: [
      {
        name: "Equate Vitamin D3",
        store: "Walmart",
        count: "100 ct",
        price: 4.88,
        pricePerPill: 0.05,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+vitamin+d3+1000iu",
      },
      {
        name: "CVS Health Vitamin D3",
        store: "CVS",
        count: "100 ct",
        price: 5.99,
        pricePerPill: 0.06,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+vitamin+d3+1000iu",
      },
      {
        name: "Amazon Basic Care Vitamin D3",
        store: "Amazon",
        count: "100 ct",
        price: 6.49,
        pricePerPill: 0.06,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+vitamin+d3+1000iu",
      },
      {
        name: "Nature's Bounty Vitamin D3",
        store: "Amazon",
        count: "100 ct",
        price: 9.97,
        pricePerPill: 0.1,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=natures+bounty+vitamin+d3+1000iu",
      },
      {
        name: "Nature's Bounty Vitamin D3",
        store: "Walmart",
        count: "100 ct",
        price: 10.48,
        pricePerPill: 0.1,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=natures+bounty+vitamin+d3+1000iu",
      },
      {
        name: "Nature's Bounty Vitamin D3",
        store: "CVS",
        count: "100 ct",
        price: 11.99,
        pricePerPill: 0.12,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=natures+bounty+vitamin+d3",
      },
      {
        name: "Nature's Bounty Vitamin D3",
        store: "Walgreens",
        count: "100 ct",
        price: 12.49,
        pricePerPill: 0.12,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=natures+bounty+vitamin+d3",
      },
    ],
  },
  "fish oil": {
    genericName: "Fish Oil (Omega-3)",
    strength: "1000 mg",
    items: [
      {
        name: "Equate Fish Oil",
        store: "Walmart",
        count: "100 ct",
        price: 7.88,
        pricePerPill: 0.08,
        isGeneric: true,
        url: "https://www.walmart.com/search?q=equate+fish+oil+1000mg",
      },
      {
        name: "CVS Health Fish Oil",
        store: "CVS",
        count: "100 ct",
        price: 9.49,
        pricePerPill: 0.09,
        isGeneric: true,
        url: "https://www.cvs.com/search?searchTerm=cvs+fish+oil+1000mg",
      },
      {
        name: "Amazon Basic Care Fish Oil",
        store: "Amazon",
        count: "100 ct",
        price: 9.99,
        pricePerPill: 0.1,
        isGeneric: true,
        url: "https://www.amazon.com/s?k=amazon+basic+care+fish+oil+1000mg",
      },
      {
        name: "Nature's Bounty Fish Oil",
        store: "Amazon",
        count: "100 ct",
        price: 14.97,
        pricePerPill: 0.15,
        isGeneric: false,
        url: "https://www.amazon.com/s?k=natures+bounty+fish+oil+1000mg",
      },
      {
        name: "Nature's Bounty Fish Oil",
        store: "Walmart",
        count: "100 ct",
        price: 15.48,
        pricePerPill: 0.15,
        isGeneric: false,
        url: "https://www.walmart.com/search?q=natures+bounty+fish+oil+1000mg",
      },
      {
        name: "Nature's Bounty Fish Oil",
        store: "CVS",
        count: "100 ct",
        price: 16.99,
        pricePerPill: 0.17,
        isGeneric: false,
        url: "https://www.cvs.com/search?searchTerm=natures+bounty+fish+oil",
      },
      {
        name: "Nature's Bounty Fish Oil",
        store: "Walgreens",
        count: "100 ct",
        price: 17.49,
        pricePerPill: 0.17,
        isGeneric: false,
        url: "https://www.walgreens.com/search/results.jsp?Ntt=natures+bounty+fish+oil",
      },
    ],
  },
  fexofenadine: {
    genericName: "Fexofenadine HCl",
    strength: "180 mg",
    items: [
      { name: "Equate Fexofenadine", store: "Walmart", count: "45 ct", price: 10.88, pricePerPill: 0.24, isGeneric: true, url: "https://www.walmart.com/search?q=equate+fexofenadine+180mg" },
      { name: "Amazon Basic Care Fexofenadine", store: "Amazon", count: "45 ct", price: 11.99, pricePerPill: 0.27, isGeneric: true, url: "https://www.amazon.com/s?k=fexofenadine+180mg+45ct" },
      { name: "CVS Health Fexofenadine", store: "CVS", count: "45 ct", price: 13.49, pricePerPill: 0.30, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=fexofenadine+180mg" },
      { name: "Walgreens Fexofenadine", store: "Walgreens", count: "45 ct", price: 14.99, pricePerPill: 0.33, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=fexofenadine+180mg" },
      { name: "Allegra Allergy", store: "Amazon", count: "45 ct", price: 22.97, pricePerPill: 0.51, isGeneric: false, url: "https://www.amazon.com/s?k=allegra+allergy+180mg+45ct" },
    ],
  },
  bismuth: {
    genericName: "Bismuth Subsalicylate",
    strength: "262 mg",
    items: [
      { name: "Equate Bismuth Subsalicylate", store: "Walmart", count: "48 ct", price: 4.98, pricePerPill: 0.10, isGeneric: true, url: "https://www.walmart.com/search?q=equate+bismuth+subsalicylate+262mg" },
      { name: "Amazon Basic Care Bismuth", store: "Amazon", count: "48 ct", price: 5.49, pricePerPill: 0.11, isGeneric: true, url: "https://www.amazon.com/s?k=bismuth+subsalicylate+262mg" },
      { name: "CVS Health Bismuth", store: "CVS", count: "48 ct", price: 6.49, pricePerPill: 0.14, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=bismuth+subsalicylate" },
      { name: "Walgreens Bismuth", store: "Walgreens", count: "48 ct", price: 7.29, pricePerPill: 0.15, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=bismuth+subsalicylate" },
      { name: "Pepto-Bismol", store: "Walmart", count: "48 ct", price: 8.98, pricePerPill: 0.19, isGeneric: false, url: "https://www.walmart.com/search?q=pepto+bismol+tablets" },
    ],
  },
  docusate: {
    genericName: "Docusate Sodium",
    strength: "100 mg",
    items: [
      { name: "Equate Docusate Sodium", store: "Walmart", count: "100 ct", price: 4.48, pricePerPill: 0.04, isGeneric: true, url: "https://www.walmart.com/search?q=equate+docusate+sodium+100mg" },
      { name: "Amazon Basic Care Docusate", store: "Amazon", count: "100 ct", price: 5.29, pricePerPill: 0.05, isGeneric: true, url: "https://www.amazon.com/s?k=docusate+sodium+100mg+100ct" },
      { name: "CVS Health Docusate", store: "CVS", count: "100 ct", price: 6.49, pricePerPill: 0.06, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=docusate+sodium+100mg" },
      { name: "Walgreens Docusate", store: "Walgreens", count: "100 ct", price: 7.29, pricePerPill: 0.07, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=docusate+sodium+100mg" },
      { name: "Colace", store: "Amazon", count: "100 ct", price: 11.97, pricePerPill: 0.12, isGeneric: false, url: "https://www.amazon.com/s?k=colace+100mg+100ct" },
    ],
  },
  "polyethylene glycol": {
    genericName: "Polyethylene Glycol 3350",
    strength: "17 g dose",
    items: [
      { name: "Equate MiraLax", store: "Walmart", count: "30 doses", price: 14.88, pricePerPill: 0.50, isGeneric: true, url: "https://www.walmart.com/search?q=equate+polyethylene+glycol+3350" },
      { name: "Amazon Basic Care PEG 3350", store: "Amazon", count: "30 doses", price: 15.49, pricePerPill: 0.52, isGeneric: true, url: "https://www.amazon.com/s?k=polyethylene+glycol+3350+powder" },
      { name: "CVS Health PEG 3350", store: "CVS", count: "30 doses", price: 17.99, pricePerPill: 0.60, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=polyethylene+glycol+3350" },
      { name: "Walgreens PEG 3350", store: "Walgreens", count: "30 doses", price: 18.99, pricePerPill: 0.63, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=polyethylene+glycol+3350" },
      { name: "MiraLax", store: "Amazon", count: "30 doses", price: 22.97, pricePerPill: 0.77, isGeneric: false, url: "https://www.amazon.com/s?k=miralax+30+doses" },
    ],
  },
  hydrocortisone: {
    genericName: "Hydrocortisone",
    strength: "1% Cream",
    items: [
      { name: "Equate Hydrocortisone Cream", store: "Walmart", count: "1 oz", price: 2.98, pricePerPill: 2.98, isGeneric: true, url: "https://www.walmart.com/search?q=equate+hydrocortisone+cream+1%" },
      { name: "Amazon Basic Care Hydrocortisone", store: "Amazon", count: "1 oz", price: 3.49, pricePerPill: 3.49, isGeneric: true, url: "https://www.amazon.com/s?k=hydrocortisone+cream+1%25+1oz" },
      { name: "CVS Health Hydrocortisone", store: "CVS", count: "1 oz", price: 4.49, pricePerPill: 4.49, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=hydrocortisone+cream+1%" },
      { name: "Walgreens Hydrocortisone", store: "Walgreens", count: "1 oz", price: 4.99, pricePerPill: 4.99, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=hydrocortisone+cream+1%" },
      { name: "Cortaid", store: "Amazon", count: "1 oz", price: 6.97, pricePerPill: 6.97, isGeneric: false, url: "https://www.amazon.com/s?k=cortaid+hydrocortisone+cream" },
    ],
  },
  "vitamin c": {
    genericName: "Vitamin C (Ascorbic Acid)",
    strength: "500 mg",
    items: [
      { name: "Equate Vitamin C", store: "Walmart", count: "100 ct", price: 3.88, pricePerPill: 0.04, isGeneric: true, url: "https://www.walmart.com/search?q=equate+vitamin+c+500mg" },
      { name: "Amazon Basic Care Vitamin C", store: "Amazon", count: "100 ct", price: 4.49, pricePerPill: 0.04, isGeneric: true, url: "https://www.amazon.com/s?k=vitamin+c+500mg+100ct" },
      { name: "CVS Health Vitamin C", store: "CVS", count: "100 ct", price: 5.99, pricePerPill: 0.06, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=vitamin+c+500mg" },
      { name: "Walgreens Vitamin C", store: "Walgreens", count: "100 ct", price: 6.49, pricePerPill: 0.06, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=vitamin+c+500mg" },
    ],
  },
  magnesium: {
    genericName: "Magnesium Oxide",
    strength: "400 mg",
    items: [
      { name: "Equate Magnesium", store: "Walmart", count: "100 ct", price: 3.98, pricePerPill: 0.04, isGeneric: true, url: "https://www.walmart.com/search?q=equate+magnesium+400mg" },
      { name: "Amazon Basic Care Magnesium", store: "Amazon", count: "100 ct", price: 4.49, pricePerPill: 0.04, isGeneric: true, url: "https://www.amazon.com/s?k=magnesium+oxide+400mg+100ct" },
      { name: "CVS Health Magnesium", store: "CVS", count: "100 ct", price: 5.99, pricePerPill: 0.06, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=magnesium+400mg" },
      { name: "Walgreens Magnesium", store: "Walgreens", count: "100 ct", price: 6.49, pricePerPill: 0.06, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=magnesium+400mg" },
    ],
  },
  zinc: {
    genericName: "Zinc Gluconate",
    strength: "50 mg",
    items: [
      { name: "Equate Zinc", store: "Walmart", count: "100 ct", price: 3.48, pricePerPill: 0.03, isGeneric: true, url: "https://www.walmart.com/search?q=equate+zinc+50mg" },
      { name: "Amazon Basic Care Zinc", store: "Amazon", count: "100 ct", price: 3.99, pricePerPill: 0.04, isGeneric: true, url: "https://www.amazon.com/s?k=zinc+gluconate+50mg+100ct" },
      { name: "CVS Health Zinc", store: "CVS", count: "100 ct", price: 5.49, pricePerPill: 0.05, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=zinc+50mg" },
      { name: "Walgreens Zinc", store: "Walgreens", count: "100 ct", price: 5.99, pricePerPill: 0.06, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=zinc+50mg" },
    ],
  },
  "vitamin b12": {
    genericName: "Vitamin B12 (Cyanocobalamin)",
    strength: "1000 mcg",
    items: [
      { name: "Equate Vitamin B12", store: "Walmart", count: "100 ct", price: 5.98, pricePerPill: 0.06, isGeneric: true, url: "https://www.walmart.com/search?q=equate+vitamin+b12+1000mcg" },
      { name: "Amazon Basic Care B12", store: "Amazon", count: "100 ct", price: 6.49, pricePerPill: 0.06, isGeneric: true, url: "https://www.amazon.com/s?k=vitamin+b12+1000mcg+100ct" },
      { name: "CVS Health Vitamin B12", store: "CVS", count: "100 ct", price: 7.99, pricePerPill: 0.08, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=vitamin+b12+1000mcg" },
      { name: "Walgreens Vitamin B12", store: "Walgreens", count: "100 ct", price: 8.99, pricePerPill: 0.09, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=vitamin+b12+1000mcg" },
    ],
  },
  turmeric: {
    genericName: "Turmeric / Curcumin",
    strength: "500 mg",
    items: [
      { name: "Equate Turmeric Curcumin", store: "Walmart", count: "60 ct", price: 7.98, pricePerPill: 0.13, isGeneric: true, url: "https://www.walmart.com/search?q=equate+turmeric+curcumin" },
      { name: "Amazon Basic Care Turmeric", store: "Amazon", count: "60 ct", price: 8.99, pricePerPill: 0.15, isGeneric: true, url: "https://www.amazon.com/s?k=turmeric+curcumin+500mg+60ct" },
      { name: "CVS Health Turmeric", store: "CVS", count: "60 ct", price: 10.99, pricePerPill: 0.18, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=turmeric+curcumin+500mg" },
      { name: "Walgreens Turmeric", store: "Walgreens", count: "60 ct", price: 11.99, pricePerPill: 0.20, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=turmeric+curcumin" },
      { name: "Qunol Turmeric", store: "Amazon", count: "60 ct", price: 19.97, pricePerPill: 0.33, isGeneric: false, url: "https://www.amazon.com/s?k=qunol+turmeric+500mg" },
    ],
  },
  elderberry: {
    genericName: "Elderberry (Sambucus)",
    strength: "500 mg",
    items: [
      { name: "Equate Elderberry", store: "Walmart", count: "60 ct", price: 8.98, pricePerPill: 0.15, isGeneric: true, url: "https://www.walmart.com/search?q=equate+elderberry+500mg" },
      { name: "Amazon Basic Care Elderberry", store: "Amazon", count: "60 ct", price: 9.99, pricePerPill: 0.17, isGeneric: true, url: "https://www.amazon.com/s?k=elderberry+500mg+60ct" },
      { name: "CVS Health Elderberry", store: "CVS", count: "60 ct", price: 12.99, pricePerPill: 0.22, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=elderberry+500mg" },
      { name: "Walgreens Elderberry", store: "Walgreens", count: "60 ct", price: 13.99, pricePerPill: 0.23, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=elderberry+500mg" },
      { name: "Nature's Bounty Elderberry", store: "Amazon", count: "60 ct", price: 16.97, pricePerPill: 0.28, isGeneric: false, url: "https://www.amazon.com/s?k=natures+bounty+elderberry" },
    ],
  },
  biotin: {
    genericName: "Biotin (Vitamin B7)",
    strength: "5000 mcg",
    items: [
      { name: "Equate Biotin", store: "Walmart", count: "120 ct", price: 6.98, pricePerPill: 0.06, isGeneric: true, url: "https://www.walmart.com/search?q=equate+biotin+5000mcg" },
      { name: "Amazon Basic Care Biotin", store: "Amazon", count: "120 ct", price: 7.49, pricePerPill: 0.06, isGeneric: true, url: "https://www.amazon.com/s?k=biotin+5000mcg+120ct" },
      { name: "CVS Health Biotin", store: "CVS", count: "120 ct", price: 9.99, pricePerPill: 0.08, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=biotin+5000mcg" },
      { name: "Walgreens Biotin", store: "Walgreens", count: "120 ct", price: 10.99, pricePerPill: 0.09, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=biotin+5000mcg" },
    ],
  },
  glucosamine: {
    genericName: "Glucosamine Sulfate",
    strength: "1500 mg",
    items: [
      { name: "Equate Glucosamine", store: "Walmart", count: "90 ct", price: 14.88, pricePerPill: 0.17, isGeneric: true, url: "https://www.walmart.com/search?q=equate+glucosamine+1500mg" },
      { name: "Amazon Basic Care Glucosamine", store: "Amazon", count: "90 ct", price: 16.49, pricePerPill: 0.18, isGeneric: true, url: "https://www.amazon.com/s?k=glucosamine+sulfate+1500mg+90ct" },
      { name: "CVS Health Glucosamine", store: "CVS", count: "90 ct", price: 19.99, pricePerPill: 0.22, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=glucosamine+1500mg" },
      { name: "Walgreens Glucosamine", store: "Walgreens", count: "90 ct", price: 21.99, pricePerPill: 0.24, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=glucosamine+1500mg" },
      { name: "Move Free", store: "Amazon", count: "90 ct", price: 28.97, pricePerPill: 0.32, isGeneric: false, url: "https://www.amazon.com/s?k=move+free+glucosamine" },
    ],
  },
  coq10: {
    genericName: "Coenzyme Q10 (CoQ10)",
    strength: "100 mg",
    items: [
      { name: "Equate CoQ10", store: "Walmart", count: "60 ct", price: 11.88, pricePerPill: 0.20, isGeneric: true, url: "https://www.walmart.com/search?q=equate+coq10+100mg" },
      { name: "Amazon Basic Care CoQ10", store: "Amazon", count: "60 ct", price: 12.99, pricePerPill: 0.22, isGeneric: true, url: "https://www.amazon.com/s?k=coq10+100mg+60ct" },
      { name: "CVS Health CoQ10", store: "CVS", count: "60 ct", price: 15.99, pricePerPill: 0.27, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=coq10+100mg" },
      { name: "Walgreens CoQ10", store: "Walgreens", count: "60 ct", price: 17.99, pricePerPill: 0.30, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=coq10+100mg" },
      { name: "Qunol CoQ10", store: "Amazon", count: "60 ct", price: 24.97, pricePerPill: 0.42, isGeneric: false, url: "https://www.amazon.com/s?k=qunol+coq10+100mg" },
    ],
  },
  probiotics: {
    genericName: "Probiotics",
    strength: "10 Billion CFU",
    items: [
      { name: "Equate Probiotic", store: "Walmart", count: "30 ct", price: 9.98, pricePerPill: 0.33, isGeneric: true, url: "https://www.walmart.com/search?q=equate+probiotic+10+billion" },
      { name: "Amazon Basic Care Probiotic", store: "Amazon", count: "30 ct", price: 10.99, pricePerPill: 0.37, isGeneric: true, url: "https://www.amazon.com/s?k=probiotic+10+billion+cfu+30ct" },
      { name: "CVS Health Probiotic", store: "CVS", count: "30 ct", price: 13.99, pricePerPill: 0.47, isGeneric: true, url: "https://www.cvs.com/search?searchTerm=probiotic+10+billion" },
      { name: "Walgreens Probiotic", store: "Walgreens", count: "30 ct", price: 14.99, pricePerPill: 0.50, isGeneric: true, url: "https://www.walgreens.com/search/results.jsp?Ntt=probiotic+10+billion" },
      { name: "Culturelle Probiotic", store: "Amazon", count: "30 ct", price: 23.97, pricePerPill: 0.80, isGeneric: false, url: "https://www.amazon.com/s?k=culturelle+probiotic+30ct" },
    ],
  },
};

// ── Live pricing via Cloudflare Worker ────────────────────────────────────
// Deploy price-worker/ to get a URL, then set it here.
// Falls back to static PRICE_DB if the worker is unreachable.
const PRICE_WORKER_URL = "https://medcheck-price-worker.donvenecio.workers.dev";

type WorkerResponse = {
  updatedAt: string;
  isEstimate: boolean;
  disclaimer: string;
  data: SearchedProduct | null;
};

async function fetchLivePrices(
  drugKey: string,
): Promise<{ data: SearchedProduct; updatedAt: string; isEstimate: boolean; disclaimer: string } | null> {
  try {
    const res = await fetch(`${PRICE_WORKER_URL}/prices?drug=${encodeURIComponent(drugKey)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const body: WorkerResponse = await res.json();
    if (!body.data) return null;
    return { data: body.data, updatedAt: body.updatedAt, isEstimate: body.isEstimate, disclaimer: body.disclaimer };
  } catch {
    return null;
  }
}
// ──────────────────────────────────────────────────────────────────────────

const ALIASES: Record<string, string> = {
  tylenol: "acetaminophen",
  advil: "ibuprofen",
  motrin: "ibuprofen",
  claritin: "loratadine",
  zyrtec: "cetirizine",
  prilosec: "omeprazole",
  nexium: "omeprazole",
  aleve: "naproxen",
  benadryl: "diphenhydramine",
  pepcid: "famotidine",
  imodium: "loperamide",
  "gas-x": "simethicone",
  mucinex: "guaifenesin",
  robitussin: "dextromethorphan",
  bayer: "aspirin",
  "vitamin d3": "vitamin d",
  omega3: "fish oil",
  omega: "fish oil",
  allegra: "fexofenadine",
  "pepto bismol": "bismuth",
  "pepto-bismol": "bismuth",
  pepto: "bismuth",
  colace: "docusate",
  miralax: "polyethylene glycol",
  peg: "polyethylene glycol",
  laxative: "polyethylene glycol",
  cortaid: "hydrocortisone",
  "vitamin c": "vitamin c",
  "ascorbic acid": "vitamin c",
  b12: "vitamin b12",
  cyanocobalamin: "vitamin b12",
  curcumin: "turmeric",
  sambucus: "elderberry",
  "coenzyme q10": "coq10",
  "coq-10": "coq10",
  probiotic: "probiotics",
  culturelle: "probiotics",
};

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function PricesScreen() {
  const { currentProduct } = useMedStore();
  const params = useLocalSearchParams<{ drug?: string }>();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchedProduct | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isEstimate, setIsEstimate] = useState(false);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  // Track last searched key so we don't re-run on unrelated re-renders
  const lastSearchedKey = useRef<string>("");

  const applyResult = (found: SearchedProduct, meta?: { updatedAt: string; isEstimate: boolean; disclaimer: string }) => {
    setResult({ ...found, items: [...found.items].sort((a, b) => a.price - b.price) });
    if (meta) {
      setUpdatedAt(formatUpdatedAt(meta.updatedAt));
      setIsEstimate(meta.isEstimate);
      setDisclaimer(meta.disclaimer);
    } else {
      setUpdatedAt(null);
      setIsEstimate(false);
      setDisclaimer(null);
    }
  };

  const runSearch = useCallback((rawKey: string, displayName: string) => {
    const resolvedKey = ALIASES[rawKey] || rawKey;
    if (lastSearchedKey.current === resolvedKey) return;
    lastSearchedKey.current = resolvedKey;
    setQuery(displayName);
    setLoading(true);
    setResult(null);
    fetchLivePrices(resolvedKey).then((live) => {
      if (live) {
        applyResult(live.data, live);
      } else {
        const found = PRICE_DB[resolvedKey];
        if (found) applyResult(found);
      }
      setLoading(false);
    });
  }, []);

  // ?drug= param takes priority (navigated from lookup with a specific strength key)
  useEffect(() => {
    const drugParam = params.drug;
    if (drugParam) {
      runSearch(drugParam, drugParam);
      return;
    }
    // Fall back to currentProduct from store (e.g. navigated via tab)
    if (currentProduct?.priceKey) {
      runSearch(currentProduct.priceKey, currentProduct.brandName);
    } else if (currentProduct?.genericKey) {
      runSearch(currentProduct.genericKey, currentProduct.brandName);
    }
  }, [params.drug, currentProduct, runSearch]);

  const searchPrices = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    const key = query.trim().toLowerCase();
    const resolvedKey = ALIASES[key] || key;
    const live = await fetchLivePrices(resolvedKey);
    if (live) {
      applyResult(live.data, live);
      setLoading(false);
      return;
    }
    const found = PRICE_DB[resolvedKey];
    if (!found) {
      Alert.alert(
        "Not found",
        "Prices not available for this product. Try: acetaminophen, ibuprofen, aspirin, naproxen, loratadine, cetirizine, fexofenadine, diphenhydramine, omeprazole, famotidine, loperamide, bismuth, docusate, MiraLax, hydrocortisone, melatonin, calcium, vitamin D, vitamin C, magnesium, zinc, vitamin B12, fish oil, turmeric, elderberry, biotin, glucosamine, CoQ10, probiotics",
      );
      setLoading(false);
      return;
    }
    applyResult(found);
    setLoading(false);
  };

  const openLink = (url: string) => {
    if (!url) {
      Alert.alert(
        "Local pharmacy",
        "Call your local pharmacy for current pricing.",
      );
      return;
    }
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open link."),
    );
  };

  const savings = result
    ? result.items[result.items.length - 1].price - result.items[0].price
    : 0;

  return (
    <ScrollView style={S.container} keyboardShouldPersistTaps="handled">
      <View style={S.inner}>
        <View style={S.searchRow}>
          <View style={S.inputWrap}>
            <TextInput
              style={S.input}
              placeholder="Drug or supplement name..."
              placeholderTextColor={COLOR.textMuted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={searchPrices}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity
                style={S.clearBtn}
                onPress={() => {
                  setQuery("");
                  setResult(null);
                  setUpdatedAt(null);
                  setIsEstimate(false);
                  setDisclaimer(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={S.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={S.searchBtn} onPress={searchPrices}>
            <Text style={S.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        <Text style={S.hint}>
          Try: Tylenol, ibuprofen, Claritin, Allegra, Pepto-Bismol, MiraLax,
          melatonin, vitamin C, magnesium, zinc, turmeric, CoQ10...
        </Text>

        {loading && (
          <View style={S.loadingWrap}>
            <ActivityIndicator size="large" color={COLOR.primaryMid} />
            <Text style={S.loadingText}>Finding best prices...</Text>
          </View>
        )}

        {result && (
          <View>
            <Text style={S.productName}>{result.genericName}</Text>
            <Text style={S.productStrength}>
              {result.strength} · sorted by lowest price
              {updatedAt ? ` · updated ${updatedAt}` : ""}
            </Text>
            {isEstimate && disclaimer && (
              <Text style={S.estimateNote}>⚠ {disclaimer}</Text>
            )}

            {/* Local pharmacy slot */}
            <TouchableOpacity
              style={S.localCard}
              onPress={() => openLink("")}
              activeOpacity={0.8}
            >
              <View style={S.localLeft}>
                <View style={S.localBadgeRow}>
                  <View style={S.localBadge}>
                    <Text style={S.localBadgeText}>Local pharmacy</Text>
                  </View>
                </View>
                <Text style={S.localName}>Your Local Pharmacy</Text>
                <Text style={S.localNote}>
                  Support your local independent pharmacy. Personal service,
                  same ingredients.
                </Text>
              </View>
              <View style={S.localRight}>
                <Text style={S.localCTA}>Call for{"\n"}price</Text>
              </View>
            </TouchableOpacity>

            <Text style={S.bestLabel}>Best deal online</Text>

            {result.items.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[S.priceCard, i === 0 && S.priceCardBest]}
                onPress={() => openLink(item.url)}
                activeOpacity={0.7}
              >
                <View style={S.pcLeft}>
                  <Text style={S.pcName}>{item.name}</Text>
                  <Text style={S.pcMeta}>
                    {item.count} · {item.store}
                  </Text>
                  <View
                    style={[S.tag, item.isGeneric ? S.tagGeneric : S.tagBrand]}
                  >
                    <Text
                      style={[
                        S.tagText,
                        item.isGeneric ? S.tagGenericText : S.tagBrandText,
                      ]}
                    >
                      {item.isGeneric ? "Generic" : "Brand name"}
                    </Text>
                  </View>
                </View>
                <View style={S.pcRight}>
                  <Text style={[S.pcPrice, i === 0 && S.pcPriceBest]}>
                    ${item.price.toFixed(2)}
                  </Text>
                  <Text style={S.pcPerPill}>
                    ${item.pricePerPill.toFixed(2)} / pill
                  </Text>
                  <Text style={S.pcArrow}>↗</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={S.savingsBox}>
              <View>
                <Text style={S.savingsLabel}>Max savings</Text>
                <Text style={S.savingsSub}>cheapest vs. most expensive</Text>
              </View>
              <Text style={S.savingsAmt}>${savings.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={S.partnerCTA}
              onPress={() =>
                Alert.alert(
                  "List your pharmacy",
                  "Contact us at: partners@medcheckapp.com",
                )
              }
            >
              <Text style={S.partnerCTAText}>
                Are you a local pharmacy? Get listed here →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR.bg },
  inner: { padding: SPACE.md },
  searchRow: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.sm },
  inputWrap: { flex: 1, position: "relative", justifyContent: "center" },
  clearBtn: {
    position: "absolute",
    right: 10,
    padding: 4,
  },
  clearBtnText: { fontSize: 14, color: COLOR.textMuted },
  input: {
    flex: 1,
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: "#ccc",
    paddingLeft: 16,
    paddingRight: 36,
    paddingVertical: 14,
    fontSize: FONT.md,
    color: COLOR.text,
  },
  searchBtn: {
    backgroundColor: COLOR.primaryMid,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  searchBtnText: { color: COLOR.white, fontSize: FONT.md, fontWeight: "500" },
  hint: {
    fontSize: FONT.xs,
    color: COLOR.textMuted,
    marginBottom: SPACE.md,
    lineHeight: 20,
  },
  loadingWrap: { alignItems: "center", marginTop: 48, gap: 14 },
  loadingText: { fontSize: FONT.md, color: COLOR.textSub },
  productName: { fontSize: FONT.xl, fontWeight: "600", color: COLOR.text },
  productStrength: {
    fontSize: FONT.sm,
    color: COLOR.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  localCard: {
    flexDirection: "row",
    backgroundColor: "#FFF8E7",
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  localLeft: { flex: 1 },
  localBadgeRow: { flexDirection: "row", marginBottom: 6 },
  localBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  localBadgeText: { fontSize: FONT.xs, fontWeight: "700", color: "#78350F" },
  localName: {
    fontSize: FONT.md,
    fontWeight: "600",
    color: COLOR.text,
    marginBottom: 3,
  },
  localNote: { fontSize: FONT.sm, color: COLOR.textSub, lineHeight: 20 },
  localRight: { justifyContent: "center", alignItems: "center" },
  localCTA: {
    fontSize: FONT.sm,
    fontWeight: "600",
    color: "#B45309",
    textAlign: "center",
    lineHeight: 20,
  },
  bestLabel: {
    fontSize: FONT.sm,
    fontWeight: "600",
    color: COLOR.success,
    marginBottom: 8,
  },
  priceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  priceCardBest: { borderColor: "#1D9E75", borderWidth: 1.5 },
  pcLeft: { flex: 1, minWidth: 0 },
  pcName: { fontSize: FONT.md, fontWeight: "600", color: COLOR.text },
  pcMeta: { fontSize: FONT.sm, color: COLOR.textSub, marginTop: 4 },
  tag: {
    marginTop: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagGeneric: { backgroundColor: COLOR.successLight },
  tagBrand: { backgroundColor: COLOR.primaryLight },
  tagText: { fontSize: FONT.xs, fontWeight: "600" },
  tagGenericText: { color: "#27500A" },
  tagBrandText: { color: COLOR.primary },
  pcRight: { alignItems: "flex-end" },
  pcPrice: { fontSize: FONT.xxl, fontWeight: "600", color: COLOR.primary },
  pcPriceBest: { color: COLOR.success },
  pcPerPill: { fontSize: FONT.sm, color: COLOR.textSub, marginTop: 3 },
  pcArrow: { fontSize: FONT.sm, color: COLOR.primaryMid, marginTop: 5 },
  savingsBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    padding: 16,
    marginTop: 4,
  },
  savingsLabel: { fontSize: FONT.md, fontWeight: "600", color: COLOR.text },
  savingsSub: { fontSize: FONT.sm, color: COLOR.textMuted, marginTop: 3 },
  savingsAmt: {
    fontSize: FONT.xxl + 4,
    fontWeight: "600",
    color: COLOR.primary,
  },
  estimateNote: {
    fontSize: FONT.xs,
    color: COLOR.warning,
    lineHeight: 18,
    marginBottom: 12,
  },
  partnerCTA: { marginTop: 14, padding: 14, alignItems: "center" },
  partnerCTAText: {
    fontSize: FONT.sm,
    color: COLOR.primaryMid,
    fontWeight: "500",
  },
});
