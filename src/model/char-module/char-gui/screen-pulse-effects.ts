import { Application, Container, Sprite, ColorMatrixFilter } from 'pixi.js';
import { gsap } from 'gsap';
import { mixColor } from '../../math-utils';
import { SCREEN_EFFECTS as ANIM } from '../../constants/animation';

const COLOR_WHITE = 0xffffff;
const COLOR_DAMAGE_PULSE = 0xff6c63;
const COLOR_HEAL_FLASH = 0xff88d7;
const COLOR_HEAL_BURST_PULSE = 0xff9ce6;
const COLOR_SKILL_GOLD = 0xffd27a;

export class ScreenPulseEffects {
	private app!: Application;
	private altarContainer!: Container;
	private heroFrame!: Sprite;
	private heroFrameFlash!: Sprite;
	private readonly stagePulseFilter = new ColorMatrixFilter();
	private readonly stagePulseState = { mix: 0, brightnessDelta: 0 };
	private stagePulseColor = COLOR_WHITE;
	private stagePulseFilterAttached = false;

	public setup(app: Application, altarContainer: Container, heroFrame: Sprite, heroFrameFlash: Sprite): void {
		this.app = app;
		this.altarContainer = altarContainer;
		this.heroFrame = heroFrame;
		this.heroFrameFlash = heroFrameFlash;
	}

	public playDamageScreenPulse(): void {
		this.playScreenPulse(COLOR_DAMAGE_PULSE, 0.3, -0.18, 0.38);
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
		this.playScreenPulse(COLOR_HEAL_BURST_PULSE, 0.24, 0.12, 0.78);
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
			{ x: 1, y: 1, duration: ANIM.DURATION.SKILL_SCALE_RECOVER, ease: 'elastic.out(1, 0.52)' }
		);
	}

	public destroy(): void {
		gsap.killTweensOf([this.altarContainer?.scale, this.heroFrameFlash, this.heroFrame, this.stagePulseState]);
		const stageFilters = this.app?.stage?.filters;
		if (stageFilters) {
			this.app.stage.filters = stageFilters.filter(f => f !== this.stagePulseFilter);
		}
		this.stagePulseFilter.destroy();
	}

	private playScreenPulse(color: number, peakMix: number, brightnessDelta: number, duration: number): void {
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
			.to(this.stagePulseState, { mix: peakMix, duration: duration * ANIM.PULSE.RISE_RATIO, ease: 'power2.out' })
			.to(this.stagePulseState, { mix: 0, duration: duration * ANIM.PULSE.FALL_RATIO, ease: 'power2.inOut' });
	}

	private updateStagePulseFilter(): void {
		if (this.stagePulseState.mix <= ANIM.PULSE.THRESHOLD) {
			if (this.stagePulseFilterAttached) {
				this.stagePulseFilter.reset();
				const stageFilters = this.app.stage.filters;
				if (stageFilters) {
					this.app.stage.filters = stageFilters.filter(f => f !== this.stagePulseFilter);
				}
				this.stagePulseFilterAttached = false;
			}
			return;
		}

		if (!this.stagePulseFilterAttached) {
			const stageFilters = this.app.stage.filters ?? [];
			this.app.stage.filters = [...stageFilters, this.stagePulseFilter];
			this.stagePulseFilterAttached = true;
		}

		this.stagePulseFilter.reset();
		this.stagePulseFilter.tint(mixColor(COLOR_WHITE, this.stagePulseColor, this.stagePulseState.mix), false);
		this.stagePulseFilter.brightness(1 + this.stagePulseState.brightnessDelta * this.stagePulseState.mix, true);
	}
}
