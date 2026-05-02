export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
	return start * (1 - t) + end * t;
}

export function hexToRgb(hex: number): { r: number; g: number; b: number } {
	return {
		r: (hex >> 16) & 0xff,
		g: (hex >> 8) & 0xff,
		b: hex & 0xff
	};
}

export function rgbToHex(r: number, g: number, b: number): number {
	return (r << 16) | (g << 8) | b;
}
