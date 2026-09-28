import Link from "next/link";
import { Star, BadgeCheck } from "lucide-react";
import { AddToCartButton, WishlistButton } from "../ui/Dialog";
import { priceStringToNaira } from "@/lib/format";
import type { LandingProduct } from "./data";

export function ProductVisual({ product, size = "md" }: { product: LandingProduct; size?: "sm" | "md" | "lg" }) {
  const h = size === "lg" ? "h-44 sm:h-52" : size === "sm" ? "h-28" : "h-36 sm:h-40";
  if (product.image) {
    return (
      <div className={`relative ${h} rounded-xl overflow-hidden bg-stone-100 group-hover:scale-[1.02] transition-transform duration-300`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        {product.deal && (
          <span className="absolute top-2 left-2 rounded-full bg-brand-600 text-white text-[10px] font-semibold px-2 py-0.5">
            {product.deal}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={`relative ${h} rounded-xl ${product.tint} flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform duration-300`}>
      <i className={`fa ${product.icon} text-4xl sm:text-5xl opacity-80`} aria-hidden="true" />
      {product.deal && (
        <span className="absolute top-2 left-2 rounded-full bg-brand-600 text-white text-[10px] font-semibold px-2 py-0.5">
          {product.deal}
        </span>
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: LandingProduct }) {
  return (
    <article className="group rounded-2xl border border-sand-border bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300 motion-reduce:transform-none motion-reduce:transition-none">
      <div className="relative">
        <ProductVisual product={product} />
        <WishlistButton
          product={{
            id: product.id,
            name: product.name,
            priceNaira: priceStringToNaira(product.price),
            store: product.store,
            storeInitial: product.storeInitial,
            icon: product.icon,
            tint: product.tint,
          }}
        />
      </div>
      <div className="px-1 pt-3 pb-1">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
            {product.storeInitial}
          </span>
          <span className="truncate font-medium">{product.store}</span>
          {product.verified && (
            <span className="inline-flex items-center gap-0.5 text-forest-700 shrink-0" title="Verified store">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span className="sr-only">Verified store</span>
            </span>
          )}
        </div>
        <h3 className="mt-1.5 text-sm font-semibold text-stone-900 leading-snug line-clamp-1">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">
          <Star className="w-3.5 h-3.5 fill-star text-star" />
          <span className="font-medium text-stone-700">{product.rating}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-stone-900">{product.price}</span>
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              priceNaira: priceStringToNaira(product.price),
              store: product.store,
              storeInitial: product.storeInitial,
              icon: product.icon,
              tint: product.tint,
              backendId: product.backendId ?? null,
              storeId: product.storeId ?? null,
            }}
          />
        </div>
      </div>
    </article>
  );
}

export function HeroProductCard({ product, className = "", delay = 0 }: { product: LandingProduct; className?: string; delay?: number }) {
  return (
    <article
      data-aos="fade-up"
      data-aos-delay={delay}
      className={`rounded-2xl border border-stone-200/80 bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 animate-float ${className}`}
    >
      <ProductVisual product={product} size="sm" />
      <h3 className="mt-2 text-[13px] font-semibold text-stone-900 leading-snug line-clamp-1">{product.name}</h3>
      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-500">
        <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[9px] font-semibold flex items-center justify-center">{product.storeInitial}</span>
        <span className="truncate">{product.store}</span>
        <span className="ml-auto font-bold text-stone-900 text-xs">{product.price}</span>
      </div>
    </article>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  align?: "center" | "left";
}) {
  const alignCls = align === "center" ? "text-center mx-auto items-center" : "text-left items-start";
  return (
    <div className={`max-w-2xl flex flex-col ${alignCls}`} data-aos="fade-up">
      {eyebrow && (
        <span className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-forest-950 text-balance">
        {title}
      </h2>
      {copy && <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">{copy}</p>}
    </div>
  );
}

export function CtaRow({ primary, secondary }: { primary: { label: string; href: string }; secondary?: { label: string; href: string } }) {
  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
      <Link
        href={primary.href}
        className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm min-h-[48px] transition-colors"
      >
        {primary.label}
      </Link>
      {secondary && (
        <Link
          href={secondary.href}
          className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[48px] transition-colors"
        >
          {secondary.label}
        </Link>
      )}
    </div>
  );
}
