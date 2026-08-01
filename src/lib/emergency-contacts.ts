/**
 * Offline-first emergency contacts. Bundled at build time — no network call,
 * so the page works from cache with no connectivity.
 */
export type Contact = {
  ml: string;
  en: string;
  number: string;
  note?: string;
  /** true when the number is published by KSDMA/official directory; false = needs local confirmation */
  verified?: boolean;
};

export type ContactGroup = {
  id: string;
  ml: string;
  en: string;
  contacts: Contact[];
};

/** Official KSDMA district-wise directory (June 2026 edition). */
export const KSDMA_DIRECTORY_URL =
  "https://sdma.kerala.gov.in/wp-content/uploads/2026/06/Directory-wpn.pdf";
export const KSDMA_CONTACT_URL = "https://sdma.kerala.gov.in/contact-us/";

export const CONTACT_GROUPS: ContactGroup[] = [
  {
    id: "national",
    ml: "ദേശീയ അടിയന്തര നമ്പറുകൾ",
    en: "National emergency numbers",
    contacts: [
      { ml: "അടിയന്തര സഹായം (എല്ലാം)", en: "All-in-one emergency", number: "112" },
      { ml: "പോലീസ്", en: "Police", number: "100" },
      { ml: "അഗ്നിശമന സേന / രക്ഷാപ്രവർത്തനം", en: "Fire & Rescue", number: "101" },
      { ml: "ആംബുലൻസ്", en: "Ambulance", number: "108" },
      {
        ml: "ദുരന്ത നിവാരണ ഹെൽപ്‌ലൈൻ (NDMA)",
        en: "National disaster helpline",
        number: "1078",
      },
    ],
  },
  {
    id: "kerala",
    ml: "കേരള ദുരന്ത നിവാരണം",
    en: "Kerala disaster management",
    contacts: [
      {
        ml: "സംസ്ഥാന എമർജൻസി ഓപ്പറേഷൻ സെന്റർ (KSEOC)",
        en: "State Emergency Operations Centre (KSEOC)",
        number: "1070",
        note: "KSDMA state control room",
        verified: true,
      },
      {
        ml: "KSEOC — രണ്ടാം ലൈൻ",
        en: "KSEOC — second line",
        number: "1079",
        verified: true,
      },
      {
        ml: "KSEOC (ലാൻഡ്‌ലൈൻ)",
        en: "KSEOC (landline)",
        number: "04712778800",
        note: "0471-2778800 — listed on KSDMA contact page",
        verified: true,
      },
      {
        ml: "കേരള സംസ്ഥാന ദുരന്ത നിവാരണ അതോറിറ്റി (KSDMA)",
        en: "Kerala State Disaster Management Authority",
        number: "1077",
        note: "District control room / ജില്ലാ കൺട്രോൾ റൂം",
        verified: true,
      },
      {
        ml: "SEOC (ബദൽ നമ്പർ)",
        en: "SEOC (alternate number)",
        number: "04712364424",
        note: "0471-2364424 — unconfirmed, prefer 1070 / 0471-2778800",
      },
      {
        ml: "കേരള പോലീസ് കൺട്രോൾ റൂം",
        en: "Kerala Police control room",
        number: "04712721547",
        note: "0471-2721547 — unconfirmed, use 100 or 112 in an emergency",
      },
      {
        ml: "അഗ്നിരക്ഷാ സേന കൺട്രോൾ റൂം",
        en: "Fire & Rescue control room",
        number: "04712323241",
        note: "0471-2323241 — unconfirmed, use 101 or 112 in an emergency",
      },
    ],
  },
  {
    id: "medical",
    ml: "ആരോഗ്യം",
    en: "Health & medical",
    contacts: [
      { ml: "ദിശ ആരോഗ്യ ഹെൽപ്‌ലൈൻ", en: "DISHA health helpline", number: "1056" },
      { ml: "ദിശ (ടോൾ ഫ്രീ)", en: "DISHA toll free", number: "104" },
      { ml: "വിഷ വിവര കേന്ദ്രം / ആശുപത്രി", en: "Medical emergency", number: "108" },
    ],
  },
  {
    id: "utilities",
    ml: "വൈദ്യുതി & ജലം",
    en: "Power & water",
    contacts: [
      { ml: "കെ.എസ്.ഇ.ബി കൺട്രോൾ റൂം", en: "KSEB control room", number: "1912" },
      { ml: "കെ.എസ്.ഇ.ബി (ടോൾ ഫ്രീ)", en: "KSEB toll free", number: "18004251912" },
      { ml: "കേരള വാട്ടർ അതോറിറ്റി", en: "Kerala Water Authority", number: "1916" },
    ],
  },
  {
    id: "support",
    ml: "സഹായ ഹെൽപ്‌ലൈനുകൾ",
    en: "Support helplines",
    contacts: [
      { ml: "വനിതാ ഹെൽപ്‌ലൈൻ", en: "Women's helpline", number: "1091" },
      { ml: "കുട്ടികളുടെ ഹെൽപ്‌ലൈൻ (ചൈൽഡ്‌ലൈൻ)", en: "Childline", number: "1098" },
      { ml: "മുതിർന്ന പൗരർ ഹെൽപ്‌ലൈൻ", en: "Senior citizen helpline", number: "14567" },
      { ml: "റെയിൽവേ സുരക്ഷ", en: "Railway helpline", number: "139" },
      { ml: "ഹൈവേ / റോഡ് അപകടം", en: "Highway & road accident", number: "1073" },
    ],
  },
];