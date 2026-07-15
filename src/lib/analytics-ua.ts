import { UAParser } from "ua-parser-js";
import type { DeviceType } from "./analytics-types";

export function parseUserAgent(userAgent: string | null) {
  const parser = new UAParser(userAgent ?? undefined);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  let deviceType: DeviceType = "unknown";
  if (device.type === "mobile") deviceType = "mobile";
  else if (device.type === "tablet") deviceType = "tablet";
  else if (device.type === undefined || device.type === "console" || device.type === "smarttv") {
    deviceType = userAgent && /Mobi|Android/i.test(userAgent) ? "mobile" : "desktop";
  }

  return {
    deviceType,
    browser: browser.name ?? "Unknown",
    browserVersion: browser.version ?? "",
    os: os.name ?? "Unknown",
    osVersion: os.version ?? "",
    deviceVendor: device.vendor ?? null,
    deviceModel: device.model ?? null,
  };
}

const BOT_UA_PATTERN =
  /bot|crawler|spider|crawling|slurp|facebookexternalhit|facebot|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|redditbot|applebot|bingpreview|duckduckbot|yandex|baiduspider|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|ccbot|amazonbot|chatgpt|perplexity|omgili|diffbot|phantomjs|headless|puppeteer|playwright|selenium|webdriver|python-requests|python-urllib|aiohttp|httpx|curl\/|wget|libwww|scrapy|go-http-client|java\/|okhttp|apache-httpclient|node-fetch|undici|postman|insomnia|httpclient|libcurl/i;

const REAL_BROWSER_PATTERN =
  /Mozilla\/5\.0.*(Chrome|Chromium|CriOS|Firefox|FxiOS|Safari|Edg|EdgiOS|OPR|SamsungBrowser|Brave)\//i;

/**
 * Conservative bot filter for analytics/engagement.
 * Empty, tool-like, and well-known crawler UAs are skipped.
 * Spoofed browser UAs can still pass — this is defense-in-depth, not identity.
 */
export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  const ua = userAgent.trim();
  if (ua.length < 12 || ua.length > 512) return true;
  if (BOT_UA_PATTERN.test(ua)) return true;
  if (!REAL_BROWSER_PATTERN.test(ua)) return true;

  const parser = new UAParser(ua);
  const browser = parser.getBrowser();
  if (!browser.name || browser.name === "Unknown") return true;

  return false;
}
