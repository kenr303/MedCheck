import { useEffect, useState } from "react";
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
};

const PRICE_DATA_UPDATED = "January 2025";

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
};

export default function PricesScreen() {
  const { currentProduct } = useMedStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchedProduct | null>(null);

  useEffect(() => {
    if (currentProduct?.genericKey) {
      const key = currentProduct.genericKey;
      const found = PRICE_DB[key] || PRICE_DB[ALIASES[key]];
      if (found) {
        setQuery(currentProduct.brandName);
        setResult({
          ...found,
          items: [...found.items].sort((a, b) => a.price - b.price),
        });
      }
    }
  }, [currentProduct]);

  const searchPrices = () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const key = query.trim().toLowerCase();
      const resolvedKey = ALIASES[key] || key;
      const found = PRICE_DB[resolvedKey];
      if (!found) {
        Alert.alert(
          "Not found",
          "Prices not available yet for this product.\n\nAvailable drugs: acetaminophen, ibuprofen, naproxen, aspirin, loratadine, cetirizine, diphenhydramine, omeprazole, famotidine, loperamide, simethicone, guaifenesin, dextromethorphan\n\nSupplements: melatonin, calcium, vitamin d, fish oil",
        );
        setLoading(false);
        return;
      }
      setResult({
        ...found,
        items: [...found.items].sort((a, b) => a.price - b.price),
      });
      setLoading(false);
    }, 500);
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
          <TouchableOpacity style={S.searchBtn} onPress={searchPrices}>
            <Text style={S.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        <Text style={S.hint}>
          Try: Tylenol, ibuprofen, Claritin, aspirin, Mucinex, melatonin,
          calcium...
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
              {result.strength} · sorted by lowest price · prices as of{" "}
              {PRICE_DATA_UPDATED}
            </Text>

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
  input: {
    flex: 1,
    backgroundColor: COLOR.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: "#ccc",
    paddingHorizontal: 16,
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
  partnerCTA: { marginTop: 14, padding: 14, alignItems: "center" },
  partnerCTAText: {
    fontSize: FONT.sm,
    color: COLOR.primaryMid,
    fontWeight: "500",
  },
});
