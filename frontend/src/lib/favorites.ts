/**
 * Saved items (wishlist), kept on this device until backend
 * favorites land. Entries carry enough detail to re-add to cart.
 */

export interface SavedItem {
  id: string;
  name: string;
  priceNaira: number;
  store: string;
  storeInitial: string;
  icon: string;
  tint: string;
  backendId?: string | null;
  storeId?: string | null;
  savedAt: string;
}

const KEY = "settlecart_wishlist";

export function loadWishlist(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(items: SavedItem[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function isSaved(id: string): boolean {
  return loadWishlist().some((i) => i.id === id);
}

export function toggleSaved(item: Omit<SavedItem, "savedAt">): { saved: boolean; items: SavedItem[] } {
  const current = loadWishlist();
  if (current.some((i) => i.id === item.id)) {
    const next = current.filter((i) => i.id !== item.id);
    persist(next);
    return { saved: false, items: next };
  }
  const next = [{ ...item, savedAt: new Date().toISOString() }, ...current];
  persist(next);
  return { saved: true, items: next };
}

export function removeSaved(id: string): SavedItem[] {
  const next = loadWishlist().filter((i) => i.id !== id);
  persist(next);
  return next;
}
