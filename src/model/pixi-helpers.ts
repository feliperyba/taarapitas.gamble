import { Text, TextStyle, FillGradient } from 'pixi.js';

export interface GradientTextStyleOptions {
	fillStops: [string, string];
	fontSize: number;
	strokeColor?: string;
	strokeWidth?: number;
	dropShadowColor?: string;
	dropShadowBlur?: number;
	dropShadowAngle?: number;
	dropShadowDistance?: number;
	wordWrap?: boolean;
	wordWrapWidth?: number;
	align?: 'left' | 'center' | 'right' | 'justify';
	letterSpacing?: number;
}

export function createGradientTextStyle(opts: GradientTextStyleOptions): TextStyle {
	const gradient = new FillGradient({
		start: { x: 0, y: 0 },
		end: { x: 0, y: 1 },
		textureSpace: 'local',
	});
	gradient.addColorStop(0, opts.fillStops[0]).addColorStop(1, opts.fillStops[1]);

	return new TextStyle({
		fontFamily: 'Primitive',
		fontStyle: 'normal',
		fontWeight: 'bold',
		fontSize: opts.fontSize,
		fill: gradient,
		stroke: { color: opts.strokeColor ?? '#000', width: opts.strokeWidth ?? 4 },
		dropShadow: {
			color: opts.dropShadowColor ?? '#2d1207',
			blur: opts.dropShadowBlur ?? 0,
			angle: opts.dropShadowAngle ?? Math.PI / 6,
			distance: opts.dropShadowDistance ?? 0,
		},
		...(opts.wordWrap != null && { wordWrap: opts.wordWrap }),
		...(opts.wordWrapWidth != null && { wordWrapWidth: opts.wordWrapWidth }),
		...(opts.align != null && { align: opts.align }),
		...(opts.letterSpacing != null && { letterSpacing: opts.letterSpacing }),
	});
}

export interface CreateTextOptions {
	text: string;
	style: TextStyle;
	anchorX?: number;
	anchorY?: number;
	x?: number;
	y?: number;
}

export function createText(opts: CreateTextOptions): Text {
	const text = new Text({ text: opts.text, style: opts.style });
	if (opts.anchorX != null || opts.anchorY != null) {
		text.anchor.set(opts.anchorX ?? 0, opts.anchorY ?? 0);
	}
	if (opts.x != null) text.x = opts.x;
	if (opts.y != null) text.y = opts.y;
	return text;
}
