import { Sprite, Texture, Graphics, Container, Text } from 'pixi.js';
import { gsap } from 'gsap';
import { Char } from '../char';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';
import { clamp, lerp, mixColor } from '../../math-utils';
import { createGradientTextStyle } from '../../pixi-helpers';
import { COLOR_WHITE } from '../../constants/colors';
import { LIFE_BAR as ANIM } from '../../constants/animation';

const COLOR_DAMAGE_TRAIL = 0xb03030;
const COLOR_HEAL_OVERLAY = 0x46ff8d;
const COLOR_HEAL_PULSE_BRIGHT = 0xc7ff7c;
const COLOR_HEAL_PULSE_MID = 0x4fff97;
const COLOR_HEAL_PULSE_SOFT = 0x8dffc5;

const LIFE_BAR_X_OFFSET = 250;
const LIFE_BAR_Y_OFFSET = 72;
const LIFE_BAR_WIDTH_BASE = 370;
const LIFE_BAR_HEIGHT_BASE = 42;
const HERO_LABEL_Y_OFFSET = 130;
const HIT_BAR_OFFSET_X = 32;
const HIT_BAR_MAX_SIZE = 150;

export class LifeBar {
	public lifeText: Text = new Text({ text: '' });
	public lifeBar!: Sprite;
	public hitBar!: Sprite;
	public lifeBarMaxWidth = 0;
	public lifeBarCenterX = 0;
	public lifeBarCenterY = 0;

	private lifeBarHealOverlay!: Sprite;
	private lifeBarFillContainer!: Container;
	private lifeBarDamageTrailContainer!: Container;
	private lifeBarY = 0;
	public lifeBarHeight = 0;
	private readonly lifeBarState = { percent: 1, displayedLife: 0 };
	public readonly damageTrailState = { percent: 1, alpha: 0 };
	public readonly healPulseState = { progress: 1 };
	public get lifeBarStatePercent(): number { return this.lifeBarState.percent; }
	private lowLifePulseActive = false;
	private lastRenderedLifeText = '';
	private lifeBarMask!: Graphics;
	private damageTrailMask!: Graphics;
	private lifeBarDamageTrail!: Sprite;

	private readonly hudValueStyle = createGradientTextStyle({
		fillStops: ['#fff8dd', '#d1ab59'],
		fontSize: 28,
		strokeWidth: 4
	});

	private readonly heroLabelStyle = createGradientTextStyle({
		fillStops: ['#fff5cf', '#b68946'],
		fontSize: 28,
		strokeWidth: 4,
		letterSpacing: 1
	});

	public setup(heroAltarContainer: Container, portraitCenterX: number, portraitCenterY: number, char: Char): void {
		const heroCrest = SCENE_LAYOUT.game.heroCrest;
		const frameScale = heroCrest.width / getTexture('assets/char_frame.png').width;

		this.initDimensions(heroCrest, frameScale);
		this.initState(char);

		const label = this.createHeroLabel(heroCrest, frameScale, char);
		this.initMasks();
		this.initDamageTrail(frameScale);
		this.initLifeBarFill();
		this.initLifeText(char);
		this.initHitBar(portraitCenterX, portraitCenterY);

		this.applyToParent(heroAltarContainer, label);
	}

	private initDimensions(heroCrest: typeof SCENE_LAYOUT.game.heroCrest, frameScale: number): void {
		const lifeBarX = heroCrest.x + Math.round(LIFE_BAR_X_OFFSET * frameScale);
		const lifeBarY = heroCrest.y + Math.round(LIFE_BAR_Y_OFFSET * frameScale);
		const lifeBarWidth = Math.round(LIFE_BAR_WIDTH_BASE * frameScale);
		const lifeBarHeight = Math.round(LIFE_BAR_HEIGHT_BASE * frameScale);
		this.lifeBarMaxWidth = lifeBarWidth;
		this.lifeBarY = lifeBarY;
		this.lifeBarHeight = lifeBarHeight;
		this.lifeBarCenterX = lifeBarX + lifeBarWidth / 2;
		this.lifeBarCenterY = lifeBarY + lifeBarHeight / 2;
	}

	private initState(char: Char): void {
		const initialPercent = clamp(char.life() / char.totalLife, 0, 1);
		this.lifeBarState.percent = initialPercent;
		this.lifeBarState.displayedLife = char.life();
		this.damageTrailState.percent = initialPercent;
		this.damageTrailState.alpha = 0;
	}

	private createHeroLabel(heroCrest: typeof SCENE_LAYOUT.game.heroCrest, frameScale: number, char: Char): Text {
		const label = new Text({ text: char.charContext.name.toUpperCase(), style: this.heroLabelStyle });
		label.anchor.set(0.5, 0);
		label.x = heroCrest.x + Math.round(LIFE_BAR_X_OFFSET * frameScale) + this.lifeBarMaxWidth / 2;
		label.y = heroCrest.y + Math.round(HERO_LABEL_Y_OFFSET * frameScale);
		return label;
	}

	private initMasks(): void {
		this.lifeBarMask = new Graphics();
		this.configureBarMask(this.lifeBarMask);

		this.damageTrailMask = new Graphics();
		this.configureBarMask(this.damageTrailMask);
	}

	private initDamageTrail(frameScale: number): void {
		const lifeBarX = SCENE_LAYOUT.game.heroCrest.x + Math.round(LIFE_BAR_X_OFFSET * frameScale);
		const lifeBarY = this.lifeBarY;

		this.lifeBarDamageTrail = new Sprite(getTexture('assets/life_bar.png'));
		this.lifeBarDamageTrail.anchor.set(0, 0);
		this.lifeBarDamageTrail.x = 0;
		this.lifeBarDamageTrail.y = 0;
		this.lifeBarDamageTrail.width = this.lifeBarMaxWidth;
		this.lifeBarDamageTrail.height = this.lifeBarHeight;
		this.lifeBarDamageTrail.tint = COLOR_DAMAGE_TRAIL;
		this.lifeBarDamageTrail.alpha = 0;
		this.lifeBarDamageTrailContainer = new Container();
		this.lifeBarDamageTrailContainer.position.set(lifeBarX, lifeBarY);
		this.lifeBarDamageTrailContainer.addChild(this.lifeBarDamageTrail);
		this.lifeBarDamageTrailContainer.addChild(this.damageTrailMask);
		this.lifeBarDamageTrailContainer.mask = this.damageTrailMask;
	}

	private initLifeBarFill(): void {
		const lifeBarX = this.lifeBarCenterX - this.lifeBarMaxWidth / 2;
		const lifeBarY = this.lifeBarY;

		this.lifeBar = new Sprite(getTexture('assets/life_bar.png'));
		this.lifeBar.anchor.set(0, 0);
		this.lifeBar.x = 0;
		this.lifeBar.y = 0;
		this.lifeBar.width = this.lifeBarMaxWidth;
		this.lifeBar.height = this.lifeBarHeight;

		this.lifeBarHealOverlay = new Sprite(Texture.WHITE);
		this.lifeBarHealOverlay.x = 0;
		this.lifeBarHealOverlay.y = 0;
		this.lifeBarHealOverlay.width = this.lifeBarMaxWidth;
		this.lifeBarHealOverlay.height = this.lifeBarHeight;
		this.lifeBarHealOverlay.alpha = 0;
		this.lifeBarHealOverlay.tint = COLOR_HEAL_OVERLAY;
		this.lifeBarFillContainer = new Container();
		this.lifeBarFillContainer.position.set(lifeBarX, lifeBarY);
		this.lifeBarFillContainer.addChild(this.lifeBar);
		this.lifeBarFillContainer.addChild(this.lifeBarHealOverlay);
		this.lifeBarFillContainer.addChild(this.lifeBarMask);
		this.lifeBarFillContainer.mask = this.lifeBarMask;
	}

	private initLifeText(char: Char): void {
		this.lifeText = new Text({ text: `${char.life()}/${char.totalLife}`, style: this.hudValueStyle });
		this.lifeText.anchor.set(0.5);
		this.lifeText.x = this.lifeBarCenterX;
		this.lifeText.y = this.lifeBarCenterY;
	}

	private initHitBar(portraitCenterX: number, portraitCenterY: number): void {
		this.hitBar = new Sprite(getTexture('assets/hit.png'));
		this.hitBar.alpha = 0;
		this.hitBar.anchor.set(0.5);
		this.hitBar.x = portraitCenterX - HIT_BAR_OFFSET_X;
		this.hitBar.y = portraitCenterY;
		this.hitBar.scale.x = this.hitBar.scale.y = Math.min(HIT_BAR_MAX_SIZE / this.hitBar.width, HIT_BAR_MAX_SIZE / this.hitBar.height);
	}

	private applyToParent(parent: Container, label: Text): void {
		parent.addChild(this.lifeBarDamageTrailContainer);
		parent.addChild(this.lifeBarFillContainer);

		this.lifeBarMask.scale.x = this.lifeBarState.percent;
		this.damageTrailMask.scale.x = this.damageTrailState.percent;

		parent.addChild(this.lifeText);
		parent.addChild(label);
		parent.addChild(this.hitBar);
	}

	public playDamageLifeTween(percent: number, charLife: number): void {
		const oldPercent = this.lifeBarState.percent;
		const clampedPercent = clamp(percent, 0, 1);

		gsap.killTweensOf([this.lifeBarState, this.lifeBarMask.scale, this.lifeBarHealOverlay, this.healPulseState, this.damageTrailState, this.damageTrailMask.scale, this.lifeBarDamageTrail, this.lifeText.scale]);
		this.lifeBarHealOverlay.alpha = 0;

		gsap
			.timeline({ overwrite: true })
			.to(this.lifeBarMask.scale, { x: Math.min(1, oldPercent + ANIM.DAMAGE_BAR_OVERSHOOT), duration: ANIM.DURATION.DAMAGE_BAR_BUMP, ease: 'power1.out' })
			.to(this.lifeBarMask.scale, { x: clampedPercent, duration: ANIM.DURATION.DAMAGE_BAR_SHRINK, ease: 'power4.inOut' });

		this.lifeBarState.percent = clampedPercent;

		gsap.to(this.lifeBarState, {
			displayedLife: charLife,
			duration: ANIM.DURATION.DAMAGE_LIFE_DISPLAY,
			ease: 'power2.out',
			overwrite: true
		});

		gsap.fromTo(this.lifeText.scale, { x: ANIM.SCALE.DAMAGE_TEXT_PEAK, y: ANIM.SCALE.DAMAGE_TEXT_PEAK }, { x: 1, y: 1, duration: ANIM.DURATION.DAMAGE_TEXT_SCALE, ease: 'back.out(3)' });

		this.damageTrailMask.scale.x = oldPercent;
		this.lifeBarDamageTrail.alpha = ANIM.ALPHA.DAMAGE_TRAIL;
		this.damageTrailState.alpha = ANIM.ALPHA.DAMAGE_TRAIL;
		gsap
			.timeline({ overwrite: true })
			.to(this.damageTrailMask.scale, { x: clampedPercent, duration: ANIM.DURATION.DAMAGE_TRAIL, ease: 'power2.out' })
			.to(this.lifeBarDamageTrail, { alpha: 0, duration: ANIM.DURATION.DAMAGE_TRAIL, ease: 'power2.in' }, 0);
		gsap.to(this.damageTrailState, { alpha: 0, duration: ANIM.DURATION.DAMAGE_TRAIL, ease: 'power2.in', overwrite: true });
	}

	public playHealLifeTween(percent: number, charLife: number): void {
		const clampedPercent = clamp(percent, 0, 1);
		const percentGain = Math.max(0, clampedPercent - this.lifeBarState.percent);
		const overshootPercent = Math.min(1, clampedPercent + Math.max(ANIM.HEAL_OVERSHOOT_BASE, percentGain * ANIM.HEAL_OVERSHOOT_GAIN_FACTOR));

		gsap.killTweensOf([this.lifeBarState, this.lifeBarMask.scale, this.lifeText.scale, this.healPulseState, this.lifeBarHealOverlay, this.damageTrailState, this.damageTrailMask.scale, this.lifeBarDamageTrail]);
		this.damageTrailState.alpha = 0;
		this.lifeBarDamageTrail.alpha = 0;

		gsap
			.timeline({ overwrite: true })
			.to(this.lifeBarMask.scale, { x: overshootPercent, duration: ANIM.DURATION.HEAL_BAR_RISE, ease: 'power2.out' })
			.to(this.lifeBarMask.scale, { x: clampedPercent, duration: ANIM.DURATION.HEAL_BAR_SETTLE, ease: 'back.out(1.4)' });

		this.lifeBarState.percent = clampedPercent;

		gsap.to(this.lifeBarState, {
			displayedLife: charLife,
			duration: ANIM.DURATION.HEAL_LIFE_DISPLAY,
			ease: 'power2.out',
			overwrite: true
		});

		gsap.fromTo(this.lifeText.scale, { x: ANIM.SCALE.HEAL_TEXT_PEAK, y: ANIM.SCALE.HEAL_TEXT_PEAK }, { x: 1, y: 1, duration: ANIM.DURATION.HEAL_BAR_SETTLE, ease: 'back.out(2.2)' });

		this.healPulseState.progress = 0;
		this.lifeBarHealOverlay.alpha = 0;
		gsap.to(this.healPulseState, {
			progress: 1,
			duration: ANIM.DURATION.HEAL_OVERLAY_PULSE,
			ease: 'sine.inOut',
			onUpdate: () => this.applyHealColorPulse(this.healPulseState.progress),
			onComplete: () => {
				this.lifeBarHealOverlay.alpha = 0;
			}
		});
	}

	public killLifeTextTween(): void {
		gsap.killTweensOf(this.lifeText.scale);
		this.lifeText.scale.set(1);
	}

	public killHealOverlayTween(): void {
		gsap.killTweensOf(this.lifeBarHealOverlay);
		this.lifeBarHealOverlay.alpha = 0;
	}

	public renderLifeBar(char: Char): void {
		this.lifeBarDamageTrail.alpha = this.damageTrailState.alpha;

		const lifeText = `${Math.round(this.lifeBarState.displayedLife)}/${char.totalLife}`;
		if (lifeText !== this.lastRenderedLifeText) {
			this.lastRenderedLifeText = lifeText;
			this.lifeText.text = lifeText;
		}

		if (char.life() <= ANIM.LOW_LIFE_THRESHOLD && char.life() > 0) {
			if (!this.lowLifePulseActive) {
				this.lowLifePulseActive = true;
				gsap.killTweensOf(this.lifeBar);
				gsap.to(this.lifeBar, {
					alpha: ANIM.ALPHA.LOW_LIFE_PULSE,
					duration: ANIM.DURATION.LOW_LIFE_PULSE,
					ease: 'sine.inOut',
					yoyo: true,
					repeat: -1
				});
			}
		} else if (this.lowLifePulseActive) {
			this.lowLifePulseActive = false;
			gsap.killTweensOf(this.lifeBar);
			gsap.to(this.lifeBar, { alpha: 1, duration: ANIM.DURATION.LOW_LIFE_RECOVER, ease: 'power2.out' });
		}
	}

	public destroy(): void {
		gsap.killTweensOf([
			this.lifeBarState, this.lifeBarMask?.scale, this.lifeBarHealOverlay,
			this.healPulseState, this.damageTrailState, this.damageTrailMask?.scale,
			this.lifeBarDamageTrail, this.lifeText.scale, this.lifeBar
		]);
	}

	private applyHealColorPulse(progress: number): void {
		const clampedProgress = clamp(progress, 0, 1);

		if (clampedProgress < ANIM.HEAL_PULSE_RISE_END) {
			const riseAmount = clampedProgress / ANIM.HEAL_PULSE_RISE_END;
			this.lifeBarHealOverlay.tint = mixColor(COLOR_HEAL_PULSE_BRIGHT, COLOR_HEAL_PULSE_MID, riseAmount);
			this.lifeBarHealOverlay.alpha = lerp(0, ANIM.ALPHA.HEAL_PULSE_PEAK, riseAmount);
			return;
		}

		if (clampedProgress < ANIM.HEAL_PULSE_HOLD_END) {
			const holdAmount = (clampedProgress - ANIM.HEAL_PULSE_RISE_END) / (ANIM.HEAL_PULSE_HOLD_END - ANIM.HEAL_PULSE_RISE_END);
			this.lifeBarHealOverlay.tint = mixColor(COLOR_HEAL_PULSE_MID, COLOR_HEAL_PULSE_SOFT, holdAmount);
			this.lifeBarHealOverlay.alpha = lerp(ANIM.ALPHA.HEAL_PULSE_PEAK, ANIM.ALPHA.HEAL_PULSE_HOLD, holdAmount);
			return;
		}

		const fallAmount = (clampedProgress - ANIM.HEAL_PULSE_HOLD_END) / (1 - ANIM.HEAL_PULSE_HOLD_END);
		this.lifeBarHealOverlay.tint = mixColor(COLOR_HEAL_PULSE_SOFT, COLOR_HEAL_PULSE_MID, fallAmount);
		this.lifeBarHealOverlay.alpha = lerp(ANIM.ALPHA.HEAL_PULSE_HOLD, 0, fallAmount);
	}

	private configureBarMask(mask: Graphics): void {
		mask.rect(0, 0, this.lifeBarMaxWidth, this.lifeBarHeight).fill({ color: COLOR_WHITE, alpha: 1 });
	}
}
