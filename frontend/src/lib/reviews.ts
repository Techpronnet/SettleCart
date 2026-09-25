/**
 * Customer reviews, kept on this device until the backend reviews
 * service lands. Reviews are only accepted for delivered or settled
 * orders, mirroring the real eligibility rule.
 */

export interface LocalReview {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string | null;
  productName: string;
  store: string;
  rating: number;
  text: string;
  createdAt: string;
}

const KEY = "settlecart_reviews";

function uid(): string {
  return `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function loadReviews(): LocalReview[] {
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

function persist(reviews: LocalReview[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(reviews));
  } catch {
    // ignore quota errors
  }
}

export function hasReviewed(orderId: string): boolean {
  return loadReviews().some((r) => r.orderId === orderId);
}

export function addReview(input: Omit<LocalReview, "id" | "createdAt">): LocalReview[] {
  const entry: LocalReview = {
    ...input,
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    id: uid(),
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...loadReviews()];
  persist(next);
  return next;
}

export function reviewsForProduct(productId: string): LocalReview[] {
  return loadReviews().filter((r) => r.productId === productId);
}

export function reviewsForStore(storeName: string): LocalReview[] {
  return loadReviews().filter((r) => r.store === storeName);
}

export function averageRating(reviews: LocalReview[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}
