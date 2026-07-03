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

export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return /bot|crawler|spider|slurp|facebookexternalhit|preview|headless/i.test(userAgent);
}
