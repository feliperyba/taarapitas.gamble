import { Container, Sprite } from 'pixi.js';
import { gsap } from 'gsap';
import { SCREEN_EFFECTS as ANIM } from '../../constants/animation';

const COLOR_DAMAGE_FLASH = 0xe01818;
const COLOR_PROTECTED_FLASH = 0x4da6ff;

interface ShakeConfig {
	shakeOffsets: { x: number; duration: number; ease: string }[];
	flashColor: number;
	flashSteps: { alpha: number; duration: number; ease: string }[];
	settleDuration: number;
	settleEase: string;
	scaleShrink: number;
	scaleRecoverDuration: number;
	scaleEase: string;
}

const DAMAGE_SHAKE_CONFIG: ShakeConfig = {
	shakeOffsets: [
		{ x: ANIM.SHAKE.DAMAGE_X_PRIMARY, duration: ANIM.DURATION.DAMAGE_SHAKE_PRIMARY, ease: 'power1.inOut' },
		{ x: ANIM.SHAKE.DAMAGE_X_SECONDARY, duration: ANIM.DURATION.DAMAGE_SHAKE_SECONDARY, ease: 'power1.inOut' },
		{ x: ANIM.SHAKE.DAMAGE_X_TERTIARY, duration: ANIM.DURATION.DAMAGE_SHAKE_TERTIARY, ease: 'power1.inOut' }
	],
	flashColor: COLOR_DAMAGE_FLASH,
	flashSteps: [
		{ alpha: ANIM.ALPHA.DAMAGE_FLASH_PEAK, duration: ANIM.DURATION.DAMAGE_FLASH_RISE, ease: 'power2.out' },
		{ alpha: ANIM.ALPHA.DAMAGE_FLASH_DIP, duration: ANIM.DURATION.DAMAGE_FLASH_DIP, ease: 'power2.in' },
		{ alpha: ANIM.ALPHA.DAMAGE_FLASH_BURST, duration: ANIM.DURATION.DAMAGE_FLASH_BURST, ease: 'power2.out' },
		{ alpha: 0, duration: ANIM.DURATION.DAMAGE_FLASH_FADE, ease: 'power2.out' }
	],
	settleDuration: ANIM.DURATION.DAMAGE_SHAKE_SETTLE,
	settleEase: 'power3.out',
	scaleShrink: ANIM.SCALE.DAMAGE_ALTAR_SHRINK,
	scaleRecoverDuration: ANIM.DURATION.DAMAGE_SCALE_RECOVER,
	scaleEase: 'back.out(2.5)'
};

const PROTECTED_SHAKE_CONFIG: ShakeConfig = {
	shakeOffsets: [
		{ x: ANIM.SHAKE.PROTECTED_X_PRIMARY, duration: ANIM.DURATION.PROTECTED_SHAKE_PRIMARY, ease: 'power1.inOut' },
		{ x: ANIM.SHAKE.PROTECTED_X_SECONDARY, duration: ANIM.DURATION.PROTECTED_SHAKE_SECONDARY, ease: 'power1.inOut' }
	],
	flashColor: COLOR_PROTECTED_FLASH,
	flashSteps: [
		{ alpha: ANIM.ALPHA.PROTECTED_FLASH_PEAK, duration: ANIM.DURATION.PROTECTED_FLASH_RISE, ease: 'power2.out' },
		{ alpha: 0, duration: ANIM.DURATION.PROTECTED_FLASH_FADE, ease: 'power2.out' }
	],
	settleDuration: ANIM.DURATION.PROTECTED_SHAKE_SETTLE,
	settleEase: 'power3.out',
	scaleShrink: ANIM.SCALE.PROTECTED_ALTAR_SHRINK,
	scaleRecoverDuration: ANIM.DURATION.PROTECTED_SCALE_RECOVER,
	scaleEase: 'back.out(2)'
};

export class ScreenShakeEffects {
	private altarContainer!: Container;
	private heroFrameFlash!: Sprite;
	private hitBar!: Sprite;
	private damageShakePlaying = false;
	private protectedShakePlaying = false;

	public setup(altarContainer: Container, heroFrameFlash: Sprite, hitBar: Sprite): void {
		this.altarContainer = altarContainer;
		this.heroFrameFlash = heroFrameFlash;
		this.hitBar = hitBar;
	}

	public playDamageShake(): void {
		if (this.damageShakePlaying) return;
		this.damageShakePlaying = true;
		this.playShakeEffect(DAMAGE_SHAKE_CONFIG, () => { this.damageShakePlaying = false; });
	}

	public playProtectedShake(): void {
		if (this.protectedShakePlaying) return;
		this.protectedShakePlaying = true;
		this.playShakeEffect(PROTECTED_SHAKE_CONFIG, () => { this.protectedShakePlaying = false; });
	}

	public destroy(): void {
		gsap.killTweensOf([this.altarContainer, this.altarContainer?.scale, this.heroFrameFlash, this.hitBar, this.hitBar?.scale]);
	}

	private playShakeEffect(config: ShakeConfig, onComplete: () => void): void {
		gsap.killTweensOf([this.altarContainer, this.altarContainer.scale, this.heroFrameFlash, this.hitBar]);
		this.altarContainer.scale.set(1);

		const tl = gsap.timeline({ onComplete });
		for (const step of config.shakeOffsets) {
			tl.to(this.altarContainer, { x: step.x, duration: step.duration, ease: step.ease });
		}
		tl.to(this.altarContainer, { x: 0, duration: config.settleDuration, ease: config.settleEase });

		const flashTl = gsap.timeline();
		flashTl.set(this.heroFrameFlash, { tint: config.flashColor, alpha: 0 });
		for (const step of config.flashSteps) {
			flashTl.to(this.heroFrameFlash, { alpha: step.alpha, duration: step.duration, ease: step.ease });
		}

		gsap.fromTo(this.hitBar, { alpha: 1 }, { alpha: 0, duration: ANIM.DURATION.HIT_FADE, ease: 'power2.out' });
		gsap.fromTo(this.hitBar.scale, { x: ANIM.SCALE.HIT_START, y: ANIM.SCALE.HIT_START }, { x: 1, y: 1, duration: ANIM.DURATION.HIT_SCALE, ease: 'power2.out' });
		gsap.fromTo(
			this.altarContainer.scale,
			{ x: config.scaleShrink, y: config.scaleShrink },
			{ x: 1, y: 1, duration: config.scaleRecoverDuration, ease: config.scaleEase }
		);
	}
}
