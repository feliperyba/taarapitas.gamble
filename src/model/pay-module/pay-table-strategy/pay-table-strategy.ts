import { Reel, REEL_POSITIONS, REEL_VALUES } from '../../../model/reel';
import { Texture } from 'pixi.js';

export enum COMBINATIONS {
	CHERRY_TOP = 2000,
	CHERRY_CENTER = 1000,
	CHERRY_BOTTOM = 4000,
	SEVEN = 150,
	SEVEN_CHERRY = 75,
	X3BAR = 50,
	X2BAR = 20,
	BAR = 10,
	ANY_BAR = 5
}
export namespace PayTableStrategy {
	export interface PayStrategy {
		check(reel: Reel): COMBINATIONS;
	}

	export class PayTableContext {
		constructor(public strategy: PayStrategy, private reel: Reel) {}

		public executeStrategy(): COMBINATIONS {
			return this.strategy.check(this.reel);
		}
	}

	export class CherryTopStrategy implements PayStrategy {
		public payIcon: Texture = PIXI.Loader.shared.resources['../assets/CherryIcon.png'].texture;
		public enumIndex = COMBINATIONS.CHERRY_TOP;
		public combDesc = 'X3 ';
		public desc = 'Top';

		public check(reel: Reel): COMBINATIONS {
			for (let r of reel.reelArr) {
				if (r.symbolsPosition[REEL_POSITIONS.TOP] != REEL_VALUES.CHERRY) {
					return null;
				}
			}
			for (let r of reel.reelArr) {
				r.container.children[REEL_POSITIONS.TOP].tint = 1 * 0xff0000;
			}
			reel.reelWinSlotPos = REEL_POSITIONS.TOP;
			return COMBINATIONS.CHERRY_TOP;
		}
	}

	export class CherryCenterStrategy implements PayStrategy {
		public payIcon: Texture = PIXI.Loader.shared.resources['../assets/CherryIcon.png'].texture;
		public enumIndex = COMBINATIONS.CHERRY_CENTER;
		public combDesc = 'X3 ';
		public desc = 'Center';

		public check(reel: Reel): COMBINATIONS {
			for (let r of reel.reelArr) {
				if (r.symbolsPosition[REEL_POSITIONS.CENTER] != REEL_VALUES.CHERRY) {
					return null;
				}
			}

			for (let r of reel.reelArr) {
				r.container.children[REEL_POSITIONS.CENTER].tint = 1 * 0xff0000;
			}
			reel.reelWinSlotPos = REEL_POSITIONS.CENTER;
			return COMBINATIONS.CHERRY_CENTER;
		}
	}

	export class CherryBottonStrategy implements PayStrategy {
		public payIcon: Texture = PIXI.Loader.shared.resources['../assets/CherryIcon.png'].texture;
		public enumIndex = COMBINATIONS.CHERRY_BOTTOM;
		public combDesc = 'X3 ';
		public desc = 'Botton';

		public check(reel: Reel): COMBINATIONS {
			for (let r of reel.reelArr) {
				if (r.symbolsPosition[REEL_POSITIONS.BOTTOM] != REEL_VALUES.CHERRY) {
					return null;
				}
			}
			for (let r of reel.reelArr) {
				r.container.children[REEL_POSITIONS.BOTTOM].tint = 1 * 0xff0000;
			}
			reel.reelWinSlotPos = REEL_POSITIONS.BOTTOM;
			return COMBINATIONS.CHERRY_BOTTOM;
		}
	}

	export class SevenStrategy implements PayStrategy {
		public payIcon: Texture = PIXI.Loader.shared.resources['../assets/7Icon.png'].texture;
		public enumIndex = COMBINATIONS.SEVEN;
		public combDesc = 'X3 ';
		public desc = 'Any';

		public check(reel: Reel): COMBINATIONS {
			let count = 0;
			// take valid positions to iterate
			const posValues = Object.keys(REEL_POSITIONS)
				.map((k) => REEL_POSITIONS[k])
				.filter((v) => typeof v === 'number') as number[];

			for (let position of posValues) {
				for (let r of reel.reelArr) {
					if (r.symbolsPosition[position] == REEL_VALUES.SEVEN) {
						count++;
					}
				}
				if (count == 3) {
					for (let r of reel.reelArr) {
						r.container.children[position].tint = 1 * 0xff0000;
					}
					reel.reelWinSlotPos = position;
					return COMBINATIONS.SEVEN;
				}
				count = 0;
			}
			return null;
		}
	}

	export class SevenCherryStrategy implements PayStrategy {
		public payIcon: Texture = PIXI.Loader.shared.resources['../assets/CherrySevenIcon.png'].texture;
		public enumIndex = COMBINATIONS.SEVEN_CHERRY;
		public combDesc = 'Any';
		public desc = 'Any';

		public check(reel: Reel): COMBINATIONS {
			let count = 0;
			// take valid positions to iterate
			const posValues = Object.keys(REEL_POSITIONS)
				.map((k) => REEL_POSITIONS[k])
				.filter((v) => typeof v === 'number') as number[];

			for (let position of posValues) {
				for (let r of reel.reelArr) {
					if (
						r.symbolsPosition[position] == REEL_VALUES.SEVEN ||
						r.symbolsPosition[position] == REEL_VALUES.CHERRY
					) {
						count++;
					}
				}
				if (count == 3) {
					for (let r of reel.reelArr) {
						r.container.children[position].tint = 1 * 0xff0000;
					}
					reel.reelWinSlotPos = position;
					return COMBINATIONS.SEVEN_CHERRY;
				}
				count = 0;
			}
			return null;
		}
	}

	export class X3BarStrategy implements PayStrategy {
		public payIcon: Texture = PIXI.Loader.shared.resources['../assets/X3BarIcon.png'].texture;
		public enumIndex = COMBINATIONS.X3BAR;
		public combDesc = 'X3 ';
		public desc = 'Any';

		public check(reel: Reel): COMBINATIONS {
			let count = 0;
			// take valid positions to iterate
			const posValues = Object.keys(REEL_POSITIONS)
				.map((k) => REEL_POSITIONS[k])
				.filter((v) => typeof v === 'number') as number[];

			for (let position of posValues) {
				for (let r of reel.reelArr) {
					if (r.symbolsPosition[position] == REEL_VALUES.X3BAR) {
						count++;
					}
				}
				if (count == 3) {
					for (let r of reel.reelArr) {
						r.container.children[position].tint = 1 * 0xff0000;
					}
					reel.reelWinSlotPos = position;
					return COMBINATIONS.X3BAR;
				}
				count = 0;
			}
			return null;
		}
	}

	export class X2BarStrategy implements PayStrategy {
		public payIcon: Texture = PIXI.Loader.shared.resources['../assets/X2BarIcon.png'].texture;
		public enumIndex = COMBINATIONS.X2BAR;
		public combDesc = 'X3 ';
		public desc = 'Any';

		public check(reel: Reel): COMBINATIONS {
			let count = 0;
			// take valid positions to iterate
			const posValues = Object.keys(REEL_POSITIONS)
				.map((k) => REEL_POSITIONS[k])
				.filter((v) => typeof v === 'number') as number[];

			for (let position of posValues) {
				for (let r of reel.reelArr) {
					if (r.symbolsPosition[position] == REEL_VALUES.X2BAR) {
						count++;
					}
				}
				if (count == 3) {
					for (let r of reel.reelArr) {
						r.container.children[position].tint = 1 * 0xff0000;
					}
					reel.reelWinSlotPos = position;
					return COMBINATIONS.X2BAR;
				}
				count = 0;
			}
			return null;
		}
	}

	export class BarStrategy implements PayStrategy {
		public payIcon: Texture = PIXI.Loader.shared.resources['../assets/BarIcon.png'].texture;
		public enumIndex = COMBINATIONS.BAR;
		public combDesc = 'X3 ';
		public desc = 'Any';

		public check(reel: Reel): COMBINATIONS {
			let count = 0;
			// take valid positions to iterate
			const posValues = Object.keys(REEL_POSITIONS)
				.map((k) => REEL_POSITIONS[k])
				.filter((v) => typeof v === 'number') as number[];

			for (let position of posValues) {
				for (let r of reel.reelArr) {
					if (r.symbolsPosition[position] == REEL_VALUES.BAR) {
						count++;
					}
				}
				if (count == 3) {
					for (let r of reel.reelArr) {
						r.container.children[position].tint = 1 * 0xff0000;
					}
					reel.reelWinSlotPos = position;
					return COMBINATIONS.BAR;
				}
				count = 0;
			}
			return null;
		}
	}

	export class AnyBarStrategy implements PayStrategy {
		public payIcon: Texture = PIXI.Loader.shared.resources['../assets/AnyBarIcon.png'].texture;
		public enumIndex = COMBINATIONS.ANY_BAR;
		public combDesc = 'Any';
		public desc = 'Any';

		public check(reel: Reel): COMBINATIONS {
			let count = 0;
			// take valid positions to iterate
			const posValues = Object.keys(REEL_POSITIONS)
				.map((k) => REEL_POSITIONS[k])
				.filter((v) => typeof v === 'number') as number[];

			for (let position of posValues) {
				for (let r of reel.reelArr) {
					if (
						r.symbolsPosition[position] == REEL_VALUES.BAR ||
						r.symbolsPosition[position] == REEL_VALUES.X2BAR ||
						r.symbolsPosition[position] == REEL_VALUES.X3BAR
					) {
						count++;
					}
				}
				if (count == 3) {
					for (let r of reel.reelArr) {
						r.container.children[position].tint = 1 * 0xff0000;
					}
					reel.reelWinSlotPos = position;
					return COMBINATIONS.ANY_BAR;
				}
				count = 0;
			}
			return null;
		}
	}
}
