import { Text, TextStyle, FillGradient, Graphics } from 'pixi.js';
import { COLOR_PANEL_BG, COLOR_PANEL_BORDER, COLOR_PANEL_INNER_BG, COLOR_PANEL_INNER_BORDER, COLOR_PANEL_TRIM } from './constants/panel';

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

export function fitTextToWidth(text: Text, maxWidth: number, minScale: number): void {
	text.scale.set(1);
	if (text.width > maxWidth) {
		const nextScale = Math.max(minScale, maxWidth / text.width);
		text.scale.set(nextScale);
	}
}

export interface PanelLayout {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function createPanelTitleStyle(): TextStyle {
	return createGradientTextStyle({
		fillStops: ['#fff5cf', '#c18f40'],
		fontSize: 20,
		strokeWidth: 3,
		letterSpacing: 1
	});
}

export function createPanelNoteStyle(wordWrapWidth: number): TextStyle {
	return createGradientTextStyle({
		fillStops: ['#fef4dc', '#be9860'],
		fontSize: 18,
		strokeWidth: 3,
		wordWrap: true,
		wordWrapWidth
	});
}

export function buildPanelGraphics(panel: Graphics, trim: Graphics, layout: PanelLayout): void {
	panel
		.roundRect(layout.x, layout.y, layout.width, layout.height, 24)
		.fill({ color: COLOR_PANEL_BG, alpha: 0.88 })
		.stroke({ color: COLOR_PANEL_BORDER, alpha: 0.24, width: 3 });
	panel
		.roundRect(layout.x + 10, layout.y + 10, layout.width - 20, layout.height - 20, 20)
		.fill({ color: COLOR_PANEL_INNER_BG, alpha: 0.72 })
		.stroke({ color: COLOR_PANEL_INNER_BORDER, alpha: 0.1, width: 2 });
	trim
		.roundRect(layout.x + 16, layout.y + 14, layout.width - 32, 16, 8)
		.fill({ color: COLOR_PANEL_TRIM, alpha: 0.06 });
}
