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

export interface LandingStore {
  name: string;
  category: string;
  initial: string;
  products: string;
  rating: string;
  icon: string;
  tint: string;
  featured: string;
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

export const HERO_PRODUCTS: LandingProduct[] = [
  { id: "h1", name: "Ankara Midi Dress", price: "₦24,500", store: "Urban Threads", storeInitial: "U", rating: "4.8", tag: "Fashion", icon: "fa-black-tie", tint: "bg-rose-50 text-rose-600", verified: true },
  { id: "h2", name: "Smartphone X12 128GB", price: "₦189,000", store: "Nova Gadgets", storeInitial: "N", rating: "4.9", tag: "Electronics", icon: "fa-mobile", tint: "bg-sky-50 text-sky-600", verified: true },
  { id: "h3", name: "Shea Glow Body Butter", price: "₦8,750", store: "Glow & Co.", storeInitial: "G", rating: "4.7", tag: "Beauty", icon: "fa-magic", tint: "bg-amber-50 text-amber-600", verified: true },
  { id: "h4", name: "Farm Fresh Basket", price: "₦12,300", store: "Fresh Basket", storeInitial: "F", rating: "4.8", tag: "Groceries", icon: "fa-shopping-basket", tint: "bg-emerald-50 text-emerald-600" },
  { id: "h5", name: "Rattan Lounge Chair", price: "₦86,000", store: "HomeHaus", storeInitial: "H", rating: "4.6", tag: "Home", icon: "fa-home", tint: "bg-orange-50 text-orange-600", verified: true },
];

export const DISCOVERY_PRODUCTS: LandingProduct[] = [
  { id: "d1", name: "Aso-Oke Agbada Set", price: "₦48,000", store: "Urban Threads", storeInitial: "U", rating: "4.9", icon: "fa-black-tie", tint: "bg-rose-50 text-rose-600", verified: true },
  { id: "d2", name: "Wireless Earbuds Pro", price: "₦32,500", store: "Nova Gadgets", storeInitial: "N", rating: "4.7", icon: "fa-headphones", tint: "bg-sky-50 text-sky-600", verified: true },
  { id: "d3", name: "Natural Hair Kit", price: "₦15,200", store: "Glow & Co.", storeInitial: "G", rating: "4.8", icon: "fa-magic", tint: "bg-amber-50 text-amber-600", verified: true },
  { id: "d4", name: "Ofada Rice 5kg", price: "₦18,900", store: "Fresh Basket", storeInitial: "F", rating: "4.6", icon: "fa-shopping-basket", tint: "bg-emerald-50 text-emerald-600" },
  { id: "d5", name: "Ceramic Dinner Set", price: "₦41,000", store: "HomeHaus", storeInitial: "H", rating: "4.7", icon: "fa-cutlery", tint: "bg-orange-50 text-orange-600", verified: true },
  { id: "d6", name: "Phone Stand + Charger", price: "₦9,800", store: "TechHub", storeInitial: "T", rating: "4.5", icon: "fa-plug", tint: "bg-violet-50 text-violet-600", verified: true },
  { id: "d7", name: "Herbal Tea Collection", price: "₦6,400", store: "Fresh Basket", storeInitial: "F", rating: "4.8", icon: "fa-coffee", tint: "bg-emerald-50 text-emerald-600" },
  { id: "d8", name: "Leather Weekend Bag", price: "₦56,000", store: "Urban Threads", storeInitial: "U", rating: "4.9", icon: "fa-briefcase", tint: "bg-rose-50 text-rose-600", verified: true },
];

export const POPULAR_PRODUCTS: LandingProduct[] = [
  { id: "p1", name: "Ankara Midi Dress", price: "₦24,500", store: "Urban Threads", storeInitial: "U", rating: "4.8", icon: "fa-black-tie", tint: "bg-rose-50 text-rose-600", verified: true, trend: "trending" },
  { id: "p2", name: "Smartphone X12 128GB", price: "₦189,000", store: "Nova Gadgets", storeInitial: "N", rating: "4.9", icon: "fa-mobile", tint: "bg-sky-50 text-sky-600", verified: true, trend: "best" },
  { id: "p3", name: "Shea Glow Body Butter", price: "₦8,750", store: "Glow & Co.", storeInitial: "G", rating: "4.7", icon: "fa-magic", tint: "bg-amber-50 text-amber-600", verified: true, trend: "best" },
  { id: "p4", name: "Farm Fresh Basket", price: "₦12,300", store: "Fresh Basket", storeInitial: "F", rating: "4.8", icon: "fa-shopping-basket", tint: "bg-emerald-50 text-emerald-600", trend: "new" },
  { id: "p5", name: "Wireless Earbuds Pro", price: "₦32,500", store: "Nova Gadgets", storeInitial: "N", rating: "4.7", icon: "fa-headphones", tint: "bg-sky-50 text-sky-600", verified: true, trend: "deal", deal: "Save 15%" },
  { id: "p6", name: "Ceramic Dinner Set", price: "₦41,000", store: "HomeHaus", storeInitial: "H", rating: "4.7", icon: "fa-cutlery", tint: "bg-orange-50 text-orange-600", verified: true, trend: "new" },
  { id: "p7", name: "Leather Weekend Bag", price: "₦56,000", store: "Urban Threads", storeInitial: "U", rating: "4.9", icon: "fa-briefcase", tint: "bg-rose-50 text-rose-600", verified: true, trend: "trending" },
  { id: "p8", name: "Herbal Tea Collection", price: "₦6,400", store: "Fresh Basket", storeInitial: "F", rating: "4.8", icon: "fa-coffee", tint: "bg-emerald-50 text-emerald-600", trend: "deal", deal: "Save 10%" },
];

export const STORES: LandingStore[] = [
  { name: "Urban Threads", category: "Fashion", initial: "U", products: "120+ products", rating: "4.8", icon: "fa-black-tie", tint: "bg-rose-100 text-rose-700", featured: "Ankara Midi Dress" },
  { name: "Nova Gadgets", category: "Electronics", initial: "N", products: "85+ products", rating: "4.9", icon: "fa-plug", tint: "bg-sky-100 text-sky-700", featured: "Smartphone X12" },
  { name: "Glow & Co.", category: "Beauty", initial: "G", products: "60+ products", rating: "4.7", icon: "fa-magic", tint: "bg-amber-100 text-amber-700", featured: "Shea Glow Butter" },
  { name: "Fresh Basket", category: "Groceries", initial: "F", products: "200+ products", rating: "4.8", icon: "fa-shopping-basket", tint: "bg-emerald-100 text-emerald-700", featured: "Farm Fresh Basket" },
  { name: "HomeHaus", category: "Home & Living", initial: "H", products: "95+ products", rating: "4.6", icon: "fa-home", tint: "bg-orange-100 text-orange-700", featured: "Rattan Chair" },
  { name: "TechHub", category: "Accessories", initial: "T", products: "140+ products", rating: "4.7", icon: "fa-mobile", tint: "bg-violet-100 text-violet-700", featured: "Earbuds Pro" },
];
