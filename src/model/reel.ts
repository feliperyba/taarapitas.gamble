import { Sprite, Application, Container, Texture } from 'pixi.js';
import { GameStates } from './game-states';
import type { DebugConfig } from './interfaces';
import { getTexture } from '../rendering/assets';
import { ReelAnimator } from './reel-animator';
import { REEL_VALUES, type ReelData } from './reel-types';


export { REEL_POSITIONS, REEL_VALUES, REEL_POSITION_INDEX } from './reel-types';
export type { ReelData } from './reel-types';

export class Reel {
	public readonly SLOT_NUMBER = 3;
	public readonly REEL_WIDTH = 160;
	public readonly SYMBOL_SIZE = 150;
	public readonly DEFAULT_VAL_ORDER: readonly REEL_VALUES[] = [
		REEL_VALUES.X3BAR,
		REEL_VALUES.BAR,
		REEL_VALUES.X2BAR,
		REEL_VALUES.SEVEN,
		REEL_VALUES.CHERRY
	];

	public readonly reelContainer: Container = new Container();
	public readonly reelArr: ReelData[] = [];
	public reelWinSlotPos: number | undefined = undefined;
	private readonly slotTextures: Record<string, Texture> = {};
	private readonly animator: ReelAnimator;

	constructor(
		private readonly app: Application,
		private readonly onSpinComplete: () => void,
		private readonly getDebugConfig: () => DebugConfig | undefined,
		private readonly onStateTransition?: (state: GameStates) => void
	) {
		this.slotTextures = {
			[REEL_VALUES.X3BAR]: getTexture('assets/3xBAR.png'),
			[REEL_VALUES.BAR]: getTexture('assets/BAR.png'),
			[REEL_VALUES.X2BAR]: getTexture('assets/2xBAR.png'),
			[REEL_VALUES.SEVEN]: getTexture('assets/7.png'),
			[REEL_VALUES.CHERRY]: getTexture('assets/Cherry.png')
		};

		this.setContainers();

		this.animator = new ReelAnimator(
			this.app,
			this.reelContainer,
			this.reelArr,
			this.slotTextures,
			this.SYMBOL_SIZE,
			this.DEFAULT_VAL_ORDER,
			this.onSpinComplete,
			this.getDebugConfig
		);
	}

	public setContainers(): void {
		this.reelContainer.width = this.REEL_WIDTH / 2 * 5;
		this.reelContainer.height = this.SYMBOL_SIZE / 2 * 10;

		for (let i = 0; i < this.SLOT_NUMBER; i++) {
			const reelContainer = new Container();
			reelContainer.x = i * this.REEL_WIDTH;

			this.reelContainer.addChild(reelContainer);

			const reel: ReelData = {
				container: reelContainer,
				symbols: [],
				symbolsPosition: this.DEFAULT_VAL_ORDER.slice(),
				position: 0,
				previousPosition: 0,
				randomSymbolValue: REEL_VALUES.X3BAR,
				randomPosValue: 0,
				blur: { strengthX: 0, strengthY: 0 }
			};

			for (let j = 0; j < this.DEFAULT_VAL_ORDER.length; j++) {
				const symbol = new Sprite(this.slotTextures[this.DEFAULT_VAL_ORDER[j]]);

				symbol.y = j * this.SYMBOL_SIZE;
				symbol.scale.x = symbol.scale.y = Math.min(
					this.SYMBOL_SIZE / symbol.width,
					this.SYMBOL_SIZE / symbol.height
				);

				symbol.x = Math.round((this.SYMBOL_SIZE - symbol.width) / 2);
				reel.symbols.push(symbol);
				
				reelContainer.addChild(symbol);
			}

			this.reelArr.push(reel);
		}
	}

	public spin(isSkill?: boolean): void {
		this.animator.spin(isSkill);
	}

	public destroy(): void {
		this.animator.destroy();
		this.reelContainer.destroy({ children: true });
	}

	public setGameState(state: GameStates): void {
		this.onStateTransition?.(state);
	}
}
