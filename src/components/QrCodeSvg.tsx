import React from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({ value, size = 84 }) => {
  const grid = 21;
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const isFinder = (r: number, c: number) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= grid - 7;
    const inBottomLeft = r >= grid - 7 && c < 7;
    if (!inTopLeft && !inTopRight && !inBottomLeft) return null;

    const lr = r < 7 ? r : r - (grid - 7);
    const lc = c < 7 ? c : c - (grid - 7);
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  };

  const cells: React.ReactElement[] = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const finder = isFinder(r, c);
      let dark = false;
      if (finder !== null) {
        dark = finder;
      } else if (r === 6 || c === 6) {
        dark = (r + c) % 2 === 0;
      } else {
        const seed = Math.imul(hash ^ (r * 31 + c * 17), 2654435761) >>> 0;
        dark = (seed & 3) === 0 || ((r * 7 + c * 13 + value.length) % 5 === 0 && (seed & 1) === 1);
      }
      if (dark) {
        cells.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0F294A" />);
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid} ${grid}`}
      className="bg-white p-1 border border-slate-300 shrink-0"
      role="img"
      aria-label={`QR Validasi ${value}`}
    >
      <rect width={grid} height={grid} fill="#ffffff" />
      {cells}
    </svg>
  );
};
