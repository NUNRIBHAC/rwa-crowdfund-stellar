// Decorative editorial artwork. Never a progress scale or campaign data.
export default function EditorialCubes() {
  const tile = (x: number, y: number) => `${x},${y} ${x + 34},${y + 18} ${x},${y + 36} ${x - 34},${y + 18}`;
  const cubes = [
    { x: 250, y: 75, h: 64 },
    { x: 182, y: 147, h: 46 },
    { x: 318, y: 147, h: 64 },
    { x: 114, y: 219, h: 33 },
    { x: 250, y: 219, h: 34 },
    { x: 386, y: 219, h: 35 },
  ];
  return (
    <svg className="editorial-cubes" viewBox="0 0 500 380" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.3">
        {Array.from({ length: 6 }, (_, r) =>
          Array.from({ length: 6 }, (_, c) => {
            const x = 250 + (c - r) * 34,
              y = 130 + (c + r) * 18;
            return <polygon key={`${r}-${c}`} points={tile(x, y)} fill={(r + c) % 4 === 0 ? 'var(--indigo-100, #e6e6ff)' : 'var(--surface, #fff)'} />;
          }),
        )}
      </g>
      {cubes.map(({ x, y, h }, index) => (
        <g
          className="editorial-cube-motion"
          style={{ animationDelay: `${index * -0.35}s` }}
          key={`${x}-${y}`}
          stroke="var(--ink)"
          strokeWidth="0.7"
          strokeLinejoin="round"
        >
          <polygon points={`${x - 34},${y + 18 - h} ${x},${y + 36 - h} ${x},${y + 36} ${x - 34},${y + 18}`} fill="#c7c8f9" />
          <polygon points={`${x},${y + 36 - h} ${x + 34},${y + 18 - h} ${x + 34},${y + 18} ${x},${y + 36}`} fill="#4b4fe2" />
          <polygon points={tile(x, y - h)} fill="#f6f6fe" />
        </g>
      ))}
    </svg>
  );
}
