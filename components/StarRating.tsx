import {
  displayCuisine,
  filledStars,
  michelinStarsFromCuisine,
  restaurantScore,
  type RestaurantRatingInput,
} from "@/lib/restaurantRating";

interface Props {
  restaurant: RestaurantRatingInput;
  className?: string;
  showMichelin?: boolean;
}

export default function StarRating({ restaurant, className = "", showMichelin = true }: Props) {
  const score = restaurantScore(restaurant);
  const filled = filledStars(score);
  const michelin = michelinStarsFromCuisine(restaurant.cuisine);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className="inline-flex text-[12px] leading-none tracking-normal"
        aria-label={`${score.toFixed(1)} out of 5`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < filled ? "text-accent" : "text-white/18"}>
            ★
          </span>
        ))}
      </span>
      <span className="tabular-nums text-[12px] font-medium text-ivory/75">{score.toFixed(1)}</span>
      {showMichelin && michelin > 0 ? (
        <span className="text-[10px] font-medium text-accent/80">
          {michelin} Michelin
        </span>
      ) : null}
    </span>
  );
}

export function cuisineLine(cuisine: string): string {
  return displayCuisine(cuisine);
}
