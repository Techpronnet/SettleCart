"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addReview, averageRating, loadReviews, reviewsForProduct, reviewsForStore, type LocalReview } from "@/lib/reviews";

export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onClick={() => onChange(n)}
          className="p-1 min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <Star
            className={`w-6 h-6 ${n <= value ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
        />
      ))}
    </span>
  );
}

export function ReviewForm({
  orderId,
  orderNumber,
  productId,
  productName,
  store,
  onDone,
}: {
  orderId: string;
  orderNumber: string;
  productId: string | null;
  productName: string;
  store: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Write a few words about your experience.");
      return;
    }
    addReview({ orderId, orderNumber, productId, productName, store, rating, text: text.trim() });
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
      <StarInput value={rating} onChange={setRating} />
      <div>
        <label htmlFor={`review-${orderId}`} className="block text-sm font-medium text-stone-800 mb-1.5">
          Your review
        </label>
        <textarea
          id={`review-${orderId}`}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Quality, delivery, packaging…"
          className="w-full rounded-md border border-stone-300 bg-white px-3.5 py-2.5 text-sm min-h-[88px] focus-visible:outline-2 focus-visible:outline-stone-900"
        />
      </div>
      <div>
        <Button type="submit">Submit review</Button>
      </div>
    </form>
  );
}

export function ReviewList({ reviews }: { reviews: LocalReview[] }) {
  if (reviews.length === 0) return null;
  const avg = averageRating(reviews);
  return (
    <div>
      {avg !== null && (
        <p className="flex items-center gap-2 text-sm text-stone-600">
          <ReviewStars rating={avg} />
          <span className="font-semibold text-stone-900">{avg.toFixed(1)}</span>
          <span>({reviews.length} review{reviews.length === 1 ? "" : "s"})</span>
        </p>
      )}
      <ul className="mt-3 space-y-2.5">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border border-stone-100 p-3">
            <ReviewStars rating={r.rating} />
            <p className="mt-1 text-sm text-stone-700">{r.text}</p>
            <p className="mt-1 text-xs text-stone-400">
              Verified order {r.orderNumber}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OrderReviewCard({
  orderId,
  orderNumber,
  productId,
  productName,
  store,
}: {
  orderId: string;
  orderNumber: string;
  productId: string | null;
  productName: string;
  store: string;
}) {
  const [mine, setMine] = useState<LocalReview[]>([]);
  const [ready, setReady] = useState(false);

  function refresh() {
    setMine(loadReviews().filter((r) => r.orderId === orderId));
  }

  useEffect(() => {
    // Client-only review lookup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMine(loadReviews().filter((r) => r.orderId === orderId));
    setReady(true);
  }, [orderId]);

  if (!ready) return null;

  if (mine.length > 0) {
    return (
      <Card title="Your review">
        <ReviewList reviews={mine} />
      </Card>
    );
  }

  return (
    <Card title="Review this order">
      <p className="mb-3 text-sm text-stone-600">
        Delivered via order {orderNumber}. Your review helps other shoppers.
      </p>
      <ReviewForm
        orderId={orderId}
        orderNumber={orderNumber}
        productId={productId}
        productName={productName}
        store={store}
        onDone={refresh}
      />
    </Card>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<LocalReview[] | null>(null);

  useEffect(() => {
    // Client-only review lookup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReviews(reviewsForProduct(productId));
  }, [productId]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <Card title="Customer reviews">
      <ReviewList reviews={reviews} />
    </Card>
  );
}

export function StoreReviews({ storeName }: { storeName: string }) {
  const [reviews, setReviews] = useState<LocalReview[] | null>(null);

  useEffect(() => {
    // Client-only review lookup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReviews(reviewsForStore(storeName));
  }, [storeName]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <Card title="Customer reviews">
      <ReviewList reviews={reviews} />
    </Card>
  );
}
