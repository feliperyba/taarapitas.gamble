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

export function mixColor(from: number, to: number, amount: number): number {
	const clampedAmount = clamp(amount, 0, 1);
	const fromRgb = hexToRgb(from);
	const toRgb = hexToRgb(to);

	return rgbToHex(
		Math.round(lerp(fromRgb.r, toRgb.r, clampedAmount)),
		Math.round(lerp(fromRgb.g, toRgb.g, clampedAmount)),
		Math.round(lerp(fromRgb.b, toRgb.b, clampedAmount))
	);
}

export function arrayRotateOne<T>(arr: T[], reverse: boolean): void {
	if (arr.length === 0) return;
	if (reverse) {
		const last = arr.pop();
		if (last !== undefined) arr.unshift(last);
	} else {
		const first = arr.shift();
		if (first !== undefined) arr.push(first);
	}
}
