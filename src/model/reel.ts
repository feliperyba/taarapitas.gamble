import { Sprite, Application, Container, BlurFilter, Texture } from 'pixi.js';
import { GameLogicService, GameStates } from '../services/game-logic.service';
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

	constructor(private readonly app: Application, private readonly _gameLogicService: GameLogicService) {
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
			() => { this._gameLogicService.state = GameStates.RESULTS; },
			() => this._gameLogicService.debugConfig
		);
	}

	public setContainers(): void {
		this.reelContainer.width = this.REEL_WIDTH / 2 * 5;
		this.reelContainer.height = this.SYMBOL_SIZE / 2 * 10;

		for (let i = 0; i < this.SLOT_NUMBER; i++) {
			const rc = new Container();
			rc.x = i * this.REEL_WIDTH;

			this.reelContainer.addChild(rc);

			const reel: ReelData = {
				container: rc,
				symbols: [],
				symbolsPosition: this.DEFAULT_VAL_ORDER.slice(),
				position: 0,
				previousPosition: 0,
				randomSymbolValue: REEL_VALUES.X3BAR,
				randomPosValue: 0,
				blur: new BlurFilter()
			};

			reel.blur.strengthX = 0;
			reel.blur.strengthY = 0;
			rc.filters = [];

			for (let j = 0; j < this.DEFAULT_VAL_ORDER.length; j++) {
				const symbol = new Sprite(this.slotTextures[this.DEFAULT_VAL_ORDER[j]]);

				symbol.y = j * this.SYMBOL_SIZE;
				symbol.scale.x = symbol.scale.y = Math.min(
					this.SYMBOL_SIZE / symbol.width,
					this.SYMBOL_SIZE / symbol.height
				);
				symbol.x = Math.round((this.SYMBOL_SIZE - symbol.width) / 2);
				reel.symbols.push(symbol);
				rc.addChild(symbol);
			}

			this.reelArr.push(reel);
		}
	}

	public spin(isSkill?: boolean): void {
		this.animator.spin(isSkill);
	}

	public destroy(): void {
		this.animator.destroy();
		for (const reel of this.reelArr) {
			reel.blur.destroy();
		}
		this.reelContainer.destroy({ children: true });
	}

	public arrayRotateOne(arr: REEL_VALUES[], reverse: boolean): void {
		if (reverse) arr.unshift(arr.pop()!);
		else arr.push(arr.shift()!);
	}

	public setGameState(state: GameStates): void {
		this._gameLogicService.stateMachine.transition(state);
	}
}
