export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;
export const MAX_RENDERER_DPI = 2;

export interface ViewportState {
	designWidth: number;
	designHeight: number;
	actualWidth: number;
	actualHeight: number;
	scale: number;
	offsetX: number;
	offsetY: number;
	contentWidth: number;
	contentHeight: number;
	centerX: number;
	centerY: number;
	left: number;
	right: number;
	top: number;
	bottom: number;
}

export interface LayoutRect {
	x: number;
	y: number;
	width: number;
	height: number;
	right: number;
	bottom: number;
	centerX: number;
	centerY: number;
}

interface PaytableLayoutRect extends LayoutRect {
	rowHeight: number;
	rowGap: number;
	iconSize: number;
	labelFontSize: number;
	valueFontSize: number;
	coinSize: number;
}

interface ReelViewportLayoutRect extends LayoutRect {
	reelScale: number;
	maskRadius: number;
	frameInset: number;
}

export const DESIGN_BOUNDS = {
	width: DESIGN_WIDTH,
	height: DESIGN_HEIGHT,
	centerX: DESIGN_WIDTH / 2,
	centerY: DESIGN_HEIGHT / 2,
	left: 0,
	right: DESIGN_WIDTH,
	top: 0,
	bottom: DESIGN_HEIGHT
};

function createRect(x: number, y: number, width: number, height: number): LayoutRect {
	return {
		x,
		y,
		width,
		height,
		right: x + width,
		bottom: y + height,
		centerX: x + width / 2,
		centerY: y + height / 2
	};
}

function withRectMetrics<T extends object>(rect: LayoutRect, metrics: T): LayoutRect & T {
	return {
		...rect,
		...metrics
	};
}

const SAFE_MARGIN = 48;
const PANEL_RADIUS = 30;

const TOP_HUD_REGION = createRect(64, 28, 1792, 132);
const HERO_CREST_REGION = createRect(-64, -48, 880, 430);
const CREDITS_CLUSTER_REGION = createRect(1482, 54, 340, 86);
const LEFT_RAIL_REGION = createRect(148, 185, 380, 832);
const PAYTABLE_REGION = withRectMetrics(createRect(146, 185, 382, 800), {
	rowHeight: 90,
	rowGap: 4,
	iconSize: 82,
	labelFontSize: 18,
	valueFontSize: 30,
	coinSize: 30
});
const REEL_ALTAR_REGION = createRect(540, 154, 920, 874);
const REEL_VIEWPORT_REGION = withRectMetrics(createRect(580, 206, 840, 788), {
	reelScale: 1.75,
	maskRadius: 18,
	frameInset: 24
});
const RIGHT_RELIQUARY_REGION = createRect(1474, 185, 358, 832);
const SKILL_WELL_REGION = createRect(1500, 232, 306, 180);
const POTION_WELL_REGION = createRect(1500, 440, 306, 150);
const STATUS_WELL_REGION = createRect(1500, 622, 306, 164);
const FIGHT_BUTTON_REGION = createRect(1442, 872, 425, 192);

export const SCENE_LAYOUT = {
	padding: 64,
	centerX: DESIGN_WIDTH / 2,
	centerY: DESIGN_HEIGHT / 2,
	charSelect: {
		top: 14,
		columnGap: 24,
		cardWidth: 420,
		cardHeight: 1052,
		contentInset: 24,
		portraitSize: 398,
		portraitY: 32,
		titleY: 458,
		statPanelY: 520,
		statPanelHeight: 136,
		statIconSize: 106,
		descPanelY: 682,
		descPanelHeight: 198,
		selectButtonWidth: 388,
		selectButtonHeight: 132,
		selectButtonBottom: 24
	},
	game: {
		safeMargin: SAFE_MARGIN,
		panelRadius: PANEL_RADIUS,
		textScaleTargets: {
			hudLabel: 18,
			hudValue: 30,
			paytableLabel: PAYTABLE_REGION.labelFontSize,
			paytableValue: PAYTABLE_REGION.valueFontSize
		},
		topHud: TOP_HUD_REGION,
		heroCrest: HERO_CREST_REGION,
		creditsCluster: CREDITS_CLUSTER_REGION,
		leftRail: LEFT_RAIL_REGION,
		paytable: PAYTABLE_REGION as PaytableLayoutRect,
		reelAltar: REEL_ALTAR_REGION,
		reelViewport: REEL_VIEWPORT_REGION as ReelViewportLayoutRect,
		rightReliquary: RIGHT_RELIQUARY_REGION,
		skillWell: SKILL_WELL_REGION,
		potionWell: POTION_WELL_REGION,
		statusWell: STATUS_WELL_REGION,
		fightButton: FIGHT_BUTTON_REGION
	},
	overlay: {
		width: 760,
		height: 530
	}
} satisfies {
	padding: number;
	centerX: number;
	centerY: number;
	charSelect: {
		top: number;
		columnGap: number;
		cardWidth: number;
		cardHeight: number;
		contentInset: number;
		portraitSize: number;
		portraitY: number;
		titleY: number;
		statPanelY: number;
		statPanelHeight: number;
		statIconSize: number;
		descPanelY: number;
		descPanelHeight: number;
		selectButtonWidth: number;
		selectButtonHeight: number;
		selectButtonBottom: number;
	};
	game: {
		safeMargin: number;
		panelRadius: number;
		textScaleTargets: { hudLabel: number; hudValue: number; paytableLabel: number; paytableValue: number };
		topHud: LayoutRect;
		heroCrest: LayoutRect;
		creditsCluster: LayoutRect;
		leftRail: LayoutRect;
		paytable: PaytableLayoutRect;
		reelAltar: LayoutRect;
		reelViewport: ReelViewportLayoutRect;
		rightReliquary: LayoutRect;
		skillWell: LayoutRect;
		potionWell: LayoutRect;
		statusWell: LayoutRect;
		fightButton: LayoutRect;
	};
	overlay: { width: number; height: number };
};

export function getRendererDpi(devicePixelRatio = window.devicePixelRatio || 1): number {
	return Math.min(Math.max(devicePixelRatio, 1), MAX_RENDERER_DPI);
}

export function computeViewport(actualWidth: number, actualHeight: number): ViewportState {
	const safeWidth = Math.max(Math.floor(actualWidth), 1);
	const safeHeight = Math.max(Math.floor(actualHeight), 1);
	const scale = Math.min(safeWidth / DESIGN_WIDTH, safeHeight / DESIGN_HEIGHT);
	const contentWidth = DESIGN_WIDTH * scale;
	const contentHeight = DESIGN_HEIGHT * scale;

	return {
		designWidth: DESIGN_WIDTH,
		designHeight: DESIGN_HEIGHT,
		actualWidth: safeWidth,
		actualHeight: safeHeight,
		scale,
		offsetX: Math.round((safeWidth - contentWidth) / 2),
		offsetY: Math.round((safeHeight - contentHeight) / 2),
		contentWidth,
		contentHeight,
		centerX: DESIGN_WIDTH / 2,
		centerY: DESIGN_HEIGHT / 2,
		left: 0,
		right: DESIGN_WIDTH,
		top: 0,
		bottom: DESIGN_HEIGHT
	};
}
