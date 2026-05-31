const KEY = "asur-vendor-token";

export function readVendorToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function saveVendorToken(token: string) {
  localStorage.setItem(KEY, token);
}

export function clearVendorToken() {
  localStorage.removeItem(KEY);
}
