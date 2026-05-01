import { Sprite, Application, Texture, Container, BlurFilter } from 'pixi.js';
import { GameLogicService, GameStates } from '../services/game-logic.service';
import { getTexture } from '../rendering/assets';

export enum REEL_POSITIONS {
	TOP = 1,
	CENTER = 2,
	BOTTOM = 3
}
export enum REEL_VALUES {
	X3BAR,
	BAR,
	X2BAR,
	SEVEN,
	CHERRY
}

export class Reel {
	public SLOT_NUMBER = 3;
	public REEL_WIDTH = 160;
	public SYMBOL_SIZE = 150;
	public DEFAULT_VAL_ORDER = [
		REEL_VALUES.X3BAR,
		REEL_VALUES.BAR,
		REEL_VALUES.X2BAR,
		REEL_VALUES.SEVEN,
		REEL_VALUES.CHERRY
	];

	public reelContainer: Container = new Container();
	public reelArr = [];
	public reelWinSlotPos: any;
	private slotTextures = [];
	private tweening = [];

	constructor(private app: Application, private _gameLogicService: GameLogicService) {
		this.slotTextures = [
			getTexture('assets/3xBAR.png'),
			getTexture('assets/BAR.png'),
			getTexture('assets/2xBAR.png'),
			getTexture('assets/7.png'),
			getTexture('assets/Cherry.png')
		];
		this.setContainers();
		this.setAnimations(this.app);
	}

	public setContainers() {
		this.reelContainer.width = this.REEL_WIDTH / 2 * 5;
		this.reelContainer.height = this.SYMBOL_SIZE / 2 * 10;

		for (let i = 0; i < this.SLOT_NUMBER; i++) {
			const rc = new Container();
			rc.x = i * this.REEL_WIDTH;

			this.reelContainer.addChild(rc);

			const reel = {
				container: rc,
				symbols: [],
				symbolsPosition: [],
				position: 0,
				previousPosition: 0,
				randomSymbolValue: 0,
				randomPosValue: 0,
				blur: new BlurFilter()
			};

			reel.blur.blurX = 0;
			reel.blur.blurY = 0;
			rc.filters = [];

			for (let j = 0; j < this.slotTextures.length; j++) {
				const symbol = new Sprite(this.slotTextures[j]);

				symbol.y = j * this.SYMBOL_SIZE;
				symbol.scale.x = symbol.scale.y = Math.min(
					this.SYMBOL_SIZE / symbol.width,
					this.SYMBOL_SIZE / symbol.height
				);
				symbol.x = Math.round((this.SYMBOL_SIZE - symbol.width) / 2);
				reel.symbols.push(symbol);
				rc.addChild(symbol);
			}

			reel.symbolsPosition = this.DEFAULT_VAL_ORDER.slice();
			this.reelArr.push(reel);
		}
	}

	public setAnimations(app: any) {
		app.ticker.add((ticker) => {
			for (let i = 0; i < this.reelArr.length; i++) {
				let r = this.reelArr[i];

				r.blur.blurY = (r.position - r.previousPosition) * ticker.deltaTime;
				r.previousPosition = r.position;

				for (let j = 0; j < r.symbols.length; j++) {
					r.previousPosition = r.position;
					let s = r.symbols[j];
					let prevy = s.y;
					s.y = ((r.position + j) % r.symbols.length) * this.SYMBOL_SIZE - this.SYMBOL_SIZE;

					if (s.y < 0 && prevy > this.SYMBOL_SIZE) {
						s.texture = this.slotTextures[r.symbolsPosition[j]];

						s.scale.x = s.scale.y = Math.min(
							this.SYMBOL_SIZE / s.texture.width,
							this.SYMBOL_SIZE / s.texture.height
						);
						s.x = Math.round((this.SYMBOL_SIZE - s.width) / 2);
					}
				}
			}
		});

		app.ticker.add(() => {
			let now = Date.now();
			let remove = [];
			for (let i = 0; i < this.tweening.length; i++) {
				let t = this.tweening[i];
				let phase = Math.min(1, (now - t.start) / t.time);

				t.object[t.property] = this.lerp(t.propertyBeginValue, t.target, t.easing(phase));
				if (t.change) t.change(t);
				if (phase == 1) {
					t.object[t.property] = t.target;
					if (t.complete) t.complete(t);
					remove.push(t);
				}
			}
			for (let i = 0; i < remove.length; i++) {
				this.tweening.splice(this.tweening.indexOf(remove[i]), 1);
			}
		});
	}

	public spin(isSkill?: boolean) {
		for (let i = 0; i < this.reelArr.length; i++) {
			let r = this.reelArr[i];
			if (this._gameLogicService.debugConfig != undefined && this._gameLogicService.debugConfig.isFixed == true) {
				const currReel = this._gameLogicService.debugConfig.reels[i];

				for (let j = 0; j < r.symbols.length; j++) {
					if (r.symbolsPosition[currReel.position.value] == currReel.symbol.value) {
						break;
					}
					this.arrayRotateOne(r.symbolsPosition, true);
				}
			} else if (!isSkill) {
				r.randomPosValue = Math.floor(Math.random() * (this.slotTextures.length - 1));
				r.randomSymbolValue = Math.floor(Math.random() * (this.slotTextures.length - 1));

				for (let j = 0; j < r.symbols.length; j++) {
					if (r.symbolsPosition[r.randomPosValue] == r.randomSymbolValue) {
						break;
					}
					this.arrayRotateOne(r.symbolsPosition, true);
				}
			}
			const blur = new BlurFilter();
			blur.blurX = 0.85;
			blur.blurY = 0;
			this.reelContainer.children[i].filters = [ blur ];

			let extra = 100 * i;
			let start = 0;
			if (i == 0) {
				start = 200;
			} else {
				start = 0;
			}

			this.tweenTo(
				r,
				'position',
				r.position + 10 + i * 5 + extra + start,
				2000 + i * 500 + extra,
				this.backout(0.4),
				null,
				i == this.reelArr.length - 1
					? () => {
							this.reelContainer.children[i].filters = [];
							this.reelContainer.filters = [];
							this._gameLogicService.state = GameStates.RESULTS;
						}
					: () => {
							this.reelContainer.children[i].filters = [];
							this.reelContainer.filters = [];
						}
			);
		}
	}

	public backout = function(amount) {
		return function(t) {
			return --t * t * ((amount + 1) * t + amount) + 1;
		};
	};

	public lerp(a1, a2, t) {
		return a1 * (1 - t) + a2 * t;
	}

	public tweenTo(object, property, target, time, easing, onchange, oncomplete) {
		const tween = {
			object: object,
			property: property,
			propertyBeginValue: object[property],
			target: target,
			easing: easing,
			time: time,
			change: onchange,
			complete: oncomplete,
			start: Date.now()
		};

		this.tweening.push(tween);
		return tween;
	}

	public arrayRotateOne(arr, reverse) {
		if (reverse) arr.unshift(arr.pop());
		else arr.push(arr.shift());
		return arr;
	}
	public hex2rgb(hex) {
		return [ ((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255 ];
	}
}
