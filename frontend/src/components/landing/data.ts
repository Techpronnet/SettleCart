export interface LandingProduct {
  id: string;
  name: string;
  price: string;
  store: string;
  storeInitial: string;
  rating: string;
  tag?: string;
  icon: string;
  tint: string;
  verified?: boolean;
  deal?: string;
  trend?: "trending" | "new" | "best" | "deal";
  image?: string | null;
  backendId?: string | null;
  storeId?: string | null;
}

export const CATEGORIES = [
  { label: "Fashion", icon: "fa-black-tie" },
  { label: "Electronics", icon: "fa-plug" },
  { label: "Beauty", icon: "fa-magic" },
  { label: "Groceries", icon: "fa-shopping-basket" },
  { label: "Home & Living", icon: "fa-home" },
  { label: "Phones", icon: "fa-mobile" },
  { label: "Health", icon: "fa-heartbeat" },
  { label: "Food", icon: "fa-cutlery" },
  { label: "Digital", icon: "fa-cloud" },
];
