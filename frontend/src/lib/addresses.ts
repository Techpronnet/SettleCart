export interface SavedAddress {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  instructions: string;
  isDefault: boolean;
}

const STORAGE_KEY = "settlecart_addresses";

function uid(): string {
  return `addr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function loadAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(addresses: SavedAddress[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  } catch {
    // ignore quota errors
  }
}

export function saveAddress(input: Omit<SavedAddress, "id" | "isDefault"> & { isDefault?: boolean }): SavedAddress[] {
  const addresses = loadAddresses();
  const entry: SavedAddress = {
    ...input,
    id: uid(),
    isDefault: input.isDefault ?? addresses.length === 0,
  };
  const next = entry.isDefault
    ? [...addresses.map((a) => ({ ...a, isDefault: false })), entry]
    : [...addresses, entry];
  persist(next);
  return next;
}

export function updateAddress(id: string, patch: Partial<SavedAddress>): SavedAddress[] {
  const next = loadAddresses().map((a) =>
    a.id === id
      ? {
          ...a,
          ...patch,
          id: a.id,
          isDefault: patch.isDefault ?? a.isDefault,
        }
      : patch.isDefault
        ? { ...a, isDefault: false }
        : a
  );
  persist(next);
  return next;
}

export function removeAddress(id: string): SavedAddress[] {
  const remaining = loadAddresses().filter((a) => a.id !== id);
  if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }
  persist(remaining);
  return remaining;
}

export function defaultAddress(): SavedAddress | null {
  const addresses = loadAddresses();
  return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
}
