import { SCENE_LAYOUT } from '../rendering/viewport';
import { createGradientTextStyle } from './pixi-helpers';

export const DEFAULT_TEXT_STYLE = createGradientTextStyle({
	fillStops: ['#ffffff', '#cccccc'],
	fontSize: 48,
	strokeWidth: 5,
	dropShadowColor: '#C86913',
	wordWrap: true,
	wordWrapWidth: 400,
	align: 'center',
});

export const ACTION_LABEL_STYLE = createGradientTextStyle({
	fillStops: ['#fff1c8', '#d6a44d'],
	fontSize: 32,
	strokeWidth: 5,
	dropShadowColor: '#62240e',
	wordWrap: true,
	wordWrapWidth: SCENE_LAYOUT.game.statusWell.width - 44,
	align: 'center',
});

export const ACTION_DETAIL_STYLE = createGradientTextStyle({
	fillStops: ['#fff6db', '#c5a067'],
	fontSize: 18,
	strokeWidth: 4,
	dropShadowColor: '#2d1207',
	wordWrap: true,
	wordWrapWidth: SCENE_LAYOUT.game.statusWell.width - 54,
	align: 'center',
});

export const COLOR_WHITE = 0xffffff;
export const COLOR_BLACK = 0x000000;
