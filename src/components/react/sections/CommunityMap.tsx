import { useMemo, useRef } from "react";
import { motion, useInView } from "motion/react";
import { createMap } from "svg-dotted-map";

const AMRAVATI = { name: "Amravati", lat: 20.93, lng: 77.75 };

// Loose scatter of cities anyone could be coming from  not real signup counts,
// just a visual hint that "your city could be next". Shown faintly.
const REACH = [
  { lat: 19.07, lng: 72.87 },
  { lat: 18.52, lng: 73.85 },
  { lat: 28.61, lng: 77.21 },
  { lat: 12.97, lng: 77.59 },
  { lat: 17.39, lng: 78.49 },
  { lat: 13.08, lng: 80.27 },
  { lat: 22.57, lng: 88.36 },
  { lat: 23.02, lng: 72.57 },
  { lat: 26.91, lng: 75.79 },
  { lat: 26.84, lng: 80.94 },
  { lat: 21.14, lng: 79.08 },
  { lat: 25.32, lng: 82.97 },
  { lat: 11.01, lng: 76.95 },
  { lat: 30.73, lng: 76.78 },
];

export function CommunityMap() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const { points, hq, faintMarkers } = useMemo(() => {
    const width = 360;
    const height = 280;
    const map = createMap({
      width,
      height,
      mapSamples: 9000,
      region: {
        lat: { min: 6, max: 36 },
        lng: { min: 67, max: 98 },
      },
    });
    const placedHq = map.addMarkers([
      { lat: AMRAVATI.lat, lng: AMRAVATI.lng, size: 1.6 },
    ])[0];
    const placedFaint = map.addMarkers(
      REACH.map((c) => ({ lat: c.lat, lng: c.lng })),
    );
    return { points: map.points, hq: placedHq, faintMarkers: placedFaint };
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative aspect-[360/280] w-full max-w-3xl mx-auto">
        <svg
          viewBox="0 0 360 280"
          className="w-full h-full text-text-muted/50"
          aria-hidden="true"
        >
          <title>Starting in Amravati. Open to your city next.</title>
          {points.map((p, i) => (
            <motion.circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={0.5}
              fill="currentColor"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 0.6 } : { opacity: 0 }}
              transition={{
                delay: 0.2 + (i % 60) * 0.005,
                duration: 0.4,
              }}
            />
          ))}

          {/* Faint markers: "your city could be next"  subtle, no labels, no counts */}
          {faintMarkers.map((m, i) => (
            <motion.circle
              key={`faint-${i}`}
              cx={m.x}
              cy={m.y}
              r={1.5}
              fill="rgba(252, 211, 77, 0.4)"
              stroke="rgba(252, 211, 77, 0.6)"
              strokeWidth={0.4}
              strokeDasharray="0.8 0.8"
              initial={{ scale: 0, opacity: 0 }}
              animate={
                inView ? { scale: 1, opacity: 0.7 } : { scale: 0, opacity: 0 }
              }
              transition={{
                delay: 0.9 + i * 0.05,
                type: "spring",
                stiffness: 200,
                damping: 18,
              }}
            />
          ))}

          {/* Amravati: the only lit, pulsing marker */}
          <motion.circle
            cx={hq.x}
            cy={hq.y}
            r={12}
            fill="rgba(245, 158, 11, 0.18)"
            initial={{ scale: 0, opacity: 0 }}
            animate={
              inView
                ? {
                    scale: [0, 1.4, 1],
                    opacity: [0, 0.6, 0.4],
                  }
                : { scale: 0, opacity: 0 }
            }
            transition={{
              delay: 1.5,
              duration: 1.6,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 0.4,
            }}
          />
          <motion.circle
            cx={hq.x}
            cy={hq.y}
            r={4}
            fill="#F59E0B"
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : { scale: 0 }}
            transition={{
              delay: 1.4,
              type: "spring",
              stiffness: 220,
              damping: 16,
            }}
          />
        </svg>

        {/* Amravati label */}
        <motion.div
          className="pointer-events-none absolute"
          style={{
            left: `${(hq.x / 360) * 100}%`,
            top: `${(hq.y / 280) * 100}%`,
            transform: "translate(10px, -50%)",
          }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.8 }}
        >
          <div className="rounded-badge border border-accent bg-accent/15 px-2 py-0.5 backdrop-blur-sm">
            <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
              Amravati · live
            </span>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-accent" />
          Where we're starting
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full border border-[#FCD34D] bg-[#FCD34D]/30" />
          Your city, maybe next
        </span>
      </div>
    </div>
  );
}
