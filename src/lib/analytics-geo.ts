export function geoFromHeaders(headers: Headers) {
  const country =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    "Unknown";
  const region = headers.get("x-vercel-ip-country-region");
  const city = headers.get("x-vercel-ip-city");

  return {
    country: country || "Unknown",
    region: region || null,
    city: city ? decodeURIComponent(city) : null,
  };
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

const COUNTRY_ALIASES: Record<string, string> = {
  INDIA: "IN",
  USA: "US",
  "UNITED STATES": "US",
  "UNITED STATES OF AMERICA": "US",
  UK: "GB",
  "UNITED KINGDOM": "GB",
  UAE: "AE",
  "UNITED ARAB EMIRATES": "AE",
};

/** ISO 3166-2 subdivision names, keyed by country then region code. */
const REGION_NAMES: Record<string, Record<string, string>> = {
  IN: {
    AN: "Andaman and Nicobar Islands",
    AP: "Andhra Pradesh",
    AR: "Arunachal Pradesh",
    AS: "Assam",
    BR: "Bihar",
    CH: "Chandigarh",
    CT: "Chhattisgarh",
    CG: "Chhattisgarh",
    DL: "Delhi",
    DH: "Dadra and Nagar Haveli and Daman and Diu",
    DN: "Dadra and Nagar Haveli",
    DD: "Daman and Diu",
    GA: "Goa",
    GJ: "Gujarat",
    HR: "Haryana",
    HP: "Himachal Pradesh",
    JK: "Jammu and Kashmir",
    JH: "Jharkhand",
    KA: "Karnataka",
    KL: "Kerala",
    LA: "Ladakh",
    LD: "Lakshadweep",
    MP: "Madhya Pradesh",
    MH: "Maharashtra",
    MN: "Manipur",
    ML: "Meghalaya",
    MZ: "Mizoram",
    NL: "Nagaland",
    OR: "Odisha",
    OD: "Odisha",
    PY: "Puducherry",
    PB: "Punjab",
    RJ: "Rajasthan",
    SK: "Sikkim",
    TN: "Tamil Nadu",
    TG: "Telangana",
    TS: "Telangana",
    UP: "Uttar Pradesh",
    UT: "Uttarakhand",
    UK: "Uttarakhand",
    WB: "West Bengal",
  },
  US: {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    DC: "District of Columbia",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
  },
  AE: {
    AZ: "Abu Dhabi",
    AJ: "Ajman",
    DU: "Dubai",
    FU: "Fujairah",
    RK: "Ras Al Khaimah",
    SH: "Sharjah",
    UQ: "Umm Al Quwain",
  },
  GB: {
    ENG: "England",
    SCT: "Scotland",
    WLS: "Wales",
    NIR: "Northern Ireland",
  },
  AU: {
    NSW: "New South Wales",
    VIC: "Victoria",
    QLD: "Queensland",
    WA: "Western Australia",
    SA: "South Australia",
    TAS: "Tasmania",
    ACT: "Australian Capital Territory",
    NT: "Northern Territory",
  },
  CA: {
    AB: "Alberta",
    BC: "British Columbia",
    MB: "Manitoba",
    NB: "New Brunswick",
    NL: "Newfoundland and Labrador",
    NS: "Nova Scotia",
    NT: "Northwest Territories",
    NU: "Nunavut",
    ON: "Ontario",
    PE: "Prince Edward Island",
    QC: "Quebec",
    SK: "Saskatchewan",
    YT: "Yukon",
  },
};

function countryIso(country: string): string | null {
  const trimmed = country.trim();
  if (!trimmed) return null;
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  return COUNTRY_ALIASES[trimmed.toUpperCase()] ?? null;
}

/** Full English country name from an ISO code or already-expanded name. */
export function countryDisplayName(country: string | null | undefined): string {
  const raw = country?.trim() ?? "";
  if (!raw || raw.toLowerCase() === "unknown" || raw.length <= 1) return "Unknown";

  const iso = countryIso(raw);
  if (iso) {
    try {
      const name = countryNames.of(iso);
      if (name && name.toUpperCase() !== iso) return name;
    } catch {
      // Invalid region code for Intl — fall through.
    }
  }

  // Unmapped 2–3 letter codes should not appear as countries.
  if (/^[A-Za-z]{2,3}$/.test(raw)) return "Unknown";
  return raw;
}

/**
 * Full region / state name when a reliable mapping exists.
 * Short ISO codes without a mapping return null so the UI never shows "KA".
 */
export function regionDisplayName(
  country: string | null | undefined,
  region: string | null | undefined,
): string | null {
  const raw = region?.trim() ?? "";
  if (!raw || raw.length <= 1) return null;

  const iso = countryIso(country ?? "");
  const mapped = iso ? REGION_NAMES[iso]?.[raw.toUpperCase()] : undefined;
  if (mapped) return mapped;

  // Unmapped ISO-style codes are not display names.
  if (/^[A-Za-z]{2}$/.test(raw) || /^[A-Z]{3}$/.test(raw)) return null;
  return raw;
}

/**
 * Full city name, or null when missing / truncated (e.g. a single letter).
 * Does not invent a city from country or region codes.
 */
export function cityDisplayName(city: string | null | undefined): string | null {
  const raw = city?.trim() ?? "";
  if (!raw || raw.toLowerCase() === "unknown" || raw.length <= 1) return null;
  if (/^[A-Za-z]{2}$/.test(raw) || /^[A-Z]{3}$/.test(raw)) return null;
  return raw;
}

/** Admin label for the cities/regions table. */
export function analyticsPlaceLabel(event: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string | null {
  const country = countryDisplayName(event.country);
  const city = cityDisplayName(event.city);
  if (city) return country === "Unknown" ? city : `${city}, ${country}`;

  const region = regionDisplayName(event.country, event.region);
  if (region) return country === "Unknown" ? region : `${region}, ${country}`;

  return null;
}
