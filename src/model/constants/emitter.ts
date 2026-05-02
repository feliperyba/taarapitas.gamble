export const HEAL_ALTAR_EMITTER = {
	LIFETIME: { min: 1.4, max: 2.2 },
	FREQUENCY: 0.04,
	PARTICLES_PER_WAVE: 4,
	EMITTER_LIFETIME: 0.74,
	MAX_PARTICLES: 78,
	POS_Y_OFFSET: 24,
	ALPHA_CURVE: [
		{ value: 0.96, time: 0 },
		{ value: 0.84, time: 0.18 },
		{ value: 0.42, time: 0.7 },
		{ value: 0, time: 1 }
	],
	SCALE_CURVE: [
		{ value: 0.82, time: 0 },
		{ value: 1.9, time: 0.34 },
		{ value: 0.28, time: 1 }
	],
	COLOR_CURVE: [
		{ value: '#ff79d2', time: 0 },
		{ value: '#ffc3f2', time: 0.55 },
		{ value: '#ffe8ff', time: 1 }
	],
	SPEED_BASE: 62,
	SPEED_TAIL: 10,
	SPAWN_RADIUS_BASE: 122,
	SPAWN_INNER_RADIUS: 34,
	ROTATION: { min: 0, max: 360 },
} as const;

export const HEAL_SPARK_EMITTER = {
	LIFETIME: { min: 0.95, max: 1.5 },
	FREQUENCY: 0.024,
	PARTICLES_PER_WAVE: 5,
	EMITTER_LIFETIME: 0.62,
	MAX_PARTICLES: 88,
	POS_Y_OFFSET: 42,
	ALPHA_CURVE: [
		{ value: 0.85, time: 0 },
		{ value: 0.56, time: 0.46 },
		{ value: 0, time: 1 }
	],
	SCALE_CURVE: [
		{ value: 0.38, time: 0 },
		{ value: 0.96, time: 0.48 },
		{ value: 0.12, time: 1 }
	],
	COLOR_CURVE: [
		{ value: '#ff7dda', time: 0 },
		{ value: '#ffc6f3', time: 0.5 },
		{ value: '#fff4ff', time: 1 }
	],
	SPEED_BASE: 74,
	SPEED_TAIL: 14,
	ROTATION: { min: 250, max: 290 },
	SPAWN_RECT: { x: -64, y: -28, w: 128, h: 72 },
} as const;

export const HEAL_LIFEBAR_EMITTER = {
	LIFETIME: { min: 1.08, max: 1.72 },
	FREQUENCY: 0.032,
	PARTICLES_PER_WAVE: 4,
	EMITTER_LIFETIME: 0.62,
	MAX_PARTICLES: 68,
	ALPHA_CURVE: [
		{ value: 0.94, time: 0 },
		{ value: 0.72, time: 0.36 },
		{ value: 0, time: 1 }
	],
	SCALE_CURVE: [
		{ value: 0.54, time: 0 },
		{ value: 1.08, time: 0.42 },
		{ value: 0.16, time: 1 }
	],
	COLOR_CURVE: [
		{ value: '#ff8edd', time: 0 },
		{ value: '#ffd7f7', time: 1 }
	],
	SPEED_BASE: 34,
	SPEED_TAIL: 8,
	ROTATION: { min: 258, max: 282 },
	MIN_ACTIVE_BAR_WIDTH: 64,
	BAR_WIDTH_PADDING: 20,
} as const;
