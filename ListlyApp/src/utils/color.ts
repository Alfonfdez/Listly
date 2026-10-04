const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function isValidHexColor(color: string): boolean {
  return HEX_COLOR_RE.test(color);
}

export function withAlpha(color: string, alphaPercent: number): string {
  if (!isValidHexColor(color)) return color;
  const clamped = Math.max(0, Math.min(100, alphaPercent));
  const alpha = Math.round((clamped / 100) * 255).toString(16).padStart(2, '0');
  return color + alpha;
}