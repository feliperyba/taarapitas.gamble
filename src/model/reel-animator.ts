import { Application, Container, BlurFilter, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import type { DebugConfig } from './interfaces';
import { REEL_VALUES, REEL_POSITIONS, REEL_POSITION_INDEX, type ReelData } from './reel-types';
import { arrayRotateOne } from './math-utils';

const SPIN_BASE_DISTANCE = 10;
const SPIN_DISTANCE_STEP = 5;
const SPIN_EXTRA_MULTIPLIER = 100;
const SPIN_FIRST_REEL_START = 200;
const SPIN_BASE_DURATION = 2000;
const SPIN_DURATION_STEP = 500;
const SPIN_BACKOUT_AMOUNT = 0.4;
const SPIN_BLUR_STRENGTH = 0.85;

export class ReelAnimator {
	private readonly spinBlurFilters: BlurFilter[] = [];
	private tickerFn: ((ticker: { deltaTime: number }) => void) | null = null;
	private spinning = false;

	constructor(
		private readonly app: Application,
		private readonly reelContainer: Container,
		private readonly reelArr: ReelData[],
		private readonly slotTextures: Record<string, Texture>,
		private readonly symbolSize: number,
		private readonly defaultValOrder: readonly REEL_VALUES[],
		private readonly onSpinComplete: () => void,
		private readonly getDebugConfig: () => DebugConfig | undefined
	) {
		for (let i = 0; i < this.reelArr.length; i++) {
			const blur = new BlurFilter();
			blur.strengthX = SPIN_BLUR_STRENGTH;
			blur.strengthY = 0;
			this.spinBlurFilters.push(blur);
		}
		this.setupPositionLoop();
	}

	private setupPositionLoop(): void {
		this.tickerFn = (ticker: { deltaTime: number }) => {
			if (!this.spinning) return;

			for (const reel of this.reelArr) {
				reel.blur.strengthY = (reel.position - reel.previousPosition) * ticker.deltaTime;
				reel.previousPosition = reel.position;

				for (let j = 0; j < reel.symbols.length; j++) {
					const symbol = reel.symbols[j];
					const previousY = symbol.y;
					symbol.y = ((reel.position + j) % reel.symbols.length) * this.symbolSize - this.symbolSize;

					if (symbol.y < 0 && previousY > this.symbolSize) {
						symbol.texture = this.slotTextures[reel.symbolsPosition[j]];

						symbol.scale.x = symbol.scale.y = Math.min(
							this.symbolSize / symbol.texture.width,
							this.symbolSize / symbol.texture.height
						);
						symbol.x = Math.round((this.symbolSize - symbol.width) / 2);
					}
				}
			}
		};
		this.app.ticker.add(this.tickerFn);
	}

	public spin(isSkill?: boolean): void {
		this.spinning = true;
		const debug = this.getDebugConfig();

		for (let i = 0; i < this.reelArr.length; i++) {
			const reel = this.reelArr[i];

			if (debug !== undefined && debug.isFixed === true) {
				const currReel = debug.reels[i];
				for (let j = 0; j < reel.symbols.length; j++) {
					if (reel.symbolsPosition[REEL_POSITION_INDEX[currReel.position.value as REEL_POSITIONS]] === currReel.symbol.value) {
						break;
					}

					arrayRotateOne(reel.symbolsPosition, true);
				}
			} else if (!isSkill) {
				reel.randomPosValue = Math.floor(Math.random() * (this.defaultValOrder.length - 1));
				reel.randomSymbolValue = this.defaultValOrder[Math.floor(Math.random() * (this.defaultValOrder.length - 1))];
				
				for (let j = 0; j < reel.symbols.length; j++) {
					if (reel.symbolsPosition[reel.randomPosValue] === reel.randomSymbolValue) {
						break;
					}

					arrayRotateOne(reel.symbolsPosition, true);
				}
			}

			const blur = this.spinBlurFilters[i];
			this.reelContainer.children[i].filters = [blur];

			const extra = SPIN_EXTRA_MULTIPLIER * i;
			const start = i === 0 ? SPIN_FIRST_REEL_START : 0;
			const targetPosition = reel.position + SPIN_BASE_DISTANCE + i * SPIN_DISTANCE_STEP + extra + start;
			const durationMs = SPIN_BASE_DURATION + i * SPIN_DURATION_STEP + extra;

			gsap.to(reel, {
				position: targetPosition,
				duration: durationMs / 1000,
				ease: `back.out(${SPIN_BACKOUT_AMOUNT})`,
				onComplete: () => {
					this.reelContainer.children[i].filters = [];
					this.reelContainer.filters = [];

					if (i === this.reelArr.length - 1) {
						this.spinning = false;
						this.onSpinComplete();
					}
				}
			});
		}
	}

	public destroy(): void {
		this.spinning = false;

		if (this.tickerFn) {
			this.app.ticker.remove(this.tickerFn);
			this.tickerFn = null;
		}

		for (const reel of this.reelArr) {
			gsap.killTweensOf(reel);
		}

		for (const blur of this.spinBlurFilters) {
			blur.destroy();
		}
		
		this.spinBlurFilters.length = 0;
	}

}
