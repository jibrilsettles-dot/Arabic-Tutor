function starPath(c: number, r: number) {
  const s = r * Math.SQRT1_2;
  return `M${c - s},${c - s} L${c + s},${c - s} L${c + s},${c + s} L${c - s},${c + s} Z`;
}

/** The app mark: a gold eight-pointed star on emerald. */
export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  const d = starPath(50, 31);
  const inner = starPath(50, 22.3);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#12705c" />
          <stop offset="1" stopColor="#0a4236" />
        </linearGradient>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ecd08f" />
          <stop offset="1" stopColor="#c29346" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="url(#logo-bg)" />
      <path d={d} fill="url(#logo-gold)" />
      <path d={d} fill="url(#logo-gold)" transform="rotate(45 50 50)" />
      <path d={inner} fill="#0c5245" />
      <path d={inner} fill="#0c5245" transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="6.2" fill="url(#logo-gold)" />
    </svg>
  );
}

/** Just the star, for decoration. */
export function Star({ size = 24, className = "" }: { size?: number; className?: string }) {
  const d = starPath(50, 44);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={d} fill="currentColor" />
      <path d={d} fill="currentColor" transform="rotate(45 50 50)" />
    </svg>
  );
}
