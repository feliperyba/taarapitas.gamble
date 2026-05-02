import { Graphics } from 'pixi.js';

export interface PanelLayer {
	x: number;
	y: number;
	width: number;
	height: number;
	radius: number;
	fillColor?: number;
	fillAlpha?: number;
	strokeColor?: number;
	strokeAlpha?: number;
	strokeWidth?: number;
}

export function drawLayeredPanel(layers: PanelLayer[]): Graphics {
	const g = new Graphics();
	for (const l of layers) {
		g.roundRect(l.x, l.y, l.width, l.height, l.radius);
		if (l.fillColor != null) {
			g.fill({ color: l.fillColor, alpha: l.fillAlpha ?? 1 });
		}
		if (l.strokeColor != null) {
			g.stroke({ color: l.strokeColor, alpha: l.strokeAlpha ?? 1, width: l.strokeWidth ?? 1 });
		}
	}
	return g;
}
