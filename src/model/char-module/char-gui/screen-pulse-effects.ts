import { Container, Sprite, ColorMatrixFilter, Filter } from 'pixi.js';
import { gsap } from 'gsap';
import { mixColor } from '../../math-utils';
import { SCREEN_EFFECTS as ANIM } from '../../constants/animation';
import { SCREEN_PULSE } from '../../constants/animation';
import { COLOR_WHITE } from '../../constants/colors';
const COLOR_DAMAGE_PULSE = 0xff6c63;
const COLOR_HEAL_FLASH = 0xff88d7;
const COLOR_HEAL_BURST_PULSE = 0xff9ce6;
const COLOR_SKILL_GOLD = 0xffd27a;

export class ScreenPulseEffects {
	private altarContainer!: Container;
	private heroFrame!: Sprite;
	private heroFrameFlash!: Sprite;
	private readonly stagePulseFilter = new ColorMatrixFilter();
	private readonly stagePulseState = { mix: 0, brightnessDelta: 0 };
	private stagePulseColor = COLOR_WHITE;
	private pulseFilterAttached = false;

	public setup(altarContainer: Container, heroFrame: Sprite, heroFrameFlash: Sprite): void {
		this.altarContainer = altarContainer;
		this.heroFrame = heroFrame;
		this.heroFrameFlash = heroFrameFlash;
	}

	public playDamageScreenPulse(): void {
		this.playScreenPulse(COLOR_DAMAGE_PULSE, SCREEN_PULSE.DAMAGE.PEAK_MIX, SCREEN_PULSE.DAMAGE.BRIGHTNESS_DELTA, SCREEN_PULSE.DAMAGE.DURATION);
	}

	public playHealPulse(): void {
		gsap.killTweensOf([this.altarContainer.scale, this.heroFrameFlash]);

		gsap.fromTo(
			this.altarContainer.scale,
			{ x: ANIM.SCALE.HEAL_ALTAR_START, y: ANIM.SCALE.HEAL_ALTAR_START },
			{ x: ANIM.SCALE.HEAL_ALTAR_PEAK, y: ANIM.SCALE.HEAL_ALTAR_PEAK, duration: ANIM.DURATION.HEAL_PULSE_SCALE, ease: 'power2.out', yoyo: true, repeat: 1 }
		);

		gsap
			.timeline()
			.set(this.heroFrameFlash, { tint: COLOR_HEAL_FLASH, alpha: 0 })
			.to(this.heroFrameFlash, { alpha: ANIM.ALPHA.HEAL_FLASH_RISE, duration: ANIM.DURATION.HEAL_FLASH_RISE, ease: 'power2.out' })
			.to(this.heroFrameFlash, { alpha: ANIM.ALPHA.HEAL_FLASH_DIP, duration: ANIM.DURATION.HEAL_FLASH_DIP, ease: 'power2.inOut' })
			.to(this.heroFrameFlash, { alpha: 0, duration: ANIM.DURATION.HEAL_FLASH_FADE, ease: 'power2.out' });
	}

	public playHealBurstScreenPulse(): void {
		this.playScreenPulse(COLOR_HEAL_BURST_PULSE, SCREEN_PULSE.HEAL.PEAK_MIX, SCREEN_PULSE.HEAL.BRIGHTNESS_DELTA, SCREEN_PULSE.HEAL.DURATION);
	}

	public playSkillPulse(): void {
		gsap.killTweensOf(this.altarContainer.scale);
		gsap
			.timeline()
			.to(this.heroFrame, { tint: COLOR_SKILL_GOLD, duration: ANIM.DURATION.SKILL_TINT_IN, ease: 'power2.out' })
			.to(this.heroFrame, { tint: COLOR_WHITE, duration: ANIM.DURATION.SKILL_TINT_OUT, ease: 'power2.out' }, '>');
		gsap.fromTo(
			this.altarContainer.scale,
			{ x: ANIM.SCALE.SKILL_PEAK, y: ANIM.SCALE.SKILL_PEAK },
			{ x: 1, y: 1, duration: ANIM.DURATION.SKILL_SCALE_RECOVER, ease: `elastic.out(1, ${SCREEN_PULSE.ELASTICITY})` }
		);
	}

	public destroy(): void {
		gsap.killTweensOf([this.altarContainer?.scale, this.heroFrameFlash, this.heroFrame, this.stagePulseState]);
		this.detachPulseFilter();
		this.stagePulseFilter.destroy();
	}

	private playScreenPulse(color: number, peakMix: number, brightnessDelta: number, duration: number): void {
		this.stagePulseColor = color;
		this.stagePulseState.mix = 0;
		this.stagePulseState.brightnessDelta = brightnessDelta;
		gsap.killTweensOf(this.stagePulseState);

		gsap.timeline({
			onStart: () => this.attachPulseFilter(),
			onUpdate: () => this.applyPulseFilterValues(),
			onComplete: () => {
				this.stagePulseState.mix = 0;
				this.detachPulseFilter();
			}
		})
			.to(this.stagePulseState, { mix: peakMix, duration: duration * ANIM.PULSE.RISE_RATIO, ease: 'power2.out' })
			.to(this.stagePulseState, { mix: 0, duration: duration * ANIM.PULSE.FALL_RATIO, ease: 'power2.inOut' });
	}

	private attachPulseFilter(): void {
		if (this.pulseFilterAttached) return;
		const existing = this.altarContainer.filters as Filter[] | null;
		this.altarContainer.filters = existing ? [...existing, this.stagePulseFilter] : [this.stagePulseFilter];
		this.pulseFilterAttached = true;
	}

	private detachPulseFilter(): void {
		if (!this.pulseFilterAttached) return;
		const existing = this.altarContainer.filters as Filter[] | null;
		if (existing) {
			this.altarContainer.filters = existing.filter((f: Filter) => f !== this.stagePulseFilter);
		}
		this.pulseFilterAttached = false;
	}

	private applyPulseFilterValues(): void {
		this.stagePulseFilter.reset();
		this.stagePulseFilter.tint(mixColor(COLOR_WHITE, this.stagePulseColor, this.stagePulseState.mix), false);
		this.stagePulseFilter.brightness(1 + this.stagePulseState.brightnessDelta * this.stagePulseState.mix, true);
	}
}
