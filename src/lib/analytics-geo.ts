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
