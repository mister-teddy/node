function Spinner() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg
        className="animate-spin h-8 w-8 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 50 50"
      >
        {/* Apple-style spinner: 12 lines radiating from center */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 30 * (Math.PI / 180);
          const x1 = 25 + Math.sin(angle) * 16;
          const y1 = 25 - Math.cos(angle) * 16;
          const x2 = 25 + Math.sin(angle) * 20;
          const y2 = 25 - Math.cos(angle) * 20;
          // Fade opacity for trailing effect
          const opacity = 0.25 + (i / 12) * 0.75;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              opacity={opacity}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default Spinner;
