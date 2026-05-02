import { Sprite, Texture, Application, TextStyle, Graphics, Container, Rectangle, Text, FillGradient, ColorMatrixFilter } from 'pixi.js';
import { Emitter, type EmitterConfigV3 } from '@barvynkoa/particle-emitter';
import { gsap } from 'gsap';
import { GameLogicService, GameStates } from '../../../services/game-logic.service';
import { Char } from '../../char-module/char';
import { Reel } from '../../reel';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';

export class CharGUI {
	public charGUIContainer = new Container();
	public charRegionGraphics = new Container();
	public creditsText: Text = new Text({ text: '' });
	public lifeText: Text = new Text({ text: '' });
	public lifeBar: Sprite;
	private lifeBarHealOverlay: Sprite;
	private heroAltarContainer = new Container();
	private lifeBarFillContainer!: Container;
	private lifeBarDamageTrailContainer!: Container;
	private heroFrame: Sprite;
	private heroFrameFlash: Sprite;
	private lifeBarMaxWidth = 0;
	private previousLife = 0;
	private previousSpecialBar = 0;
	private previousUsingSkill = false;
	private heroPortraitCenterX = 0;
	private heroPortraitCenterY = 0;
	private lifeBarCenterX = 0;
	private lifeBarCenterY = 0;
	private skillStateText: Text = new Text({ text: '' });
	private potionPriceText: Text = new Text({ text: '' });
	private stagePulseColor = 0xffffff;
	private readonly lifeBarState = { percent: 1, displayedLife: 0 };
	private readonly activeParticleEmitters = new Set<Emitter>();
	private readonly healPulseState = { progress: 1 };
	private readonly stagePulseFilter = new ColorMatrixFilter();
	private readonly stagePulseState = { mix: 0, brightnessDelta: 0 };
	private readonly damageTrailState = { percent: 1, alpha: 0 };
	private protectedIcon: Sprite;
	private hitBar: Sprite;
	private skillReady: Sprite;
	private skillOff: Sprite;
	private skillGlow: Graphics;
	private potionContainer: Container;
	private lifeBarMask!: Graphics;
	private damageTrailMask!: Graphics;
	private lifeBarDamageTrail!: Sprite;
	private lifeBarX = 0;
	private lifeBarY = 0;
	private lifeBarHeight = 0;
	private readonly creditsDisplayState = { value: 0 };
	private readonly potionPriceDisplayState = { value: 0 };
	private centerCreditsFn: () => void = () => {};
	private previousCredits = 0;
	private previousPotionPrice = 0;
	private lowLifePulseActive = false;
	private skillPulseActive = false;

	private hudValueStyle = (() => {
		const gradient = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		gradient.addColorStop(0, '#fff8dd').addColorStop(1, '#d1ab59');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 28,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: gradient,
			stroke: { color: '#000', width: 4 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			}
		});
	})();

	private heroLabelStyle = (() => {
		const gradient = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		gradient.addColorStop(0, '#fff5cf').addColorStop(1, '#b68946');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 28,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: gradient,
			stroke: { color: '#000', width: 4 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			letterSpacing: 1
		});
	})();

	private panelTitleStyle = (() => {
		const gradient = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		gradient.addColorStop(0, '#fff5cf').addColorStop(1, '#c18f40');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 20,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: gradient,
			stroke: { color: '#000', width: 3 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			letterSpacing: 1
		});
	})();

	private hudPriceStyle = (() => {
		const gradient = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		gradient.addColorStop(0, '#fff8dd').addColorStop(1, '#d1ab59');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 24,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: gradient,
			stroke: { color: '#000', width: 4 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			}
		});
	})();

	private panelNoteStyle = (() => {
		const gradient = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		gradient.addColorStop(0, '#fef4dc').addColorStop(1, '#be9860');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 18,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: gradient,
			stroke: { color: '#000', width: 3 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			wordWrap: true,
			wordWrapWidth: SCENE_LAYOUT.game.potionWell.width - 130
		});
	})();

	constructor(
		public app: Application,
		public char: Char,
		public _gameLogicService: GameLogicService,
		public style: TextStyle,
		public reel: Reel,
		public margin: number
	) {}

	public setup(): Container {
		this.setupHeroCrest();
		this.setupCreditsCluster();
		this.setupClassSkillPanel();
		this.setupPotionPanel();
		this.setupMainLoop();
		return this.charRegionGraphics;
	}

	private setupHeroCrest() {
		const heroCrest = SCENE_LAYOUT.game.heroCrest;
		const frameTexture = getTexture('assets/char_frame.png');
		const frameScale = heroCrest.width / frameTexture.width;
		const portraitCenterX = heroCrest.x + Math.round(160 * frameScale);
		const portraitCenterY = heroCrest.y + Math.round(160 * frameScale);
		const portraitMaskRadius = Math.round(100 * frameScale);
		const portrait = new Sprite(this.char.portrait);
		const frame = new Sprite(frameTexture);
		const damageFlash = new Sprite(frameTexture);
		this.protectedIcon = new Sprite(getTexture('assets/protected_icon.png'));
		const portraitMask = new Graphics();

		frame.scale.set(frameScale);
		frame.x = heroCrest.x;
		frame.y = heroCrest.y;
		this.heroFrame = frame;
		this.heroPortraitCenterX = portraitCenterX;
		this.heroPortraitCenterY = portraitCenterY;

		damageFlash.scale.set(frameScale);
		damageFlash.x = frame.x;
		damageFlash.y = frame.y;
		damageFlash.tint = 0xe01818;
		damageFlash.alpha = 0;
		this.heroFrameFlash = damageFlash;

		this.scaleSpriteToCover(portrait, portraitMaskRadius * 5, portraitMaskRadius * 5);
		portrait.anchor.set(0.5);
		portrait.x = portraitCenterX - Math.round(portraitMaskRadius * 0.05);
		portrait.y = portraitCenterY + Math.round(portraitMaskRadius * 0.70);

		portraitMask.circle(portraitCenterX, portraitCenterY, portraitMaskRadius).fill({ color: 0xffffff, alpha: 1 });
		portraitMask.alpha = 0.001;
		portrait.mask = portraitMask;

		this.protectedIcon.anchor.set(0.5);
		this.protectedIcon.x = portraitCenterX + 192;
		this.protectedIcon.y = portraitCenterY - 16;
		this.protectedIcon.scale.x = this.protectedIcon.scale.y = Math.min(40 / this.protectedIcon.width, 40 / this.protectedIcon.height);
		this.protectedIcon.visible = false;

		this.heroAltarContainer.addChild(portrait);
		this.heroAltarContainer.addChild(portraitMask);
		this.heroAltarContainer.addChild(frame);
		this.heroAltarContainer.addChild(damageFlash);
		this.charRegionGraphics.addChild(this.heroAltarContainer);

		this.setupLifeBar(portraitCenterX, portraitCenterY);

		this.heroAltarContainer.addChild(this.protectedIcon);
	}

	private setupLifeBar(portraitCenterX: number, portraitCenterY: number) {
		const heroCrest = SCENE_LAYOUT.game.heroCrest;
		const frameScale = heroCrest.width / getTexture('assets/char_frame.png').width;
		const label = new Text({ text: this.char.charContext.name.toUpperCase(), style: this.heroLabelStyle });
		const lifeBarX = heroCrest.x + Math.round(250 * frameScale);
		const lifeBarY = heroCrest.y + Math.round(72 * frameScale);
		const lifeBarWidth = Math.round(370 * frameScale);
		const lifeBarHeight = Math.round(42 * frameScale);
		this.lifeBarMaxWidth = lifeBarWidth;
		this.lifeBarX = lifeBarX;
		this.lifeBarY = lifeBarY;
		this.lifeBarHeight = lifeBarHeight;
		this.lifeBarCenterX = lifeBarX + lifeBarWidth / 2;
		this.lifeBarCenterY = lifeBarY + lifeBarHeight / 2;

		const initialPercent = Math.max(0, Math.min(1, this.char.life / this.char.totalLife));
		this.lifeBarState.percent = initialPercent;
		this.lifeBarState.displayedLife = this.char.life;
		this.damageTrailState.percent = initialPercent;
		this.damageTrailState.alpha = 0;

		label.anchor.set(0.5, 0);
		label.x = lifeBarX + lifeBarWidth / 2;
		label.y = heroCrest.y + Math.round(130 * frameScale);

		this.lifeBarMask = new Graphics();
		this.configureBarMask(this.lifeBarMask);

		this.damageTrailMask = new Graphics();
		this.configureBarMask(this.damageTrailMask);

		this.lifeBarDamageTrail = new Sprite(getTexture('assets/life_bar.png'));
		this.lifeBarDamageTrail.anchor.set(0, 0);
		this.lifeBarDamageTrail.x = 0;
		this.lifeBarDamageTrail.y = 0;
		this.lifeBarDamageTrail.width = lifeBarWidth;
		this.lifeBarDamageTrail.height = lifeBarHeight;
		this.lifeBarDamageTrail.tint = 0xb03030;
		this.lifeBarDamageTrail.alpha = 0;
		this.lifeBarDamageTrailContainer = new Container();
		this.lifeBarDamageTrailContainer.position.set(lifeBarX, lifeBarY);
		this.lifeBarDamageTrailContainer.addChild(this.lifeBarDamageTrail);
		this.lifeBarDamageTrailContainer.addChild(this.damageTrailMask);
		this.lifeBarDamageTrailContainer.mask = this.damageTrailMask;

		this.lifeBar = new Sprite(getTexture('assets/life_bar.png'));
		this.lifeBar.anchor.set(0, 0);
		this.lifeBar.x = 0;
		this.lifeBar.y = 0;
		this.lifeBar.width = lifeBarWidth;
		this.lifeBar.height = lifeBarHeight;

		this.lifeBarHealOverlay = new Sprite(Texture.WHITE);
		this.lifeBarHealOverlay.x = 0;
		this.lifeBarHealOverlay.y = 0;
		this.lifeBarHealOverlay.width = lifeBarWidth;
		this.lifeBarHealOverlay.height = lifeBarHeight;
		this.lifeBarHealOverlay.alpha = 0;
		this.lifeBarHealOverlay.tint = 0x46ff8d;
		this.lifeBarFillContainer = new Container();
		this.lifeBarFillContainer.position.set(lifeBarX, lifeBarY);
		this.lifeBarFillContainer.addChild(this.lifeBar);
		this.lifeBarFillContainer.addChild(this.lifeBarHealOverlay);
		this.lifeBarFillContainer.addChild(this.lifeBarMask);
		this.lifeBarFillContainer.mask = this.lifeBarMask;

		this.lifeText = new Text({ text: `${this.char.life}/${this.char.totalLife}`, style: this.hudValueStyle });
		this.lifeText.anchor.set(0.5);
		this.lifeText.x = lifeBarX + lifeBarWidth / 2;
		this.lifeText.y = lifeBarY + lifeBarHeight / 2;

		this.hitBar = new Sprite(getTexture('assets/hit.png'));
		this.hitBar.alpha = 0;
		this.hitBar.anchor.set(0.5);
		this.hitBar.x = portraitCenterX - 32;
		this.hitBar.y = portraitCenterY;
		this.hitBar.scale.x = this.hitBar.scale.y = Math.min(150 / this.hitBar.width, 150 / this.hitBar.height);

		this.heroAltarContainer.addChild(this.lifeBarDamageTrailContainer);
		this.heroAltarContainer.addChild(this.lifeBarFillContainer);

		this.lifeBarMask.scale.x = initialPercent;
		this.damageTrailMask.scale.x = initialPercent;

		this.heroAltarContainer.addChild(this.lifeText);
		this.heroAltarContainer.addChild(label);
		this.heroAltarContainer.addChild(this.hitBar);
	}

	private updateHeroAltarMotion() {
		if (this.char.hit) {
			this.char.hit = false;
			if (this.previousLife > 0 && this.char.life < this.previousLife) {
				this.playDamageLifeTween(this.char.life / this.char.totalLife);
				this.playDamageTween();
			} else {
				this.playProtectedHitTween();
			}
		} else if (this.previousLife > 0 && this.char.life < this.previousLife) {
			this.playDamageLifeTween(this.char.life / this.char.totalLife);
		}

		if (this.char.life > this.previousLife) {
			this.playHealBurst(this.char.life - this.previousLife);
			this.playHealLifeTween(this.char.life / this.char.totalLife);
		}

		if (this.char.usingSkill && !this.previousUsingSkill) {
			this.playSkillTween();
		}

		if (this.previousSpecialBar >= 3 && this.char.specialBar === 0) {
			this.playSkillTween();
		}

		if (this.char.credits !== this.previousCredits) {
			gsap.to(this.creditsDisplayState, {
				value: this.char.credits,
				duration: 0.5,
				ease: 'power2.out',
				overwrite: true,
				onUpdate: () => {
					this.creditsText.text = Math.round(this.creditsDisplayState.value).toString();
					this.centerCreditsFn();
				}
			});
			this.previousCredits = this.char.credits;
		}

		if (this._gameLogicService.POTION_PRICE !== this.previousPotionPrice) {
			gsap.to(this.potionPriceDisplayState, {
				value: this._gameLogicService.POTION_PRICE,
				duration: 0.6,
				ease: 'power2.out',
				overwrite: true,
				onUpdate: () => {
					this.potionPriceText.text = Math.round(this.potionPriceDisplayState.value).toString();
					this.fitTextToWidth(this.potionPriceText, 82, 0.82);
				}
			});
			this.previousPotionPrice = this._gameLogicService.POTION_PRICE;
		}

		this.previousLife = this.char.life;
		this.previousSpecialBar = this.char.specialBar;
		this.previousUsingSkill = this.char.usingSkill;
	}

	private playDamageLifeTween(percent: number) {
		const oldPercent = this.lifeBarState.percent;
		const clampedPercent = Math.max(0, Math.min(1, percent));
		const damageDelta = Math.abs(oldPercent - clampedPercent);
		gsap.killTweensOf([this.lifeBarState, this.lifeBarMask.scale, this.lifeBarHealOverlay, this.healPulseState, this.damageTrailState, this.damageTrailMask.scale, this.lifeBarDamageTrail, this.lifeText.scale]);
		this.lifeBarHealOverlay.alpha = 0;

		gsap
			.timeline({ overwrite: true })
			.to(this.lifeBarMask.scale, { x: Math.min(1, oldPercent + 0.02), duration: 0.04, ease: 'power1.out' })
			.to(this.lifeBarMask.scale, { x: clampedPercent, duration: 0.32, ease: 'power4.inOut' });

		this.lifeBarState.percent = clampedPercent;

		gsap.to(this.lifeBarState, {
			displayedLife: this.char.life,
			duration: 0.36,
			ease: 'power2.out',
			overwrite: true
		});

		gsap.fromTo(this.lifeText.scale, { x: 1.35, y: 1.35 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });

		this.damageTrailMask.scale.x = oldPercent;
		this.lifeBarDamageTrail.alpha = 0.85;
		this.damageTrailState.alpha = 0.85;
		gsap
			.timeline({ overwrite: true })
			.to(this.damageTrailMask.scale, { x: clampedPercent, duration: 1.1, ease: 'power2.out' })
			.to(this.lifeBarDamageTrail, { alpha: 0, duration: 1.1, ease: 'power2.in' }, 0);
		gsap.to(this.damageTrailState, { alpha: 0, duration: 1.1, ease: 'power2.in', overwrite: true });
	}

	private playHealLifeTween(percent: number) {
		const clampedPercent = Math.max(0, Math.min(1, percent));
		const percentGain = Math.max(0, clampedPercent - this.lifeBarState.percent);
		const overshootPercent = Math.min(1, clampedPercent + Math.max(0.05, percentGain * 0.28));

		gsap.killTweensOf([this.lifeBarState, this.lifeBarMask.scale, this.heroAltarContainer.scale, this.lifeText.scale, this.heroFrameFlash, this.healPulseState, this.lifeBarHealOverlay, this.damageTrailState, this.damageTrailMask.scale, this.lifeBarDamageTrail]);
		this.damageTrailState.alpha = 0;
		this.lifeBarDamageTrail.alpha = 0;

		gsap
			.timeline({ overwrite: true })
			.to(this.lifeBarMask.scale, { x: overshootPercent, duration: 0.38, ease: 'power2.out' })
			.to(this.lifeBarMask.scale, { x: clampedPercent, duration: 0.92, ease: 'back.out(1.4)' });

		this.lifeBarState.percent = clampedPercent;

		gsap.to(this.lifeBarState, {
			displayedLife: this.char.life,
			duration: 1.42,
			ease: 'power2.out',
			overwrite: true
		});

		gsap.fromTo(
			this.heroAltarContainer.scale,
			{ x: 0.992, y: 0.992 },
			{ x: 1.042, y: 1.042, duration: 0.26, ease: 'power2.out', yoyo: true, repeat: 1 }
		);

		gsap.fromTo(this.lifeText.scale, { x: 1.28, y: 1.28 }, { x: 1, y: 1, duration: 0.92, ease: 'back.out(2.2)' });

		gsap
			.timeline()
			.set(this.heroFrameFlash, { tint: 0xff88d7, alpha: 0 })
			.to(this.heroFrameFlash, { alpha: 0.52, duration: 0.16, ease: 'power2.out' })
			.to(this.heroFrameFlash, { alpha: 0.14, duration: 0.22, ease: 'power2.inOut' })
			.to(this.heroFrameFlash, { alpha: 0, duration: 0.42, ease: 'power2.out' });

		this.healPulseState.progress = 0;
		this.lifeBarHealOverlay.alpha = 0;
		gsap.to(this.healPulseState, {
			progress: 1,
			duration: 1.72,
			ease: 'sine.inOut',
			onUpdate: () => this.applyHealColorPulse(this.healPulseState.progress),
			onComplete: () => {
				this.lifeBarHealOverlay.alpha = 0;
			}
		});
	}

	private applyHealColorPulse(progress: number) {
		const clampedProgress = Math.max(0, Math.min(1, progress));

		if (clampedProgress < 0.22) {
			const riseAmount = clampedProgress / 0.22;
			this.lifeBarHealOverlay.tint = this.mixColor(0xc7ff7c, 0x4fff97, riseAmount);
			this.lifeBarHealOverlay.alpha = this.lerp(0, 0.94, riseAmount);
			return;
		}

		if (clampedProgress < 0.78) {
			const holdAmount = (clampedProgress - 0.22) / 0.56;
			this.lifeBarHealOverlay.tint = this.mixColor(0x4fff97, 0x8dffc5, holdAmount);
			this.lifeBarHealOverlay.alpha = this.lerp(0.94, 0.68, holdAmount);
			return;
		}

		const fallAmount = (clampedProgress - 0.78) / 0.22;
		this.lifeBarHealOverlay.tint = this.mixColor(0x8dffc5, 0x4fff97, fallAmount);
		this.lifeBarHealOverlay.alpha = this.lerp(0.68, 0, fallAmount);
	}

	private playDamageTween() {
		this.playScreenPulse(0xff6c63, 0.3, -0.18, 0.38);
		gsap.killTweensOf([this.heroAltarContainer, this.heroAltarContainer.scale, this.lifeText.scale, this.heroFrameFlash, this.hitBar, this.healPulseState, this.lifeBarHealOverlay]);
		this.heroAltarContainer.scale.set(1);
		this.lifeText.scale.set(1);
		this.lifeBarHealOverlay.alpha = 0;
		gsap
			.timeline()
			.to(this.heroAltarContainer, { x: -12, duration: 0.03, ease: 'power1.inOut' })
			.to(this.heroAltarContainer, { x: 10, duration: 0.04, ease: 'power1.inOut' })
			.to(this.heroAltarContainer, { x: -5, duration: 0.035, ease: 'power1.inOut' })
			.to(this.heroAltarContainer, { x: 0, duration: 0.1, ease: 'power3.out' });
		gsap
			.timeline()
			.set(this.heroFrameFlash, { tint: 0xe01818, alpha: 0 })
			.to(this.heroFrameFlash, { alpha: 0.72, duration: 0.048, ease: 'power2.out' })
			.to(this.heroFrameFlash, { alpha: 0.1, duration: 0.08, ease: 'power2.in' })
			.to(this.heroFrameFlash, { alpha: 0.42, duration: 0.04, ease: 'power2.out' })
			.to(this.heroFrameFlash, { alpha: 0, duration: 0.16, ease: 'power2.out' });
		gsap.fromTo(this.hitBar, { alpha: 1 }, { alpha: 0, duration: 1.12, ease: 'power2.out' });
		gsap.fromTo(this.hitBar.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.28, ease: 'power2.out' });
		gsap.fromTo(
			this.heroAltarContainer.scale,
			{ x: 0.96, y: 0.96 },
			{ x: 1, y: 1, duration: 0.38, ease: 'back.out(2.5)' }
		);
	}

	private playProtectedHitTween() {
		gsap.killTweensOf([this.heroAltarContainer, this.heroAltarContainer.scale, this.lifeText.scale, this.heroFrameFlash, this.hitBar]);
		this.heroAltarContainer.scale.set(1);
		this.lifeText.scale.set(1);

		gsap
			.timeline()
			.to(this.heroAltarContainer, { x: -8, duration: 0.03, ease: 'power1.inOut' })
			.to(this.heroAltarContainer, { x: 6, duration: 0.04, ease: 'power1.inOut' })
			.to(this.heroAltarContainer, { x: 0, duration: 0.1, ease: 'power3.out' });

		gsap
			.timeline()
			.set(this.heroFrameFlash, { tint: 0x4da6ff, alpha: 0 })
			.to(this.heroFrameFlash, { alpha: 0.5, duration: 0.06, ease: 'power2.out' })
			.to(this.heroFrameFlash, { alpha: 0, duration: 0.2, ease: 'power2.out' });

		gsap.fromTo(this.hitBar, { alpha: 1 }, { alpha: 0, duration: 1.12, ease: 'power2.out' });
		gsap.fromTo(this.hitBar.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.28, ease: 'power2.out' });
		gsap.fromTo(
			this.heroAltarContainer.scale,
			{ x: 0.97, y: 0.97 },
			{ x: 1, y: 1, duration: 0.35, ease: 'back.out(2)' }
		);
	}

	private playHealBurst(healedAmount: number) {
		if (healedAmount <= 0) {
			return;
		}

		const healStrength = Math.min(2.15, 1.18 + healedAmount / Math.max(1, this._gameLogicService.POTION_HEALTH));
		this.playScreenPulse(0xff9ce6, 0.24, 0.12, 0.78);
		this.spawnHealingEmitter(this.createAltarHealEmitterConfig(healStrength));
		this.spawnHealingEmitter(this.createAltarSparkEmitterConfig(healStrength));
		this.spawnHealingEmitter(this.createLifeBarHealEmitterConfig(healStrength));
	}

	private createAltarHealEmitterConfig(healStrength: number): EmitterConfigV3 {
		return {
			lifetime: { min: 1.4, max: 2.2 },
			frequency: 0.04,
			spawnChance: 1,
			particlesPerWave: 4,
			emitterLifetime: 0.74,
			maxParticles: 78,
			pos: {
				x: this.heroPortraitCenterX,
				y: this.heroPortraitCenterY + 24
			},
			emit: false,
			autoUpdate: false,
			behaviors: [
				{
					type: 'alpha',
					config: {
						alpha: {
							list: [
								{ value: 0.96, time: 0 },
								{ value: 0.84, time: 0.18 },
								{ value: 0.42, time: 0.7 },
								{ value: 0, time: 1 }
							]
						}
					}
				},
				{
					type: 'scale',
					config: {
						scale: {
							list: [
								{ value: 0.82, time: 0 },
								{ value: 1.9, time: 0.34 },
								{ value: 0.28, time: 1 }
							]
						}
					}
				},
				{
					type: 'color',
					config: {
						color: {
							list: [
								{ value: '#ff79d2', time: 0 },
								{ value: '#ffc3f2', time: 0.55 },
								{ value: '#ffe8ff', time: 1 }
							]
						}
					}
				},
				{
					type: 'moveSpeed',
					config: {
						speed: {
							list: [
								{ value: 62 * healStrength, time: 0 },
								{ value: 10, time: 1 }
							],
							isStepped: false
						}
					}
				},
				{
					type: 'rotationStatic',
					config: { min: 0, max: 360 }
				},
				{
					type: 'spawnShape',
					config: {
						type: 'torus',
						data: {
							x: 0,
							y: 0,
							radius: 122 * healStrength,
							innerRadius: 34,
							affectRotation: true
						}
					}
				},
				{
					type: 'textureSingle',
					config: { texture: getTexture('assets/symbol_01.png') }
				}
			]
		};
	}

	private createAltarSparkEmitterConfig(healStrength: number): EmitterConfigV3 {
		return {
			lifetime: { min: 0.95, max: 1.5 },
			frequency: 0.024,
			spawnChance: 1,
			particlesPerWave: 5,
			emitterLifetime: 0.62,
			maxParticles: 88,
			pos: {
				x: this.heroPortraitCenterX,
				y: this.heroPortraitCenterY + 42
			},
			emit: false,
			autoUpdate: false,
			behaviors: [
				{
					type: 'alpha',
					config: {
						alpha: {
							list: [
								{ value: 0.85, time: 0 },
								{ value: 0.56, time: 0.46 },
								{ value: 0, time: 1 }
							]
						}
					}
				},
				{
					type: 'scale',
					config: {
						scale: {
							list: [
								{ value: 0.38, time: 0 },
								{ value: 0.96, time: 0.48 },
								{ value: 0.12, time: 1 }
							]
						}
					}
				},
				{
					type: 'color',
					config: {
						color: {
							list: [
								{ value: '#ff7dda', time: 0 },
								{ value: '#ffc6f3', time: 0.5 },
								{ value: '#fff4ff', time: 1 }
							]
						}
					}
				},
				{
					type: 'moveSpeed',
					config: {
						speed: {
							list: [
								{ value: 74 * healStrength, time: 0 },
								{ value: 14, time: 1 }
							],
							isStepped: false
						}
					}
				},
				{
					type: 'rotationStatic',
					config: { min: 250, max: 290 }
				},
				{
					type: 'spawnShape',
					config: {
						type: 'rect',
						data: {
							x: -64,
							y: -28,
							w: 128,
							h: 72
						}
					}
				},
				{
					type: 'textureSingle',
					config: { texture: getTexture('assets/symbol_01.png') }
				}
			]
		};
	}

	private createLifeBarHealEmitterConfig(healStrength: number): EmitterConfigV3 {
		const activeWidth = Math.max(64, this.lifeBarMaxWidth * this.lifeBarState.percent - 20);

		return {
			lifetime: { min: 1.08, max: 1.72 },
			frequency: 0.032,
			spawnChance: 1,
			particlesPerWave: 4,
			emitterLifetime: 0.62,
			maxParticles: 68,
			pos: {
				x: this.lifeBarCenterX,
				y: this.lifeBarCenterY
			},
			emit: false,
			autoUpdate: false,
			behaviors: [
				{
					type: 'alpha',
					config: {
						alpha: {
							list: [
								{ value: 0.94, time: 0 },
								{ value: 0.72, time: 0.36 },
								{ value: 0, time: 1 }
							]
						}
					}
				},
				{
					type: 'scale',
					config: {
						scale: {
							list: [
								{ value: 0.54, time: 0 },
								{ value: 1.08, time: 0.42 },
								{ value: 0.16, time: 1 }
							]
						}
					}
				},
				{
					type: 'color',
					config: {
						color: {
							list: [
								{ value: '#ff8edd', time: 0 },
								{ value: '#ffd7f7', time: 1 }
							]
						}
					}
				},
				{
					type: 'moveSpeed',
					config: {
						speed: {
							list: [
								{ value: 34 * healStrength, time: 0 },
								{ value: 8, time: 1 }
							],
							isStepped: false
						}
					}
				},
				{
					type: 'rotationStatic',
					config: { min: 258, max: 282 }
				},
				{
					type: 'spawnShape',
					config: {
						type: 'rect',
						data: {
							x: -activeWidth / 2,
							y: -this.lifeBar.height / 2,
							w: activeWidth,
							h: this.lifeBar.height
						}
					}
				},
				{
					type: 'textureSingle',
					config: { texture: getTexture('assets/symbol_01.png') }
				}
			]
		};
	}

	private spawnHealingEmitter(config: EmitterConfigV3) {
		const particleLayer = new Container();
		const emitter = new Emitter(particleLayer, config);

		this.heroAltarContainer.addChild(particleLayer);
		this.activeParticleEmitters.add(emitter);
		emitter.playOnceAndDestroy(() => {
			this.activeParticleEmitters.delete(emitter);
			particleLayer.destroy({ children: true });
		});
	}

	private updateActiveParticleEmitters(deltaSeconds: number) {
		if (this.activeParticleEmitters.size === 0) {
			return;
		}

		for (const emitter of Array.from(this.activeParticleEmitters)) {
			if (emitter.destroyed) {
				this.activeParticleEmitters.delete(emitter);
				continue;
			}

			emitter.update(deltaSeconds);
		}
	}

	private playScreenPulse(color: number, peakMix: number, brightnessDelta: number, duration: number) {
		this.stagePulseColor = color;
		this.stagePulseState.mix = 0;
		this.stagePulseState.brightnessDelta = brightnessDelta;
		gsap.killTweensOf(this.stagePulseState);
		this.updateStagePulseFilter();

		gsap.timeline({
			onUpdate: () => this.updateStagePulseFilter(),
			onComplete: () => {
				this.stagePulseState.mix = 0;
				this.updateStagePulseFilter();
			}
		})
			.to(this.stagePulseState, { mix: peakMix, duration: duration * 0.32, ease: 'power2.out' })
			.to(this.stagePulseState, { mix: 0, duration: duration * 0.68, ease: 'power2.inOut' });
	}

	private updateStagePulseFilter() {
		const stageFilters = this.app.stage.filters ?? [];

		if (this.stagePulseState.mix <= 0.001) {
			this.stagePulseFilter.reset();
			if (stageFilters.includes(this.stagePulseFilter)) {
				this.app.stage.filters = stageFilters.filter((filter) => filter !== this.stagePulseFilter);
			}
			return;
		}

		if (!stageFilters.includes(this.stagePulseFilter)) {
			this.app.stage.filters = [...stageFilters, this.stagePulseFilter];
		}

		this.stagePulseFilter.reset();
		this.stagePulseFilter.tint(this.mixColor(0xffffff, this.stagePulseColor, this.stagePulseState.mix), false);
		this.stagePulseFilter.brightness(1 + this.stagePulseState.brightnessDelta * this.stagePulseState.mix, true);
	}

	private mixColor(from: number, to: number, amount: number): number {
		const clampedAmount = Math.max(0, Math.min(1, amount));
		const fromRed = (from >> 16) & 0xff;
		const fromGreen = (from >> 8) & 0xff;
		const fromBlue = from & 0xff;
		const toRed = (to >> 16) & 0xff;
		const toGreen = (to >> 8) & 0xff;
		const toBlue = to & 0xff;

		return (
			(Math.round(this.lerp(fromRed, toRed, clampedAmount)) << 16) |
			(Math.round(this.lerp(fromGreen, toGreen, clampedAmount)) << 8) |
			Math.round(this.lerp(fromBlue, toBlue, clampedAmount))
		);
	}

	private playSkillTween() {
		gsap.killTweensOf(this.heroAltarContainer.scale);
		gsap
			.timeline()
			.to(this.heroFrame, { tint: 0xffd27a, duration: 0.12, ease: 'power2.out' })
			.to(this.heroFrame, { tint: 0xffffff, duration: 0.42, ease: 'power2.out' }, '>');
		gsap.fromTo(
			this.heroAltarContainer.scale,
			{ x: 1.018, y: 1.018 },
			{ x: 1, y: 1, duration: 0.46, ease: 'elastic.out(1, 0.52)' }
		);
	}

	private setupCreditsCluster() {
		const creditsCluster = SCENE_LAYOUT.game.creditsCluster;
		const panel = new Graphics();
		const trim = new Graphics();
		const label = new Text({ text: 'CREDITS', style: this.panelTitleStyle });
		const coin = new Sprite(getTexture('assets/coin.png'));

		panel
			.roundRect(creditsCluster.x, creditsCluster.y, creditsCluster.width, creditsCluster.height, 22)
			.fill({ color: 0x140806, alpha: 0.82 })
			.stroke({ color: 0xa37139, alpha: 0.22, width: 3 });
		trim.roundRect(creditsCluster.x + 12, creditsCluster.y + 10, creditsCluster.width - 24, 16, 8).fill({ color: 0xf3d3a0, alpha: 0.07 });

		label.anchor.set(0.5, 0);
		label.x = creditsCluster.centerX;
		label.y = creditsCluster.y + 4;

		coin.anchor.set(0.5);
		coin.y = creditsCluster.centerY + 12;
		coin.scale.x = coin.scale.y = Math.min(52 / coin.width, 52 / coin.height);

		this.creditsText = new Text({ text: this.char.credits.toString(), style: this.style });
		this.creditsText.anchor.set(0, 0.5);
		this.creditsText.y = creditsCluster.centerY + 10;

		this.centerCreditsFn = () => {
			this.fitTextToWidth(this.creditsText, creditsCluster.width - 100, 0.76);
			const gap = 14;
			const coinWidth = coin.width;
			const totalWidth = coinWidth + gap + this.creditsText.width;
			coin.x = creditsCluster.centerX - totalWidth / 2 + coinWidth / 2;
			this.creditsText.x = coin.x + coinWidth / 2 + gap;
		};
		this.centerCreditsFn();

		this.charRegionGraphics.addChild(panel);
		this.charRegionGraphics.addChild(trim);
		this.charRegionGraphics.addChild(label);
		this.charRegionGraphics.addChild(coin);
		this.charRegionGraphics.addChild(this.creditsText);
	}

	private setupClassSkillPanel() {
		const skillWell = SCENE_LAYOUT.game.skillWell;
		const skillContainer = new Container();
		const panel = new Graphics();
		const trim = new Graphics();
		const title = new Text({ text: 'SKILL', style: this.panelTitleStyle });
		this.skillGlow = new Graphics();
		this.skillOff = new Sprite(getTexture('assets/skill_bar_empty.png'));
		this.skillReady = new Sprite(getTexture('assets/skill_bar_full.png'));

		panel
			.roundRect(skillWell.x, skillWell.y, skillWell.width, skillWell.height, 24)
			.fill({ color: 0x150806, alpha: 0.88 })
			.stroke({ color: 0x94632f, alpha: 0.24, width: 3 });
		panel
			.roundRect(skillWell.x + 10, skillWell.y + 10, skillWell.width - 20, skillWell.height - 20, 20)
			.fill({ color: 0x090302, alpha: 0.72 })
			.stroke({ color: 0xe3bb73, alpha: 0.1, width: 2 });
		trim.roundRect(skillWell.x + 16, skillWell.y + 14, skillWell.width - 32, 16, 8).fill({ color: 0xf7d7a5, alpha: 0.06 });

		title.anchor.set(0.5, 0);
		title.x = skillWell.centerX;
		title.y = skillWell.y + 4;

		skillContainer.x = skillWell.centerX;
		skillContainer.y = skillWell.y + 98;
		skillContainer.eventMode = 'static';
		skillContainer.cursor = 'pointer';
		skillContainer.hitArea = new Rectangle(-skillWell.width / 2 + 12, -72, skillWell.width - 24, 112);

		this.skillGlow.circle(0, 0, 68).fill({ color: 0xf0912c, alpha: 0.1 });
		this.skillGlow.circle(0, 0, 48).fill({ color: 0x070302, alpha: 0.74 });

		this.skillOff.anchor.set(0.5);
		this.skillOff.scale.x = this.skillOff.scale.y = Math.min(118 / this.skillOff.width, 118 / this.skillOff.height);
		this.skillOff.alpha = 1;

		this.skillReady.anchor.set(0.5);
		this.skillReady.scale.x = this.skillReady.scale.y = Math.min(112 / this.skillReady.width, 112 / this.skillReady.height);
		this.skillReady.visible = false;

		this.skillStateText = new Text({ text: 'Charge 0 / 3', style: this.panelNoteStyle });
		this.skillStateText.anchor.set(0.5, 0);
		this.skillStateText.x = skillWell.centerX;
		this.skillStateText.y = skillWell.y + 144;

		skillContainer.on('pointerdown', () => {
			if (
				(this.char.specialBar >= 3 && this._gameLogicService.state == GameStates.WAITING) ||
				this._gameLogicService.state == GameStates.WIN
			) {
				if (this._gameLogicService.state == GameStates.WIN) {
					for (const r of this.reel.reelArr) {
						r.container.children[this.reel.reelWinSlotPos].tint = 16777215;
					}
					this.reel.reelWinSlotPos = 0;
				}

				this.char.usingSkill = true;
				this.char.charContext.useClassSkill(this.char.charContext.target);

				if (this.char.charContext.target instanceof Char) {
					this.char.usingSkill = false;
					this.char.specialBar = 0;
				}
			}
		});

		skillContainer.addChild(this.skillGlow);
		skillContainer.addChild(this.skillOff);
		skillContainer.addChild(this.skillReady);

		this.charRegionGraphics.addChild(panel);
		this.charRegionGraphics.addChild(trim);
		this.charRegionGraphics.addChild(title);
		this.charRegionGraphics.addChild(skillContainer);
		this.charRegionGraphics.addChild(this.skillStateText);
	}

	private setupPotionPanel() {
		const potionWell = SCENE_LAYOUT.game.potionWell;
		this.potionContainer = new Container();
		const panel = new Graphics();
		const trim = new Graphics();
		const potionAura = new Graphics();
		const title = new Text({ text: 'POTION', style: this.panelTitleStyle });
		const priceCoin = new Sprite(getTexture('assets/coin.png'));
		const potion = new Sprite(getTexture('assets/potion_icon.png'));
		const healText = new Text({ text: `Heals ${this._gameLogicService.POTION_HEALTH} life`, style: this.panelNoteStyle });

		panel
			.roundRect(potionWell.x, potionWell.y, potionWell.width, potionWell.height, 24)
			.fill({ color: 0x150806, alpha: 0.88 })
			.stroke({ color: 0x94632f, alpha: 0.24, width: 3 });
		panel
			.roundRect(potionWell.x + 10, potionWell.y + 10, potionWell.width - 20, potionWell.height - 20, 20)
			.fill({ color: 0x090302, alpha: 0.72 })
			.stroke({ color: 0xe3bb73, alpha: 0.1, width: 2 });
		trim.roundRect(potionWell.x + 16, potionWell.y + 14, potionWell.width - 32, 16, 8).fill({ color: 0xf7d7a5, alpha: 0.06 });

		title.anchor.set(0.5, 0);
		title.x = potionWell.centerX;
		title.y = potionWell.y + 6;

		this.potionContainer.x = potionWell.x;
		this.potionContainer.y = potionWell.y;
		this.potionContainer.cursor = 'pointer';
		this.potionContainer.eventMode = 'static';
		this.potionContainer.hitArea = new Rectangle(0, 0, potionWell.width, potionWell.height);

		potionAura.circle(76, 86, 48).fill({ color: 0x8b3d08, alpha: 0.12 });

		potion.anchor.set(0.5);
		potion.x = 76;
		potion.y = 86;
		potion.scale.x = potion.scale.y = Math.min(84 / potion.width, 84 / potion.height);

		priceCoin.anchor.set(0.5);
		priceCoin.x = 190;
		priceCoin.y = 80;
		priceCoin.scale.x = priceCoin.scale.y = Math.min(24 / priceCoin.width, 24 / priceCoin.height);

		this.potionPriceText = new Text({ text: this._gameLogicService.POTION_PRICE.toString(), style: this.hudPriceStyle });
		this.potionPriceText.anchor.set(0, 0.5);
		this.potionPriceText.x = 208;
		this.potionPriceText.y = 80;

		healText.x = 138;
		healText.y = 98;
		this.fitTextToWidth(healText, potionWell.width - 152, 0.8);

		this.potionContainer
			.on('pointerdown', () => {
				if (this.char.credits - this._gameLogicService.POTION_PRICE >= 0) {
					this.char.life += this._gameLogicService.POTION_HEALTH;
					this.char.credits -= this._gameLogicService.POTION_PRICE;
					if (this.char.life > this.char.totalLife) {
						this.char.life = this.char.totalLife;
					}
					this._gameLogicService.POTION_PRICE *= 2;
				}
			})
			.on('pointerover', () => {
				potionAura.alpha = 0.2;
			})
			.on('pointerout', () => {
				potionAura.alpha = 0.12;
			});

		this.potionContainer.addChild(potionAura);
		this.potionContainer.addChild(potion);
		this.potionContainer.addChild(priceCoin);
		this.potionContainer.addChild(this.potionPriceText);
		this.potionContainer.addChild(healText);

		this.charRegionGraphics.addChild(panel);
		this.charRegionGraphics.addChild(trim);
		this.charRegionGraphics.addChild(title);
		this.charRegionGraphics.addChild(this.potionContainer);
	}

	private setupMainLoop() {
		this.previousLife = this.char.life;
		this.previousSpecialBar = this.char.specialBar;
		this.previousUsingSkill = this.char.usingSkill;
		this.previousCredits = this.char.credits;
		this.previousPotionPrice = this._gameLogicService.POTION_PRICE;
		this.creditsDisplayState.value = this.char.credits;
		this.potionPriceDisplayState.value = this._gameLogicService.POTION_PRICE;

		this.app.ticker.add((ticker) => {
			const deltaSeconds = ticker.deltaMS / 1000;

			this.protectedIcon.visible = this.char.isProtected;
			this.updateHeroAltarMotion();
			this.renderLifeBar();
			this.renderSkillPanel();
			this.renderPotionPanel();
			this.updateActiveParticleEmitters(deltaSeconds);
		});
	}

	private renderLifeBar() {
		this.lifeBarDamageTrail.alpha = this.damageTrailState.alpha;
		this.lifeText.text = `${Math.round(this.lifeBarState.displayedLife)}/${this.char.totalLife}`;

		if (this.char.life <= 5 && this.char.life > 0) {
			if (!this.lowLifePulseActive) {
				this.lowLifePulseActive = true;
				gsap.killTweensOf(this.lifeBar);
				gsap.to(this.lifeBar, {
					alpha: 0.35,
					duration: 0.38,
					ease: 'sine.inOut',
					yoyo: true,
					repeat: -1
				});
			}
		} else if (this.lowLifePulseActive) {
			this.lowLifePulseActive = false;
			gsap.killTweensOf(this.lifeBar);
			gsap.to(this.lifeBar, { alpha: 1, duration: 0.22, ease: 'power2.out' });
		}
	}

	private configureBarMask(mask: Graphics) {
		mask.rect(0, 0, this.lifeBarMaxWidth, this.lifeBarHeight).fill({ color: 0xffffff, alpha: 1 });
		mask.alpha = 0.001;
	}

	private renderSkillPanel() {
		if (this.char.specialBar >= 3) {
			this.skillReady.visible = true;
			this.skillOff.alpha = 0.35;

			if (!this.skillPulseActive) {
				this.skillPulseActive = true;
				this.skillReady.alpha = 1;
				gsap.killTweensOf(this.skillReady);
				gsap.to(this.skillReady, {
					alpha: 0.48,
					duration: 0.52,
					ease: 'sine.inOut',
					yoyo: true,
					repeat: -1
				});
			}

			this.skillGlow.alpha = 0.25 + this.skillReady.alpha * 0.16;
			this.skillStateText.text = 'Ready to cast';
		} else {
			if (this.skillPulseActive) {
				this.skillPulseActive = false;
				gsap.killTweensOf(this.skillReady);
			}
			this.skillReady.visible = false;
			this.skillReady.alpha = 1;
			this.skillOff.alpha = 0.92;
			this.skillGlow.alpha = 0.92;
			this.skillStateText.text = `Charge ${this.char.specialBar} / 3`;
		}
	}

	private renderPotionPanel() {
		this.potionContainer.alpha = this.char.credits >= this._gameLogicService.POTION_PRICE ? 1 : 0.78;
	}

	private scaleSpriteToCover(sprite: Sprite, targetWidth: number, targetHeight: number) {
		const textureWidth = sprite.texture.width || sprite.width;
		const textureHeight = sprite.texture.height || sprite.height;
		const scale = Math.max(targetWidth / textureWidth, targetHeight / textureHeight);
		sprite.scale.set(scale);
	}

	private fitTextToWidth(text: Text, maxWidth: number, minScale: number) {
		text.scale.set(1);
		if (text.width > maxWidth) {
			const nextScale = Math.max(minScale, maxWidth / text.width);
			text.scale.set(nextScale);
		}
	}

	public lerp(a1: number, a2: number, t: number): number {
		return a1 * (1 - t) + a2 * t;
	}
}
