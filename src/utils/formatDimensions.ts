import type { Dimensions } from '../types/matrix';

export function formatDimensions(
  dim: Dimensions | null | undefined,
  unit: 'metric' | 'imperial'
): string | null {
  if (!dim) return null;
  const { width: w, length: l, height: h } = dim;
  if (!w && !l && !h) return null;

  if (unit === 'metric') {
    if (w && l && h) return `${w} × ${l} × ${h} mm`;
    if (w && l) return `${w} × ${l} mm`;
    return `${w || l || h} mm`;
  }

  // Convert mm -> inches (1 in = 25.4 mm)
  const toInches = (val: number) => (val / 25.4).toFixed(1);

  if (w && l && h) return `${toInches(w)}″ × ${toInches(l)}″ × ${toInches(h)}″ (${toInches(w)} x ${toInches(l)} x ${toInches(h)} in)`;
  if (w && l) return `${toInches(w)}″ × ${toInches(l)}″ in`;
  return `${toInches(w || l || h)}″ in`;
}
