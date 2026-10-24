import { useEffect, useState } from 'react';

export interface Slide {
  src: string;
  label: string;
}

/** Rotating travel photos: train first (hero.jpg), then the intercity bus. */
export const TRAVEL_SLIDES: Slide[] = [
  { src: '/images/photos/hero.jpg', label: 'Kereta Api Antarkota' },
  { src: '/images/photos/bus.jpg', label: 'Bus Antarkota' },
];

interface Props {
  slides?: Slide[];
  intervalMs?: number;
  showControls?: boolean;
}

/**
 * Full-bleed crossfading photo slideshow. Render inside a `relative`
 * container; it fills the container absolutely. The parent should paint
 * its overlay above the photos (DOM order or z-index) — the label chip
 * and dots use z-10 so they stay visible/clickable above a plain
 * overlay that has no z-index of its own.
 */
export default function PhotoSlideshow({
  slides = TRAVEL_SLIDES,
  intervalMs = 5000,
  showControls = true,
}: Props) {
  const [ix, setIx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setIx((v) => (v + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [paused, slides.length, intervalMs]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt=""
          loading={i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === ix ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {showControls && slides.length > 1 && (
        <>
          <div className="absolute left-4 bottom-4 z-10">
            <span
              key={ix}
              className="inline-block bg-black/45 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm"
            >
              {slides[ix].label}
            </span>
          </div>
          <div className="absolute right-4 bottom-4 z-10 flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                aria-label={`Tampilkan foto ${s.label}`}
                onClick={() => setIx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === ix ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
