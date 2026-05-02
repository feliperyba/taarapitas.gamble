export const GameConfig = {
	CREDIT_COST: 1.0,
	DEFAULT_DMG: 5,
	INITIAL_POTION_PRICE: 25,
	POTION_HEALTH: 10,
	POTION_PRICE_MULTIPLIER: 2,
} as const satisfies Record<string, number>;
