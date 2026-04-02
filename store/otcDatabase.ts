/**
 * Curated OTC drug family database.
 *
 * Structure: Family → Variants → Strengths
 *   - A "family" is what users search (allegra, mucinex, tylenol)
 *   - A "variant" is a specific product (Allegra-D 24hr, Mucinex DM)
 *   - A "strength" is a dose option within a variant
 *
 * Only OTC-available strengths are listed. Rx-only doses are excluded.
 */

import { Ingredient } from "./useMedStore";

export type OTCStrengthOption = {
  label: string;      // e.g. "200 mg"
  priceKey: string;   // key into PRICE_DB / worker
  ingredients: Ingredient[];
};

export type OTCVariant = {
  name: string;                 // full name: "Allegra-D 24 Hour"
  chipLabel: string;            // short chip: "Allegra-D 24hr"
  genericDescription: string;   // ingredient summary: "Fexofenadine + Pseudoephedrine"
  form?: string;
  isBTC?: boolean;              // behind the counter
  note?: string;
  strengths: OTCStrengthOption[];
  defaultStrengthIndex: number;
};

export type OTCDrugFamily = {
  familyName: string;           // display heading: "Allegra (Fexofenadine)"
  variants: OTCVariant[];
  defaultVariantIndex: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ing(name: string, concentration: string, purpose: string): Ingredient {
  return { name, concentration, purpose };
}

function single(
  label: string,
  priceKey: string,
  ingredients: Ingredient[],
): OTCStrengthOption {
  return { label, priceKey, ingredients };
}

// ─── Database ─────────────────────────────────────────────────────────────────

export const OTC_FAMILIES: Record<string, OTCDrugFamily> = {

  // ── Pain / Fever ──────────────────────────────────────────────────────────

  acetaminophen: {
    familyName: "Acetaminophen (Tylenol)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Acetaminophen (Plain)",
        chipLabel: "Acetaminophen",
        genericDescription: "Acetaminophen only",
        form: "tablet / caplet",
        defaultStrengthIndex: 1,
        strengths: [
          single("325 mg (Regular Strength)", "acetaminophen_325", [ing("Acetaminophen", "325 mg", "Pain reliever / Fever reducer")]),
          single("500 mg (Extra Strength)", "acetaminophen_500", [ing("Acetaminophen", "500 mg", "Pain reliever / Fever reducer")]),
          single("650 mg ER (Extended Release)", "acetaminophen_650", [ing("Acetaminophen", "650 mg", "Pain reliever / Fever reducer")]),
        ],
      },
      {
        name: "Tylenol PM (Acetaminophen + Sleep Aid)",
        chipLabel: "Tylenol PM",
        genericDescription: "Acetaminophen + Diphenhydramine",
        form: "caplet / liquid gel",
        defaultStrengthIndex: 0,
        note: "Contains diphenhydramine — causes drowsiness. Do not take with other sleep aids or antihistamines.",
        strengths: [
          single("500 mg / 25 mg", "acetaminophen_500", [
            ing("Acetaminophen", "500 mg", "Pain reliever / Fever reducer"),
            ing("Diphenhydramine HCl", "25 mg", "Nighttime sleep aid"),
          ]),
        ],
      },
      {
        name: "Tylenol Sinus (Acetaminophen + Decongestant)",
        chipLabel: "Tylenol Sinus",
        genericDescription: "Acetaminophen + Phenylephrine",
        form: "caplet",
        defaultStrengthIndex: 0,
        strengths: [
          single("500 mg / 5 mg", "acetaminophen_500", [
            ing("Acetaminophen", "500 mg", "Pain reliever / Fever reducer"),
            ing("Phenylephrine HCl", "5 mg", "Nasal decongestant"),
          ]),
        ],
      },
    ],
  },

  ibuprofen: {
    familyName: "Ibuprofen (Advil / Motrin IB)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Ibuprofen (Plain)",
        chipLabel: "Ibuprofen",
        genericDescription: "Ibuprofen only",
        form: "tablet / caplet / gel cap",
        defaultStrengthIndex: 0,
        note: "200 mg is the only OTC strength. 400/600/800 mg are prescription-only.",
        strengths: [
          single("200 mg", "ibuprofen", [ing("Ibuprofen", "200 mg", "Pain reliever / Fever reducer / Anti-inflammatory")]),
        ],
      },
      {
        name: "Advil PM (Ibuprofen + Sleep Aid)",
        chipLabel: "Advil PM",
        genericDescription: "Ibuprofen + Diphenhydramine",
        form: "caplet / liquid gel",
        defaultStrengthIndex: 0,
        note: "Contains diphenhydramine — causes drowsiness. Do not combine with other antihistamines.",
        strengths: [
          single("200 mg / 25 mg", "ibuprofen", [
            ing("Ibuprofen", "200 mg", "Pain reliever / Fever reducer"),
            ing("Diphenhydramine Citrate", "38 mg", "Nighttime sleep aid"),
          ]),
        ],
      },
      {
        name: "Advil Sinus Congestion & Pain",
        chipLabel: "Advil Sinus",
        genericDescription: "Ibuprofen + Phenylephrine",
        form: "coated tablet",
        defaultStrengthIndex: 0,
        strengths: [
          single("200 mg / 10 mg", "ibuprofen", [
            ing("Ibuprofen", "200 mg", "Pain reliever / Fever reducer"),
            ing("Phenylephrine HCl", "10 mg", "Nasal decongestant"),
          ]),
        ],
      },
    ],
  },

  naproxen: {
    familyName: "Naproxen Sodium (Aleve)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Naproxen Sodium (Plain)",
        chipLabel: "Naproxen",
        genericDescription: "Naproxen only",
        form: "tablet / caplet / gel cap",
        defaultStrengthIndex: 0,
        note: "220 mg (OTC) = 200 mg naproxen base. Strengths ≥ 275 mg are prescription-only.",
        strengths: [
          single("220 mg", "naproxen", [ing("Naproxen Sodium", "220 mg", "Pain reliever / Fever reducer / Anti-inflammatory")]),
        ],
      },
    ],
  },

  aspirin: {
    familyName: "Aspirin (Bayer / Ecotrin)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Aspirin (Plain)",
        chipLabel: "Aspirin",
        genericDescription: "Aspirin only",
        form: "tablet / coated tablet",
        defaultStrengthIndex: 0,
        strengths: [
          single("81 mg (Low Dose / Cardioprotective)", "aspirin_81", [ing("Aspirin", "81 mg", "Pain reliever / Fever reducer / Cardioprotective")]),
          single("325 mg (Regular Strength)", "aspirin_325", [ing("Aspirin", "325 mg", "Pain reliever / Fever reducer / Anti-inflammatory")]),
          single("500 mg (Extra Strength)", "aspirin_500", [ing("Aspirin", "500 mg", "Pain reliever / Fever reducer")]),
        ],
      },
      {
        name: "Excedrin Extra Strength / Migraine",
        chipLabel: "Excedrin Migraine",
        genericDescription: "Aspirin + Acetaminophen + Caffeine",
        form: "tablet / caplet / gel tab",
        defaultStrengthIndex: 0,
        note: "Same formula for Excedrin Extra Strength and Excedrin Migraine. Contains 65 mg caffeine per dose.",
        strengths: [
          single("250 mg / 250 mg / 65 mg", "aspirin_325", [
            ing("Aspirin", "250 mg", "Pain reliever / Anti-inflammatory"),
            ing("Acetaminophen", "250 mg", "Pain reliever"),
            ing("Caffeine", "65 mg", "Pain reliever aid"),
          ]),
        ],
      },
      {
        name: "Excedrin Tension Headache",
        chipLabel: "Excedrin Tension",
        genericDescription: "Acetaminophen + Caffeine (no aspirin)",
        form: "caplet / gel tab",
        defaultStrengthIndex: 0,
        strengths: [
          single("500 mg / 65 mg", "acetaminophen_500", [
            ing("Acetaminophen", "500 mg", "Pain reliever"),
            ing("Caffeine", "65 mg", "Pain reliever aid"),
          ]),
        ],
      },
    ],
  },

  // ── Antihistamines / Allergy ───────────────────────────────────────────────

  loratadine: {
    familyName: "Loratadine (Claritin)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Loratadine (Plain — Non-Drowsy)",
        chipLabel: "Claritin",
        genericDescription: "Loratadine only",
        form: "tablet",
        defaultStrengthIndex: 0,
        strengths: [
          single("10 mg (24-hour)", "loratadine", [ing("Loratadine", "10 mg", "Antihistamine — allergy relief (non-drowsy)")]),
        ],
      },
      {
        name: "Claritin-D 12 Hour",
        chipLabel: "Claritin-D 12hr",
        genericDescription: "Loratadine + Pseudoephedrine",
        form: "extended-release tablet",
        isBTC: true,
        note: "Kept behind the pharmacy counter. Valid ID required. Contains pseudoephedrine 120 mg (12-hr release).",
        defaultStrengthIndex: 0,
        strengths: [
          single("5 mg / 120 mg ER", "loratadine", [
            ing("Loratadine", "5 mg", "Antihistamine — allergy relief (non-drowsy)"),
            ing("Pseudoephedrine Sulfate", "120 mg ER", "Nasal decongestant (12-hour)"),
          ]),
        ],
      },
      {
        name: "Claritin-D 24 Hour",
        chipLabel: "Claritin-D 24hr",
        genericDescription: "Loratadine + Pseudoephedrine (24-hour)",
        form: "extended-release tablet",
        isBTC: true,
        note: "Kept behind the pharmacy counter. Valid ID required. Contains pseudoephedrine 240 mg (24-hr release).",
        defaultStrengthIndex: 0,
        strengths: [
          single("10 mg / 240 mg ER", "loratadine", [
            ing("Loratadine", "10 mg", "Antihistamine — allergy relief (non-drowsy)"),
            ing("Pseudoephedrine Sulfate", "240 mg ER", "Nasal decongestant (24-hour)"),
          ]),
        ],
      },
    ],
  },

  cetirizine: {
    familyName: "Cetirizine HCl (Zyrtec)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Cetirizine HCl (Plain)",
        chipLabel: "Zyrtec",
        genericDescription: "Cetirizine only",
        form: "tablet",
        defaultStrengthIndex: 1,
        strengths: [
          single("5 mg", "cetirizine_5", [ing("Cetirizine HCl", "5 mg", "Antihistamine — allergy relief")]),
          single("10 mg (24-hour)", "cetirizine_10", [ing("Cetirizine HCl", "10 mg", "Antihistamine — allergy relief")]),
        ],
      },
      {
        name: "Zyrtec-D 12 Hour",
        chipLabel: "Zyrtec-D",
        genericDescription: "Cetirizine + Pseudoephedrine",
        form: "extended-release tablet",
        isBTC: true,
        note: "Kept behind the pharmacy counter. Valid ID required. Each tablet contains pseudoephedrine 120 mg ER.",
        defaultStrengthIndex: 0,
        strengths: [
          single("5 mg / 120 mg ER", "cetirizine_5", [
            ing("Cetirizine HCl", "5 mg", "Antihistamine — allergy relief"),
            ing("Pseudoephedrine HCl", "120 mg ER", "Nasal decongestant (12-hour)"),
          ]),
        ],
      },
    ],
  },

  fexofenadine: {
    familyName: "Fexofenadine HCl (Allegra)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Allegra 12 Hour",
        chipLabel: "Allegra 12hr",
        genericDescription: "Fexofenadine only",
        form: "tablet",
        defaultStrengthIndex: 0,
        strengths: [
          single("60 mg (12-hour)", "fexofenadine_60", [ing("Fexofenadine HCl", "60 mg", "Antihistamine — allergy relief (non-drowsy)")]),
        ],
      },
      {
        name: "Allegra 24 Hour",
        chipLabel: "Allegra 24hr",
        genericDescription: "Fexofenadine only",
        form: "tablet",
        defaultStrengthIndex: 0,
        strengths: [
          single("180 mg (24-hour)", "fexofenadine_180", [ing("Fexofenadine HCl", "180 mg", "Antihistamine — allergy relief (non-drowsy)")]),
        ],
      },
      {
        name: "Allegra-D 12 Hour",
        chipLabel: "Allegra-D 12hr",
        genericDescription: "Fexofenadine + Pseudoephedrine",
        form: "extended-release tablet",
        isBTC: true,
        note: "Kept behind the pharmacy counter. Valid ID required. Pseudoephedrine 120 mg extended-release.",
        defaultStrengthIndex: 0,
        strengths: [
          single("60 mg / 120 mg ER", "fexofenadine_60", [
            ing("Fexofenadine HCl", "60 mg", "Antihistamine — allergy relief (non-drowsy)"),
            ing("Pseudoephedrine HCl", "120 mg ER", "Nasal decongestant (12-hour)"),
          ]),
        ],
      },
      {
        name: "Allegra-D 24 Hour",
        chipLabel: "Allegra-D 24hr",
        genericDescription: "Fexofenadine + Pseudoephedrine (24-hour)",
        form: "extended-release tablet",
        isBTC: true,
        note: "Kept behind the pharmacy counter. Valid ID required. Pseudoephedrine 240 mg extended-release.",
        defaultStrengthIndex: 0,
        strengths: [
          single("180 mg / 240 mg ER", "fexofenadine_180", [
            ing("Fexofenadine HCl", "180 mg", "Antihistamine — allergy relief (non-drowsy)"),
            ing("Pseudoephedrine HCl", "240 mg ER", "Nasal decongestant (24-hour)"),
          ]),
        ],
      },
    ],
  },

  diphenhydramine: {
    familyName: "Diphenhydramine (Benadryl)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Benadryl Allergy (Diphenhydramine Only)",
        chipLabel: "Benadryl Allergy",
        genericDescription: "Diphenhydramine only",
        form: "capsule / tablet / liquid",
        defaultStrengthIndex: 0,
        note: "Causes significant drowsiness. Use with caution in adults over 65.",
        strengths: [
          single("25 mg", "diphenhydramine_25", [ing("Diphenhydramine HCl", "25 mg", "Antihistamine — allergy / cold relief")]),
          single("50 mg (maximum strength)", "diphenhydramine_50", [ing("Diphenhydramine HCl", "50 mg", "Antihistamine / Nighttime sleep aid")]),
        ],
      },
      {
        name: "Benadryl Allergy Plus Congestion",
        chipLabel: "Benadryl + Congestion",
        genericDescription: "Diphenhydramine + Phenylephrine",
        form: "tablet",
        defaultStrengthIndex: 0,
        strengths: [
          single("25 mg / 10 mg", "diphenhydramine_25", [
            ing("Diphenhydramine HCl", "25 mg", "Antihistamine — allergy relief"),
            ing("Phenylephrine HCl", "10 mg", "Nasal decongestant"),
          ]),
        ],
      },
    ],
  },

  // ── Decongestants ─────────────────────────────────────────────────────────

  sudafed: {
    familyName: "Sudafed (Decongestant)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Sudafed PE (Phenylephrine — On Shelf)",
        chipLabel: "Sudafed PE",
        genericDescription: "Phenylephrine only",
        form: "tablet",
        defaultStrengthIndex: 0,
        note: "Available on shelf without ID. Note: studies question the effectiveness of oral phenylephrine as a decongestant.",
        strengths: [
          single("10 mg", "", [ing("Phenylephrine HCl", "10 mg", "Nasal decongestant")]),
        ],
      },
      {
        name: "Sudafed (Pseudoephedrine — Behind Counter)",
        chipLabel: "Sudafed (PSE)",
        genericDescription: "Pseudoephedrine only",
        form: "tablet / ER tablet",
        isBTC: true,
        note: "Kept behind the pharmacy counter. Valid photo ID required. Federal purchase limits apply (CMEA).",
        defaultStrengthIndex: 0,
        strengths: [
          single("30 mg (Immediate Release)", "", [ing("Pseudoephedrine HCl", "30 mg", "Nasal decongestant")]),
          single("60 mg (Immediate Release)", "", [ing("Pseudoephedrine HCl", "60 mg", "Nasal decongestant")]),
          single("120 mg ER (12-hour)", "", [ing("Pseudoephedrine HCl", "120 mg ER", "Nasal decongestant (12-hour)")]),
          single("240 mg ER (24-hour)", "", [ing("Pseudoephedrine HCl", "240 mg ER", "Nasal decongestant (24-hour)")]),
        ],
      },
    ],
  },

  // ── Cough / Cold ──────────────────────────────────────────────────────────

  guaifenesin: {
    familyName: "Guaifenesin (Mucinex)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Mucinex (Guaifenesin Only — Expectorant)",
        chipLabel: "Mucinex",
        genericDescription: "Guaifenesin only",
        form: "tablet / ER tablet",
        defaultStrengthIndex: 1,
        strengths: [
          single("200 mg (Immediate Release)", "guaifenesin_200", [ing("Guaifenesin", "200 mg", "Expectorant — thins and loosens mucus")]),
          single("400 mg (Immediate Release)", "guaifenesin_400", [ing("Guaifenesin", "400 mg", "Expectorant — thins and loosens mucus")]),
          single("600 mg ER (12-hour)", "guaifenesin_600", [ing("Guaifenesin", "600 mg ER", "Expectorant — thins and loosens mucus")]),
          single("1200 mg ER (12-hour Maximum Strength)", "guaifenesin_1200", [ing("Guaifenesin", "1200 mg ER", "Expectorant — thins and loosens mucus")]),
        ],
      },
      {
        name: "Mucinex DM (Guaifenesin + Cough Suppressant)",
        chipLabel: "Mucinex DM",
        genericDescription: "Guaifenesin + Dextromethorphan",
        form: "ER tablet",
        defaultStrengthIndex: 0,
        strengths: [
          single("600 mg / 30 mg ER (12-hour)", "guaifenesin_600", [
            ing("Guaifenesin", "600 mg ER", "Expectorant"),
            ing("Dextromethorphan HBr", "30 mg ER", "Cough suppressant"),
          ]),
          single("1200 mg / 60 mg ER (12-hour Max Strength)", "guaifenesin_1200", [
            ing("Guaifenesin", "1200 mg ER", "Expectorant"),
            ing("Dextromethorphan HBr", "60 mg ER", "Cough suppressant"),
          ]),
        ],
      },
      {
        name: "Mucinex D (Guaifenesin + Decongestant)",
        chipLabel: "Mucinex D",
        genericDescription: "Guaifenesin + Pseudoephedrine",
        form: "ER tablet",
        isBTC: true,
        note: "Kept behind the pharmacy counter. Valid ID required. Contains pseudoephedrine.",
        defaultStrengthIndex: 0,
        strengths: [
          single("600 mg / 60 mg ER (12-hour)", "guaifenesin_600", [
            ing("Guaifenesin", "600 mg ER", "Expectorant"),
            ing("Pseudoephedrine HCl", "60 mg ER", "Nasal decongestant"),
          ]),
          single("1200 mg / 120 mg ER (12-hour Max Strength)", "guaifenesin_1200", [
            ing("Guaifenesin", "1200 mg ER", "Expectorant"),
            ing("Pseudoephedrine HCl", "120 mg ER", "Nasal decongestant"),
          ]),
        ],
      },
    ],
  },

  dextromethorphan: {
    familyName: "Dextromethorphan (Robitussin / Delsym)",
    defaultVariantIndex: 1,
    variants: [
      {
        name: "Dextromethorphan (Cough Only)",
        chipLabel: "Delsym / DXM Only",
        genericDescription: "Dextromethorphan only",
        form: "liquid / tablet / lozenge",
        defaultStrengthIndex: 1,
        strengths: [
          single("10 mg / 5 mL (Liquid)", "dextromethorphan", [ing("Dextromethorphan HBr", "10 mg / 5 mL", "Cough suppressant")]),
          single("15 mg (Tablet)", "dextromethorphan", [ing("Dextromethorphan HBr", "15 mg", "Cough suppressant")]),
          single("30 mg ER / 5 mL (12-hour Liquid)", "dextromethorphan", [ing("Dextromethorphan Polistirex", "30 mg ER / 5 mL", "Cough suppressant (12-hour)")]),
        ],
      },
      {
        name: "Robitussin DM (Guaifenesin + Dextromethorphan)",
        chipLabel: "Robitussin DM",
        genericDescription: "Guaifenesin + Dextromethorphan",
        form: "liquid",
        defaultStrengthIndex: 0,
        strengths: [
          single("100 mg / 10 mg per 5 mL", "dextromethorphan", [
            ing("Guaifenesin", "100 mg / 5 mL", "Expectorant"),
            ing("Dextromethorphan HBr", "10 mg / 5 mL", "Cough suppressant"),
          ]),
        ],
      },
      {
        name: "Robitussin CF (Cough + Cold + Congestion)",
        chipLabel: "Robitussin CF",
        genericDescription: "Guaifenesin + Dextromethorphan + Phenylephrine",
        form: "liquid",
        defaultStrengthIndex: 0,
        strengths: [
          single("100 mg / 10 mg / 5 mg per 5 mL", "dextromethorphan", [
            ing("Guaifenesin", "100 mg / 5 mL", "Expectorant"),
            ing("Dextromethorphan HBr", "10 mg / 5 mL", "Cough suppressant"),
            ing("Phenylephrine HCl", "5 mg / 5 mL", "Nasal decongestant"),
          ]),
        ],
      },
    ],
  },

  nyquil: {
    familyName: "NyQuil / DayQuil (Vicks)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "NyQuil (Nighttime Cold & Flu)",
        chipLabel: "NyQuil",
        genericDescription: "Acetaminophen + Dextromethorphan + Doxylamine",
        form: "liquid / LiquiCap",
        defaultStrengthIndex: 0,
        note: "Contains doxylamine — causes drowsiness. Do not drive after taking.",
        strengths: [
          single("325 mg / 15 mg / 6.25 mg per dose", "acetaminophen_325", [
            ing("Acetaminophen", "325 mg", "Pain reliever / Fever reducer"),
            ing("Dextromethorphan HBr", "15 mg", "Cough suppressant"),
            ing("Doxylamine Succinate", "6.25 mg", "Antihistamine / Sleep aid"),
          ]),
        ],
      },
      {
        name: "NyQuil Severe",
        chipLabel: "NyQuil Severe",
        genericDescription: "Acetaminophen + Dextromethorphan + Doxylamine + Phenylephrine",
        form: "liquid / LiquiCap",
        defaultStrengthIndex: 0,
        note: "Adds phenylephrine as a decongestant. Causes drowsiness.",
        strengths: [
          single("325 mg / 15 mg / 6.25 mg / 5 mg per dose", "acetaminophen_325", [
            ing("Acetaminophen", "325 mg", "Pain reliever / Fever reducer"),
            ing("Dextromethorphan HBr", "15 mg", "Cough suppressant"),
            ing("Doxylamine Succinate", "6.25 mg", "Antihistamine / Sleep aid"),
            ing("Phenylephrine HCl", "5 mg", "Nasal decongestant"),
          ]),
        ],
      },
      {
        name: "DayQuil (Daytime Cold & Flu — Non-Drowsy)",
        chipLabel: "DayQuil",
        genericDescription: "Acetaminophen + Dextromethorphan + Phenylephrine",
        form: "liquid / LiquiCap",
        defaultStrengthIndex: 0,
        note: "Does not contain a sleep aid — safe to use during the day.",
        strengths: [
          single("325 mg / 10 mg / 5 mg per dose", "acetaminophen_325", [
            ing("Acetaminophen", "325 mg", "Pain reliever / Fever reducer"),
            ing("Dextromethorphan HBr", "10 mg", "Cough suppressant"),
            ing("Phenylephrine HCl", "5 mg", "Nasal decongestant"),
          ]),
        ],
      },
    ],
  },

  // ── Acid / GI ─────────────────────────────────────────────────────────────

  omeprazole: {
    familyName: "Omeprazole (Prilosec OTC)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Omeprazole (Delayed-Release)",
        chipLabel: "Prilosec OTC",
        genericDescription: "Omeprazole only",
        form: "delayed-release capsule",
        defaultStrengthIndex: 0,
        note: "20 mg is the only OTC strength. Take once daily for 14 days. Do not use >3 courses/year without a doctor.",
        strengths: [
          single("20 mg", "omeprazole", [ing("Omeprazole", "20 mg", "Acid reducer (proton pump inhibitor)")]),
        ],
      },
    ],
  },

  famotidine: {
    familyName: "Famotidine (Pepcid)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Pepcid AC (Famotidine Only)",
        chipLabel: "Pepcid AC",
        genericDescription: "Famotidine only",
        form: "tablet",
        defaultStrengthIndex: 0,
        strengths: [
          single("10 mg (Original Strength)", "famotidine_10", [ing("Famotidine", "10 mg", "Acid reducer (H2 blocker)")]),
          single("20 mg (Maximum Strength)", "famotidine_20", [ing("Famotidine", "20 mg", "Acid reducer (H2 blocker)")]),
        ],
      },
      {
        name: "Pepcid Complete (Famotidine + Antacids)",
        chipLabel: "Pepcid Complete",
        genericDescription: "Famotidine + Calcium Carbonate + Magnesium Hydroxide",
        form: "chewable tablet",
        defaultStrengthIndex: 0,
        note: "Fast-acting antacid component plus famotidine for longer-lasting acid control.",
        strengths: [
          single("10 mg / 800 mg / 165 mg", "famotidine_10", [
            ing("Famotidine", "10 mg", "Acid reducer (H2 blocker)"),
            ing("Calcium Carbonate", "800 mg", "Antacid"),
            ing("Magnesium Hydroxide", "165 mg", "Antacid"),
          ]),
        ],
      },
    ],
  },

  loperamide: {
    familyName: "Loperamide (Imodium A-D)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Loperamide HCl (Plain)",
        chipLabel: "Imodium A-D",
        genericDescription: "Loperamide only",
        form: "capsule / tablet / liquid",
        defaultStrengthIndex: 0,
        note: "FDA recommends strict adherence to dosing. Do not exceed 8 mg/day for self-care.",
        strengths: [
          single("2 mg", "loperamide", [ing("Loperamide HCl", "2 mg", "Anti-diarrheal")]),
        ],
      },
      {
        name: "Imodium Multi-Symptom Relief",
        chipLabel: "Imodium Multi-Symptom",
        genericDescription: "Loperamide + Simethicone",
        form: "caplet",
        defaultStrengthIndex: 0,
        strengths: [
          single("2 mg / 125 mg", "loperamide", [
            ing("Loperamide HCl", "2 mg", "Anti-diarrheal"),
            ing("Simethicone", "125 mg", "Antigas / Anti-flatulence"),
          ]),
        ],
      },
    ],
  },

  simethicone: {
    familyName: "Simethicone (Gas-X / Phazyme)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Simethicone (Plain)",
        chipLabel: "Gas-X",
        genericDescription: "Simethicone only",
        form: "softgel / chewable tablet",
        defaultStrengthIndex: 1,
        strengths: [
          single("80 mg (Regular Strength)", "simethicone_80", [ing("Simethicone", "80 mg", "Antigas / Anti-flatulence")]),
          single("125 mg (Extra Strength)", "simethicone_125", [ing("Simethicone", "125 mg", "Antigas / Anti-flatulence")]),
          single("180 mg (Ultra Strength)", "simethicone_180", [ing("Simethicone", "180 mg", "Antigas / Anti-flatulence")]),
        ],
      },
    ],
  },

  bismuth: {
    familyName: "Bismuth Subsalicylate (Pepto-Bismol)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Pepto-Bismol (Bismuth Subsalicylate)",
        chipLabel: "Pepto-Bismol",
        genericDescription: "Bismuth subsalicylate only",
        form: "tablet / liquid / chewable tablet",
        defaultStrengthIndex: 0,
        strengths: [
          single("262 mg (Regular Strength)", "bismuth", [ing("Bismuth Subsalicylate", "262 mg", "Antidiarrheal / Antacid / Anti-nausea")]),
          single("525 mg / 15 mL (Maximum Strength Liquid)", "bismuth", [ing("Bismuth Subsalicylate", "525 mg / 15 mL", "Antidiarrheal / Antacid / Anti-nausea")]),
        ],
      },
    ],
  },

  docusate: {
    familyName: "Docusate Sodium (Colace)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Docusate Sodium (Stool Softener)",
        chipLabel: "Colace",
        genericDescription: "Docusate sodium only",
        form: "capsule / tablet",
        defaultStrengthIndex: 0,
        strengths: [
          single("100 mg", "docusate_100", [ing("Docusate Sodium", "100 mg", "Stool softener / Laxative")]),
          single("250 mg", "docusate_250", [ing("Docusate Sodium", "250 mg", "Stool softener / Laxative")]),
        ],
      },
    ],
  },

  "polyethylene glycol": {
    familyName: "Polyethylene Glycol 3350 (MiraLax)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "MiraLax (PEG 3350)",
        chipLabel: "MiraLax",
        genericDescription: "Polyethylene Glycol 3350 only",
        form: "powder (mix with liquid)",
        defaultStrengthIndex: 0,
        strengths: [
          single("17 g per dose", "polyethylene glycol", [ing("Polyethylene Glycol 3350", "17 g / dose", "Osmotic laxative")]),
        ],
      },
    ],
  },

  // ── Topical ───────────────────────────────────────────────────────────────

  hydrocortisone: {
    familyName: "Hydrocortisone (Cortaid / Cortizone-10)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Hydrocortisone Cream / Ointment",
        chipLabel: "Hydrocortisone",
        genericDescription: "Hydrocortisone only",
        form: "cream / ointment",
        defaultStrengthIndex: 1,
        note: "1% is the maximum OTC strength. Do not use on face, groin, or underarms without a doctor's guidance.",
        strengths: [
          single("0.5%", "hydrocortisone", [ing("Hydrocortisone", "0.5%", "Anti-itch / Anti-inflammatory corticosteroid")]),
          single("1% (Maximum OTC Strength)", "hydrocortisone", [ing("Hydrocortisone", "1%", "Anti-itch / Anti-inflammatory corticosteroid")]),
        ],
      },
    ],
  },

  // ── Motion Sickness ───────────────────────────────────────────────────────

  dramamine: {
    familyName: "Dramamine (Motion Sickness)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Dramamine Original Formula (Dimenhydrinate)",
        chipLabel: "Dramamine Original",
        genericDescription: "Dimenhydrinate",
        form: "tablet",
        defaultStrengthIndex: 0,
        note: "Contains dimenhydrinate (antihistamine + stimulant). Causes drowsiness.",
        strengths: [
          single("50 mg", "", [ing("Dimenhydrinate", "50 mg", "Antihistamine — motion sickness / nausea")]),
        ],
      },
      {
        name: "Dramamine Less Drowsy (Meclizine)",
        chipLabel: "Dramamine Less Drowsy",
        genericDescription: "Meclizine only",
        form: "tablet",
        defaultStrengthIndex: 0,
        note: "Less sedating than dimenhydrinate. Also sold as Bonine, Travel-Ease.",
        strengths: [
          single("25 mg", "", [ing("Meclizine HCl", "25 mg", "Antihistamine — motion sickness / vertigo")]),
        ],
      },
    ],
  },

  // ── Sleep / Supplements ───────────────────────────────────────────────────

  melatonin: {
    familyName: "Melatonin (Sleep Supplement)",
    defaultVariantIndex: 0,
    variants: [
      {
        name: "Melatonin (Plain)",
        chipLabel: "Melatonin",
        genericDescription: "Melatonin only",
        form: "tablet / gummy / liquid",
        defaultStrengthIndex: 2,
        note: "Dietary supplement — not FDA-approved as a drug. Start with the lowest effective dose (0.5–3 mg). Higher doses are not more effective for most people.",
        strengths: [
          single("0.5 mg (Low Dose)", "melatonin", [ing("Melatonin", "0.5 mg", "Sleep aid / Circadian rhythm support")]),
          single("1 mg", "melatonin", [ing("Melatonin", "1 mg", "Sleep aid / Circadian rhythm support")]),
          single("3 mg", "melatonin", [ing("Melatonin", "3 mg", "Sleep aid / Circadian rhythm support")]),
          single("5 mg", "melatonin", [ing("Melatonin", "5 mg", "Sleep aid / Circadian rhythm support")]),
          single("10 mg (High Dose)", "melatonin", [ing("Melatonin", "10 mg", "Sleep aid / Circadian rhythm support")]),
        ],
      },
    ],
  },
};

// ── Alias map: search term → OTC_FAMILIES key ─────────────────────────────────

export const OTC_ALIASES: Record<string, string> = {
  // Acetaminophen / Tylenol
  tylenol: "acetaminophen",
  paracetamol: "acetaminophen",
  apap: "acetaminophen",
  "tylenol pm": "acetaminophen",
  "tylenol sinus": "acetaminophen",

  // Ibuprofen / Advil / Motrin
  advil: "ibuprofen",
  motrin: "ibuprofen",
  "motrin ib": "ibuprofen",
  "advil pm": "ibuprofen",
  "advil sinus": "ibuprofen",

  // Naproxen / Aleve
  aleve: "naproxen",
  "naproxen sodium": "naproxen",
  anaprox: "naproxen",

  // Aspirin / Excedrin
  bayer: "aspirin",
  ecotrin: "aspirin",
  excedrin: "aspirin",
  "excedrin migraine": "aspirin",
  "excedrin tension": "aspirin",

  // Loratadine / Claritin
  claritin: "loratadine",
  alavert: "loratadine",
  "claritin d": "loratadine",
  "claritin-d": "loratadine",

  // Cetirizine / Zyrtec
  zyrtec: "cetirizine",
  "zyrtec d": "cetirizine",
  "zyrtec-d": "cetirizine",

  // Fexofenadine / Allegra
  allegra: "fexofenadine",
  "allegra d": "fexofenadine",
  "allegra-d": "fexofenadine",

  // Diphenhydramine / Benadryl
  benadryl: "diphenhydramine",
  zzzquil: "diphenhydramine",
  unisom: "diphenhydramine",
  sominex: "diphenhydramine",
  nytol: "diphenhydramine",

  // Pseudoephedrine / Sudafed
  "sudafed pe": "sudafed",
  pseudoephedrine: "sudafed",
  phenylephrine: "sudafed",

  // Guaifenesin / Mucinex
  mucinex: "guaifenesin",
  "mucinex dm": "guaifenesin",
  "mucinex d": "guaifenesin",

  // Dextromethorphan / Robitussin
  delsym: "dextromethorphan",
  robitussin: "dextromethorphan",
  "robitussin dm": "dextromethorphan",
  "robitussin cf": "dextromethorphan",
  dxm: "dextromethorphan",

  // NyQuil / DayQuil
  dayquil: "nyquil",
  "nyquil severe": "nyquil",
  vicks: "nyquil",

  // Omeprazole / Prilosec
  prilosec: "omeprazole",
  "prilosec otc": "omeprazole",
  zegerid: "omeprazole",

  // Famotidine / Pepcid
  pepcid: "famotidine",
  "pepcid ac": "famotidine",
  "pepcid complete": "famotidine",

  // Loperamide / Imodium
  imodium: "loperamide",
  "imodium a-d": "loperamide",
  "imodium multi-symptom": "loperamide",

  // Simethicone / Gas-X
  "gas-x": "simethicone",
  gasx: "simethicone",
  mylanta: "simethicone",
  phazyme: "simethicone",

  // Bismuth / Pepto-Bismol
  "pepto-bismol": "bismuth",
  "pepto bismol": "bismuth",
  pepto: "bismuth",
  kaopectate: "bismuth",
  "bismuth subsalicylate": "bismuth",

  // Docusate / Colace
  colace: "docusate",
  "docusate sodium": "docusate",
  dulcolax: "docusate",

  // PEG / MiraLax
  miralax: "polyethylene glycol",
  "peg 3350": "polyethylene glycol",
  laxative: "polyethylene glycol",

  // Hydrocortisone
  cortaid: "hydrocortisone",
  "cortizone-10": "hydrocortisone",
  cortizone: "hydrocortisone",

  // Dramamine / Meclizine / Dimenhydrinate
  dramamine: "dramamine",
  bonine: "dramamine",
  meclizine: "dramamine",
  dimenhydrinate: "dramamine",
  "motion sickness": "dramamine",

  // Melatonin
  natrol: "melatonin",
};

/**
 * Look up a drug family in the curated OTC database.
 * Returns the family + resolved key, or null if not found.
 */
export function findOTCFamily(query: string): { key: string; family: OTCDrugFamily } | null {
  const q = query.trim().toLowerCase();

  if (OTC_FAMILIES[q]) return { key: q, family: OTC_FAMILIES[q] };

  const aliasKey = OTC_ALIASES[q];
  if (aliasKey && OTC_FAMILIES[aliasKey]) {
    return { key: aliasKey, family: OTC_FAMILIES[aliasKey] };
  }

  // Partial match
  for (const key of Object.keys(OTC_FAMILIES)) {
    if (key.startsWith(q) || q.startsWith(key)) {
      return { key, family: OTC_FAMILIES[key] };
    }
  }
  for (const [alias, key] of Object.entries(OTC_ALIASES)) {
    if (alias.startsWith(q) && OTC_FAMILIES[key]) {
      return { key, family: OTC_FAMILIES[key] };
    }
  }

  return null;
}

// Keep old name as alias so nothing else breaks
export { findOTCFamily as findOTCEntry };
export type { OTCDrugFamily as OTCDrugEntry };
