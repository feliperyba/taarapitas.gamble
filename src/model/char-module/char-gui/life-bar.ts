import { Sprite, Texture, Graphics, Container, Text } from 'pixi.js';
import { gsap } from 'gsap';
import { Char } from '../char';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';
import { clamp, lerp, hexToRgb, rgbToHex } from '../../math-utils';
import { createGradientTextStyle } from '../../pixi-helpers';

const COLOR_WHITE = 0xffffff;
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

const DURATION_DAMAGE_BAR_BUMP = 0.04;
const DURATION_DAMAGE_BAR_SHRINK = 0.32;
const DURATION_DAMAGE_LIFE_DISPLAY = 0.36;
const DURATION_DAMAGE_TEXT_SCALE = 0.4;
const DURATION_DAMAGE_TRAIL = 1.1;
const DURATION_HEAL_BAR_RISE = 0.38;
const DURATION_HEAL_BAR_SETTLE = 0.92;
const DURATION_HEAL_LIFE_DISPLAY = 1.42;
const DURATION_HEAL_OVERLAY_PULSE = 1.72;
const DURATION_LOW_LIFE_PULSE = 0.38;
const DURATION_LOW_LIFE_RECOVER = 0.22;

const ALPHA_DAMAGE_TRAIL = 0.85;
const ALPHA_HEAL_PULSE_PEAK = 0.94;
const ALPHA_HEAL_PULSE_HOLD = 0.68;
const ALPHA_LOW_LIFE_PULSE = 0.35;

const SCALE_DAMAGE_TEXT_PEAK = 1.35;
const SCALE_HEAL_TEXT_PEAK = 1.28;

const HEAL_PULSE_RISE_END = 0.22;
const HEAL_PULSE_HOLD_END = 0.78;
const HEAL_OVERSHOOT_BASE = 0.05;
const HEAL_OVERSHOOT_GAIN_FACTOR = 0.28;

const DAMAGE_BAR_OVERSHOOT = 0.02;

const LOW_LIFE_THRESHOLD = 5;

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
		const label = new Text({ text: char.charContext.name.toUpperCase(), style: this.heroLabelStyle });
		const lifeBarX = heroCrest.x + Math.round(LIFE_BAR_X_OFFSET * frameScale);
		const lifeBarY = heroCrest.y + Math.round(LIFE_BAR_Y_OFFSET * frameScale);
		const lifeBarWidth = Math.round(LIFE_BAR_WIDTH_BASE * frameScale);
		const lifeBarHeight = Math.round(LIFE_BAR_HEIGHT_BASE * frameScale);
		this.lifeBarMaxWidth = lifeBarWidth;
		this.lifeBarY = lifeBarY;
		this.lifeBarHeight = lifeBarHeight;
		this.lifeBarCenterX = lifeBarX + lifeBarWidth / 2;
		this.lifeBarCenterY = lifeBarY + lifeBarHeight / 2;

		const initialPercent = clamp(char.life / char.totalLife, 0, 1);
		this.lifeBarState.percent = initialPercent;
		this.lifeBarState.displayedLife = char.life;
		this.damageTrailState.percent = initialPercent;
		this.damageTrailState.alpha = 0;

		label.anchor.set(0.5, 0);
		label.x = lifeBarX + lifeBarWidth / 2;
		label.y = heroCrest.y + Math.round(HERO_LABEL_Y_OFFSET * frameScale);

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
		this.lifeBarDamageTrail.tint = COLOR_DAMAGE_TRAIL;
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
		this.lifeBarHealOverlay.tint = COLOR_HEAL_OVERLAY;
		this.lifeBarFillContainer = new Container();
		this.lifeBarFillContainer.position.set(lifeBarX, lifeBarY);
		this.lifeBarFillContainer.addChild(this.lifeBar);
		this.lifeBarFillContainer.addChild(this.lifeBarHealOverlay);
		this.lifeBarFillContainer.addChild(this.lifeBarMask);
		this.lifeBarFillContainer.mask = this.lifeBarMask;

		this.lifeText = new Text({ text: `${char.life}/${char.totalLife}`, style: this.hudValueStyle });
		this.lifeText.anchor.set(0.5);
		this.lifeText.x = lifeBarX + lifeBarWidth / 2;
		this.lifeText.y = lifeBarY + lifeBarHeight / 2;

		this.hitBar = new Sprite(getTexture('assets/hit.png'));
		this.hitBar.alpha = 0;
		this.hitBar.anchor.set(0.5);
		this.hitBar.x = portraitCenterX - HIT_BAR_OFFSET_X;
		this.hitBar.y = portraitCenterY;
		this.hitBar.scale.x = this.hitBar.scale.y = Math.min(HIT_BAR_MAX_SIZE / this.hitBar.width, HIT_BAR_MAX_SIZE / this.hitBar.height);

		heroAltarContainer.addChild(this.lifeBarDamageTrailContainer);
		heroAltarContainer.addChild(this.lifeBarFillContainer);

		this.lifeBarMask.scale.x = initialPercent;
		this.damageTrailMask.scale.x = initialPercent;

		heroAltarContainer.addChild(this.lifeText);
		heroAltarContainer.addChild(label);
		heroAltarContainer.addChild(this.hitBar);
	}

	public playDamageLifeTween(percent: number, charLife: number): void {
		const oldPercent = this.lifeBarState.percent;
		const clampedPercent = clamp(percent, 0, 1);

		gsap.killTweensOf([this.lifeBarState, this.lifeBarMask.scale, this.lifeBarHealOverlay, this.healPulseState, this.damageTrailState, this.damageTrailMask.scale, this.lifeBarDamageTrail, this.lifeText.scale]);
		this.lifeBarHealOverlay.alpha = 0;

		gsap
			.timeline({ overwrite: true })
			.to(this.lifeBarMask.scale, { x: Math.min(1, oldPercent + DAMAGE_BAR_OVERSHOOT), duration: DURATION_DAMAGE_BAR_BUMP, ease: 'power1.out' })
			.to(this.lifeBarMask.scale, { x: clampedPercent, duration: DURATION_DAMAGE_BAR_SHRINK, ease: 'power4.inOut' });

		this.lifeBarState.percent = clampedPercent;

		gsap.to(this.lifeBarState, {
			displayedLife: charLife,
			duration: DURATION_DAMAGE_LIFE_DISPLAY,
			ease: 'power2.out',
			overwrite: true
		});

		gsap.fromTo(this.lifeText.scale, { x: SCALE_DAMAGE_TEXT_PEAK, y: SCALE_DAMAGE_TEXT_PEAK }, { x: 1, y: 1, duration: DURATION_DAMAGE_TEXT_SCALE, ease: 'back.out(3)' });

		this.damageTrailMask.scale.x = oldPercent;
		this.lifeBarDamageTrail.alpha = ALPHA_DAMAGE_TRAIL;
		this.damageTrailState.alpha = ALPHA_DAMAGE_TRAIL;
		gsap
			.timeline({ overwrite: true })
			.to(this.damageTrailMask.scale, { x: clampedPercent, duration: DURATION_DAMAGE_TRAIL, ease: 'power2.out' })
			.to(this.lifeBarDamageTrail, { alpha: 0, duration: DURATION_DAMAGE_TRAIL, ease: 'power2.in' }, 0);
		gsap.to(this.damageTrailState, { alpha: 0, duration: DURATION_DAMAGE_TRAIL, ease: 'power2.in', overwrite: true });
	}

	public playHealLifeTween(percent: number, charLife: number): void {
		const clampedPercent = clamp(percent, 0, 1);
		const percentGain = Math.max(0, clampedPercent - this.lifeBarState.percent);
		const overshootPercent = Math.min(1, clampedPercent + Math.max(HEAL_OVERSHOOT_BASE, percentGain * HEAL_OVERSHOOT_GAIN_FACTOR));

		gsap.killTweensOf([this.lifeBarState, this.lifeBarMask.scale, this.lifeText.scale, this.healPulseState, this.lifeBarHealOverlay, this.damageTrailState, this.damageTrailMask.scale, this.lifeBarDamageTrail]);
		this.damageTrailState.alpha = 0;
		this.lifeBarDamageTrail.alpha = 0;

		gsap
			.timeline({ overwrite: true })
			.to(this.lifeBarMask.scale, { x: overshootPercent, duration: DURATION_HEAL_BAR_RISE, ease: 'power2.out' })
			.to(this.lifeBarMask.scale, { x: clampedPercent, duration: DURATION_HEAL_BAR_SETTLE, ease: 'back.out(1.4)' });

		this.lifeBarState.percent = clampedPercent;

		gsap.to(this.lifeBarState, {
			displayedLife: charLife,
			duration: DURATION_HEAL_LIFE_DISPLAY,
			ease: 'power2.out',
			overwrite: true
		});

		gsap.fromTo(this.lifeText.scale, { x: SCALE_HEAL_TEXT_PEAK, y: SCALE_HEAL_TEXT_PEAK }, { x: 1, y: 1, duration: DURATION_HEAL_BAR_SETTLE, ease: 'back.out(2.2)' });

		this.healPulseState.progress = 0;
		this.lifeBarHealOverlay.alpha = 0;
		gsap.to(this.healPulseState, {
			progress: 1,
			duration: DURATION_HEAL_OVERLAY_PULSE,
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

		if (char.life <= LOW_LIFE_THRESHOLD && char.life > 0) {
			if (!this.lowLifePulseActive) {
				this.lowLifePulseActive = true;
				gsap.killTweensOf(this.lifeBar);
				gsap.to(this.lifeBar, {
					alpha: ALPHA_LOW_LIFE_PULSE,
					duration: DURATION_LOW_LIFE_PULSE,
					ease: 'sine.inOut',
					yoyo: true,
					repeat: -1
				});
			}
		} else if (this.lowLifePulseActive) {
			this.lowLifePulseActive = false;
			gsap.killTweensOf(this.lifeBar);
			gsap.to(this.lifeBar, { alpha: 1, duration: DURATION_LOW_LIFE_RECOVER, ease: 'power2.out' });
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

		if (clampedProgress < HEAL_PULSE_RISE_END) {
			const riseAmount = clampedProgress / HEAL_PULSE_RISE_END;
			this.lifeBarHealOverlay.tint = this.mixColor(COLOR_HEAL_PULSE_BRIGHT, COLOR_HEAL_PULSE_MID, riseAmount);
			this.lifeBarHealOverlay.alpha = lerp(0, ALPHA_HEAL_PULSE_PEAK, riseAmount);
			return;
		}

		if (clampedProgress < HEAL_PULSE_HOLD_END) {
			const holdAmount = (clampedProgress - HEAL_PULSE_RISE_END) / (HEAL_PULSE_HOLD_END - HEAL_PULSE_RISE_END);
			this.lifeBarHealOverlay.tint = this.mixColor(COLOR_HEAL_PULSE_MID, COLOR_HEAL_PULSE_SOFT, holdAmount);
			this.lifeBarHealOverlay.alpha = lerp(ALPHA_HEAL_PULSE_PEAK, ALPHA_HEAL_PULSE_HOLD, holdAmount);
			return;
		}

		const fallAmount = (clampedProgress - HEAL_PULSE_HOLD_END) / (1 - HEAL_PULSE_HOLD_END);
		this.lifeBarHealOverlay.tint = this.mixColor(COLOR_HEAL_PULSE_SOFT, COLOR_HEAL_PULSE_MID, fallAmount);
		this.lifeBarHealOverlay.alpha = lerp(ALPHA_HEAL_PULSE_HOLD, 0, fallAmount);
	}

	private configureBarMask(mask: Graphics): void {
		mask.rect(0, 0, this.lifeBarMaxWidth, this.lifeBarHeight).fill({ color: COLOR_WHITE, alpha: 1 });
		mask.alpha = 0.001;
	}

	private mixColor(from: number, to: number, amount: number): number {
		const clampedAmount = clamp(amount, 0, 1);
		const fromRgb = hexToRgb(from);
		const toRgb = hexToRgb(to);

		return rgbToHex(
			Math.round(lerp(fromRgb.r, toRgb.r, clampedAmount)),
			Math.round(lerp(fromRgb.g, toRgb.g, clampedAmount)),
			Math.round(lerp(fromRgb.b, toRgb.b, clampedAmount))
		);
	}
}
