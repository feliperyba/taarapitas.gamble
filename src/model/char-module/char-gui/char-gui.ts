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
import { SKILL_CHARGE_MAX } from '../../constants/skill';

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
	private previousCredits = 0;
	private previousPotionPrice = 0;
	private tickerCallback: ((ticker: { deltaMS: number }) => void) | null = null;

	constructor(
		public readonly app: Application,
		public readonly char: Char,
		public readonly gameLogicService: GameLogicService,
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

		this.skillPanel.setup(this.charRegionGraphics, this.char, this.gameLogicService, this.reel);
		this.potionPanel.setup(this.charRegionGraphics, this.char, this.gameLogicService);

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
		this.previousLife = this.char.life();
		this.previousSpecialBar = this.char.specialBar();
		this.previousUsingSkill = this.char.usingSkill();
		this.previousCredits = this.char.credits();
		this.previousPotionPrice = this.gameLogicService.potionPrice();
		this.creditsDisplay.initCredits(this.previousCredits);
		this.potionPanel.initPrice(this.previousPotionPrice);

		this.tickerCallback = (ticker: { deltaMS: number }) => {
			this.screenEffects.updateParticleEmitters(ticker.deltaMS / 1000);

			const hit = this.char.hit();
			const life = this.char.life();
			const specialBar = this.char.specialBar();
			const usingSkill = this.char.usingSkill();
			const credits = this.char.credits();
			const potionPrice = this.gameLogicService.potionPrice();

			this.heroCrest.updateProtected(this.char.isProtected());

			if (hit) {
				this.char.setHit(false);
				this.handleHitTransition(life);
			} else if (this.previousLife > 0 && life < this.previousLife) {
				this.handlePassiveDamageTransition(life);
			}

			if (life > this.previousLife) {
				this.handleHealTransition(life);
			}

			if (usingSkill && !this.previousUsingSkill) {
				this.handleSkillActivation();
			}

			if (this.previousSpecialBar >= SKILL_CHARGE_MAX && specialBar === 0) {
				this.handleSkillConsumed();
			}

			this.lifeBarComp.renderLifeBar(this.char);
			this.skillPanel.render(specialBar);

			if (credits !== this.previousCredits) {
				this.creditsDisplay.updateCredits(credits);
				this.potionPanel.render(credits, potionPrice);
				this.previousCredits = credits;
			}

			if (potionPrice !== this.previousPotionPrice) {
				this.potionPanel.updatePrice(potionPrice);
				this.potionPanel.render(credits, potionPrice);
				this.previousPotionPrice = potionPrice;
			}

			this.previousLife = life;
			this.previousSpecialBar = specialBar;
			this.previousUsingSkill = usingSkill;
		};
		this.app.ticker.add(this.tickerCallback);
	}

	private handleHitTransition(life: number): void {
		if (this.previousLife > 0 && life < this.previousLife) {
			this.lifeBarComp.playDamageLifeTween(life / this.char.totalLife, life);
			this.lifeBarComp.killLifeTextTween();
			this.lifeBarComp.killHealOverlayTween();
			this.screenEffects.playDamageShake();
		} else {
			this.screenEffects.playProtectedShake();
		}
	}

	private handlePassiveDamageTransition(life: number): void {
		this.lifeBarComp.playDamageLifeTween(life / this.char.totalLife, life);
	}

	private handleHealTransition(life: number): void {
		this.screenEffects.playHealBurst(
			life - this.previousLife,
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
			this.gameLogicService.POTION_HEALTH
		);
		this.lifeBarComp.playHealLifeTween(life / this.char.totalLife, life);
		this.screenEffects.playHealPulse();
	}

	private handleSkillActivation(): void {
		this.screenEffects.playSkillPulse();
	}

	private handleSkillConsumed(): void {
		this.screenEffects.playSkillPulse();
	}
}
