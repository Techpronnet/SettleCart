/**
 * Vendor workspace context persisted per browser.
 *
 * The backend has no "my stores" listing, so the app remembers the vendor's
 * active business and store IDs after onboarding/creation. Pages use this to
 * resume the workspace and to scope orders, products and categories.
 */

export interface VendorContext {
  businessId: string | null;
  storeId: string | null;
}

const KEY = "settlecart_vendor_context";

function read(): VendorContext {
  if (typeof window === "undefined") return { businessId: null, storeId: null };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { businessId: null, storeId: null };
    const parsed = JSON.parse(raw);
    return {
      businessId: typeof parsed.businessId === "string" ? parsed.businessId : null,
      storeId: typeof parsed.storeId === "string" ? parsed.storeId : null,
    };
  } catch {
    return { businessId: null, storeId: null };
  }
}

function write(ctx: VendorContext): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {
    // ignore quota errors
  }
}

export function getVendorContext(): VendorContext {
  return read();
}

export function setVendorBusiness(businessId: string): VendorContext {
  const next = { ...read(), businessId };
  write(next);
  return next;
}

export function setVendorStore(storeId: string): VendorContext {
  const next = { ...read(), storeId };
  write(next);
  return next;
}

export function clearVendorContext(): void {
  write({ businessId: null, storeId: null });
}
