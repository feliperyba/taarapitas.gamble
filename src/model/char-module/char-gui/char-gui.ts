import { Container, TextStyle, Text, Sprite, Application } from 'pixi.js';
import { GameLogicService } from '../../../services/game-logic.service';
import { Char } from '../char';
import { Reel } from '../../reel';
import { HeroCrest } from './hero-crest';
import { LifeBar } from './life-bar';
import { CreditsDisplay } from './credits-display';
import { SkillPanel } from './skill-panel';
import { PotionPanel } from './potion-panel';
import { ScreenEffects } from './screen-effects';

const SKILL_CHARGE_MAX = 3;

export class CharGUI {
	public readonly charRegionGraphics = new Container();
	public creditsText: Text = new Text({ text: '' });
	public lifeText: Text = new Text({ text: '' });
	public lifeBar!: Sprite;

	private readonly heroCrest = new HeroCrest();
	private readonly lifeBarComp = new LifeBar();
	private readonly creditsDisplay = new CreditsDisplay();
	private readonly skillPanel = new SkillPanel();
	private readonly potionPanel = new PotionPanel();
	private readonly screenEffects = new ScreenEffects();

	private previousLife = 0;
	private previousSpecialBar = 0;
	private previousUsingSkill = false;
	private dirty = true;
	private tickerCallback: ((ticker: { deltaMS: number }) => void) | null = null;

	constructor(
		public readonly app: Application,
		public readonly char: Char,
		public readonly _gameLogicService: GameLogicService,
		public readonly style: TextStyle,
		public readonly reel: Reel
	) {}

	public setup(): Container {
		this.heroCrest.setup(this.char);
		this.lifeBarComp.setup(this.heroCrest.container, this.heroCrest.portraitCenterX, this.heroCrest.portraitCenterY, this.char);
		this.screenEffects.setup(this.app, this.heroCrest.container, this.heroCrest.frame, this.heroCrest.frameFlash, this.lifeBarComp.hitBar);

		this.charRegionGraphics.addChild(this.heroCrest.container);

		this.creditsDisplay.setup(this.charRegionGraphics, this.char, this.style);
		this.creditsText = this.creditsDisplay.creditsText;

		this.skillPanel.setup(this.charRegionGraphics, this.char, this._gameLogicService, this.reel);
		this.potionPanel.setup(this.charRegionGraphics, this.char, this._gameLogicService);

		this.lifeText = this.lifeBarComp.lifeText;
		this.lifeBar = this.lifeBarComp.lifeBar;

		this.setupMainLoop();
		return this.charRegionGraphics;
	}

	public destroy(): void {
		if (this.tickerCallback) {
			this.app.ticker.remove(this.tickerCallback);
			this.tickerCallback = null;
		}
		this.heroCrest.destroy();
		this.lifeBarComp.destroy();
		this.creditsDisplay.destroy();
		this.skillPanel.destroy();
		this.potionPanel.destroy();
		this.screenEffects.destroy();
		this.charRegionGraphics.destroy({ children: true });
	}

	private setupMainLoop(): void {
		this.previousLife = this.char.life;
		this.previousSpecialBar = this.char.specialBar;
		this.previousUsingSkill = this.char.usingSkill;
		this.creditsDisplay.initCredits(this.char.credits);
		this.potionPanel.initPrice(this._gameLogicService.potionPrice);

		this.tickerCallback = (ticker: { deltaMS: number }) => {
			const deltaSeconds = ticker.deltaMS / 1000;
			this.screenEffects.updateParticleEmitters(deltaSeconds);

			if (this.char.hit ||
				this.char.life !== this.previousLife ||
				this.char.specialBar !== this.previousSpecialBar ||
				this.char.usingSkill !== this.previousUsingSkill) {
				this.dirty = true;
			}

			if (!this.dirty) return;
			this.dirty = false;

			this.heroCrest.updateProtected(this.char.isProtected);
			this.updateHeroAltarMotion();
			this.lifeBarComp.renderLifeBar(this.char);
			this.skillPanel.render(this.char.specialBar);
			this.potionPanel.render(this.char.credits, this._gameLogicService.potionPrice);
		};

		this.app.ticker.add(this.tickerCallback);
	}

	private updateHeroAltarMotion(): void {
		if (this.char.hit) {
			this.char.setHit(false);
			
			if (this.previousLife > 0 && this.char.life < this.previousLife) {
				this.lifeBarComp.playDamageLifeTween(this.char.life / this.char.totalLife, this.char.life);
				this.lifeBarComp.killLifeTextTween();
				this.lifeBarComp.killHealOverlayTween();
				this.screenEffects.playDamageShake();
			} else {
				this.screenEffects.playProtectedShake();
			}
		} else if (this.previousLife > 0 && this.char.life < this.previousLife) {
			this.lifeBarComp.playDamageLifeTween(this.char.life / this.char.totalLife, this.char.life);
		}

		if (this.char.life > this.previousLife) {
			this.screenEffects.playHealBurst(
				this.char.life - this.previousLife,
				this.heroCrest.portraitCenterX,
				this.heroCrest.portraitCenterY,
				{
					centerX: this.lifeBarComp.lifeBarCenterX,
					centerY: this.lifeBarComp.lifeBarCenterY,
					maxWidth: this.lifeBarComp.lifeBarMaxWidth,
					percent: this.lifeBarComp.lifeBarStatePercent,
					height: this.lifeBarComp.lifeBarHeight,
					barSprite: this.lifeBarComp.lifeBar
				},
				this._gameLogicService.POTION_HEALTH
			);
			this.lifeBarComp.playHealLifeTween(this.char.life / this.char.totalLife, this.char.life);
			this.screenEffects.playHealPulse();
		}

		if (this.char.usingSkill && !this.previousUsingSkill) {
			this.screenEffects.playSkillPulse();
		}

		if (this.previousSpecialBar >= SKILL_CHARGE_MAX && this.char.specialBar === 0) {
			this.screenEffects.playSkillPulse();
		}

		this.creditsDisplay.updateCredits(this.char.credits);
		this.potionPanel.updatePrice(this._gameLogicService.potionPrice);

		this.previousLife = this.char.life;
		this.previousSpecialBar = this.char.specialBar;
		this.previousUsingSkill = this.char.usingSkill;
	}
}
