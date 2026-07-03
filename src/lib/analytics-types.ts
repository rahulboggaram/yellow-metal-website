export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export type AnalyticsEvent = {
  id: string;
  timestamp: string;
  path: string;
  sessionId: string;
  referrer: string | null;
  deviceType: DeviceType;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceVendor: string | null;
  deviceModel: string | null;
  country: string;
  region: string | null;
  city: string | null;
};

export type AnalyticsCollectInput = {
  path: string;
  sessionId: string;
  referrer?: string | null;
};

export type AnalyticsSummary = {
  totalViews: number;
  uniqueVisitors: number;
  mobileViews: number;
  desktopViews: number;
  tabletViews: number;
  byCountry: { label: string; count: number }[];
  byCity: { label: string; count: number }[];
  byBrowser: { label: string; count: number }[];
  byMobileDevice: { label: string; count: number }[];
  byDay: { date: string; views: number; visitors: number }[];
  byPath: { label: string; count: number }[];
};

export type AnalyticsQuery = {
  from?: string;
  to?: string;
  month?: string;
};
