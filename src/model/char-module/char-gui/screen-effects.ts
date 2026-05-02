import { Sprite, Container, ColorMatrixFilter } from 'pixi.js';
import { Emitter, type EmitterConfigV3 } from '@barvynkoa/particle-emitter';
import { gsap } from 'gsap';
import { Application } from 'pixi.js';
import { getTexture } from '../../../rendering/assets';
import { clamp, lerp, hexToRgb, rgbToHex } from '../../math-utils';

const COLOR_WHITE = 0xffffff;
const COLOR_DAMAGE_FLASH = 0xe01818;
const COLOR_DAMAGE_PULSE = 0xff6c63;
const COLOR_HEAL_FLASH = 0xff88d7;
const COLOR_HEAL_BURST_PULSE = 0xff9ce6;
const COLOR_PROTECTED_FLASH = 0x4da6ff;
const COLOR_SKILL_GOLD = 0xffd27a;

const DURATION_HEAL_PULSE_SCALE = 0.26;
const DURATION_HEAL_FLASH_RISE = 0.16;
const DURATION_HEAL_FLASH_DIP = 0.22;
const DURATION_HEAL_FLASH_FADE = 0.42;
const DURATION_DAMAGE_SHAKE_PRIMARY = 0.03;
const DURATION_DAMAGE_SHAKE_SECONDARY = 0.04;
const DURATION_DAMAGE_SHAKE_TERTIARY = 0.035;
const DURATION_DAMAGE_SHAKE_SETTLE = 0.1;
const DURATION_DAMAGE_FLASH_RISE = 0.048;
const DURATION_DAMAGE_FLASH_DIP = 0.08;
const DURATION_DAMAGE_FLASH_BURST = 0.04;
const DURATION_DAMAGE_FLASH_FADE = 0.16;
const DURATION_HIT_FADE = 1.12;
const DURATION_HIT_SCALE = 0.28;
const DURATION_DAMAGE_SCALE_RECOVER = 0.38;
const DURATION_PROTECTED_SHAKE_PRIMARY = 0.03;
const DURATION_PROTECTED_SHAKE_SECONDARY = 0.04;
const DURATION_PROTECTED_SHAKE_SETTLE = 0.1;
const DURATION_PROTECTED_FLASH_RISE = 0.06;
const DURATION_PROTECTED_FLASH_FADE = 0.2;
const DURATION_PROTECTED_SCALE_RECOVER = 0.35;
const DURATION_SKILL_TINT_IN = 0.12;
const DURATION_SKILL_TINT_OUT = 0.42;
const DURATION_SKILL_SCALE_RECOVER = 0.46;

const ALPHA_DAMAGE_FLASH_PEAK = 0.72;
const ALPHA_DAMAGE_FLASH_DIP = 0.1;
const ALPHA_DAMAGE_FLASH_BURST = 0.42;
const ALPHA_PROTECTED_FLASH_PEAK = 0.5;
const ALPHA_HEAL_FLASH_RISE = 0.52;
const ALPHA_HEAL_FLASH_DIP = 0.14;

const SCALE_HEAL_ALTAR_START = 0.992;
const SCALE_HEAL_ALTAR_PEAK = 1.042;
const SCALE_DAMAGE_ALTAR_SHRINK = 0.96;
const SCALE_PROTECTED_ALTAR_SHRINK = 0.97;
const SCALE_SKILL_PEAK = 1.018;
const SCALE_HIT_START = 0.2;

const SHAKE_DAMAGE_X_PRIMARY = -12;
const SHAKE_DAMAGE_X_SECONDARY = 10;
const SHAKE_DAMAGE_X_TERTIARY = -5;
const SHAKE_PROTECTED_X_PRIMARY = -8;
const SHAKE_PROTECTED_X_SECONDARY = 6;

const PULSE_RISE_RATIO = 0.32;
const PULSE_FALL_RATIO = 0.68;
const PULSE_THRESHOLD = 0.001;

export interface LifeBarInfo {
	centerX: number;
	centerY: number;
	maxWidth: number;
	percent: number;
	height: number;
	barSprite: Sprite;
}

export class ScreenEffects {
	private app!: Application;
	private altarContainer!: Container;
	private heroFrame!: Sprite;
	private heroFrameFlash!: Sprite;
	private hitBar!: Sprite;
	private readonly stagePulseFilter = new ColorMatrixFilter();
	private readonly stagePulseState = { mix: 0, brightnessDelta: 0 };
	private stagePulseColor = COLOR_WHITE;
	private readonly activeParticleEmitters = new Set<Emitter>();
	private damageShakePlaying = false;
	private protectedShakePlaying = false;

	public setup(app: Application, altarContainer: Container, heroFrame: Sprite, heroFrameFlash: Sprite, hitBar: Sprite): void {
		this.app = app;
		this.altarContainer = altarContainer;
		this.heroFrame = heroFrame;
		this.heroFrameFlash = heroFrameFlash;
		this.hitBar = hitBar;
	}

	public playDamageShake(): void {
		if (this.damageShakePlaying) return;
		this.damageShakePlaying = true;
		this.playScreenPulse(COLOR_DAMAGE_PULSE, 0.3, -0.18, 0.38);
		gsap.killTweensOf([this.altarContainer, this.altarContainer.scale, this.heroFrameFlash, this.hitBar]);
		this.altarContainer.scale.set(1);

		gsap
			.timeline({
				onComplete: () => { this.damageShakePlaying = false; }
			})
			.to(this.altarContainer, { x: SHAKE_DAMAGE_X_PRIMARY, duration: DURATION_DAMAGE_SHAKE_PRIMARY, ease: 'power1.inOut' })
			.to(this.altarContainer, { x: SHAKE_DAMAGE_X_SECONDARY, duration: DURATION_DAMAGE_SHAKE_SECONDARY, ease: 'power1.inOut' })
			.to(this.altarContainer, { x: SHAKE_DAMAGE_X_TERTIARY, duration: DURATION_DAMAGE_SHAKE_TERTIARY, ease: 'power1.inOut' })
			.to(this.altarContainer, { x: 0, duration: DURATION_DAMAGE_SHAKE_SETTLE, ease: 'power3.out' });

		gsap
			.timeline()
			.set(this.heroFrameFlash, { tint: COLOR_DAMAGE_FLASH, alpha: 0 })
			.to(this.heroFrameFlash, { alpha: ALPHA_DAMAGE_FLASH_PEAK, duration: DURATION_DAMAGE_FLASH_RISE, ease: 'power2.out' })
			.to(this.heroFrameFlash, { alpha: ALPHA_DAMAGE_FLASH_DIP, duration: DURATION_DAMAGE_FLASH_DIP, ease: 'power2.in' })
			.to(this.heroFrameFlash, { alpha: ALPHA_DAMAGE_FLASH_BURST, duration: DURATION_DAMAGE_FLASH_BURST, ease: 'power2.out' })
			.to(this.heroFrameFlash, { alpha: 0, duration: DURATION_DAMAGE_FLASH_FADE, ease: 'power2.out' });

		gsap.fromTo(this.hitBar, { alpha: 1 }, { alpha: 0, duration: DURATION_HIT_FADE, ease: 'power2.out' });
		gsap.fromTo(this.hitBar.scale, { x: SCALE_HIT_START, y: SCALE_HIT_START }, { x: 1, y: 1, duration: DURATION_HIT_SCALE, ease: 'power2.out' });
		gsap.fromTo(
			this.altarContainer.scale,
			{ x: SCALE_DAMAGE_ALTAR_SHRINK, y: SCALE_DAMAGE_ALTAR_SHRINK },
			{ x: 1, y: 1, duration: DURATION_DAMAGE_SCALE_RECOVER, ease: 'back.out(2.5)' }
		);
	}

	public playProtectedShake(): void {
		if (this.protectedShakePlaying) return;
		this.protectedShakePlaying = true;
		gsap.killTweensOf([this.altarContainer, this.altarContainer.scale, this.heroFrameFlash, this.hitBar]);
		this.altarContainer.scale.set(1);

		gsap
			.timeline({
				onComplete: () => { this.protectedShakePlaying = false; }
			})
			.to(this.altarContainer, { x: SHAKE_PROTECTED_X_PRIMARY, duration: DURATION_PROTECTED_SHAKE_PRIMARY, ease: 'power1.inOut' })
			.to(this.altarContainer, { x: SHAKE_PROTECTED_X_SECONDARY, duration: DURATION_PROTECTED_SHAKE_SECONDARY, ease: 'power1.inOut' })
			.to(this.altarContainer, { x: 0, duration: DURATION_PROTECTED_SHAKE_SETTLE, ease: 'power3.out' });

		gsap
			.timeline()
			.set(this.heroFrameFlash, { tint: COLOR_PROTECTED_FLASH, alpha: 0 })
			.to(this.heroFrameFlash, { alpha: ALPHA_PROTECTED_FLASH_PEAK, duration: DURATION_PROTECTED_FLASH_RISE, ease: 'power2.out' })
			.to(this.heroFrameFlash, { alpha: 0, duration: DURATION_PROTECTED_FLASH_FADE, ease: 'power2.out' });

		gsap.fromTo(this.hitBar, { alpha: 1 }, { alpha: 0, duration: DURATION_HIT_FADE, ease: 'power2.out' });
		gsap.fromTo(this.hitBar.scale, { x: SCALE_HIT_START, y: SCALE_HIT_START }, { x: 1, y: 1, duration: DURATION_HIT_SCALE, ease: 'power2.out' });
		gsap.fromTo(
			this.altarContainer.scale,
			{ x: SCALE_PROTECTED_ALTAR_SHRINK, y: SCALE_PROTECTED_ALTAR_SHRINK },
			{ x: 1, y: 1, duration: DURATION_PROTECTED_SCALE_RECOVER, ease: 'back.out(2)' }
		);
	}

	public playHealPulse(): void {
		gsap.killTweensOf([this.altarContainer.scale, this.heroFrameFlash]);

		gsap.fromTo(
			this.altarContainer.scale,
			{ x: SCALE_HEAL_ALTAR_START, y: SCALE_HEAL_ALTAR_START },
			{ x: SCALE_HEAL_ALTAR_PEAK, y: SCALE_HEAL_ALTAR_PEAK, duration: DURATION_HEAL_PULSE_SCALE, ease: 'power2.out', yoyo: true, repeat: 1 }
		);

		gsap
			.timeline()
			.set(this.heroFrameFlash, { tint: COLOR_HEAL_FLASH, alpha: 0 })
			.to(this.heroFrameFlash, { alpha: ALPHA_HEAL_FLASH_RISE, duration: DURATION_HEAL_FLASH_RISE, ease: 'power2.out' })
			.to(this.heroFrameFlash, { alpha: ALPHA_HEAL_FLASH_DIP, duration: DURATION_HEAL_FLASH_DIP, ease: 'power2.inOut' })
			.to(this.heroFrameFlash, { alpha: 0, duration: DURATION_HEAL_FLASH_FADE, ease: 'power2.out' });
	}

	public playHealBurst(healedAmount: number, portraitCenterX: number, portraitCenterY: number, lifeBarInfo: LifeBarInfo, potionHealth: number): void {
		if (healedAmount <= 0) {
			return;
		}

		const healStrength = Math.min(2.15, 1.18 + healedAmount / Math.max(1, potionHealth));
		this.playScreenPulse(COLOR_HEAL_BURST_PULSE, 0.24, 0.12, 0.78);
		this.spawnHealingEmitter(this.createAltarHealEmitterConfig(portraitCenterX, portraitCenterY, healStrength));
		this.spawnHealingEmitter(this.createAltarSparkEmitterConfig(portraitCenterX, portraitCenterY, healStrength));
		this.spawnHealingEmitter(this.createLifeBarHealEmitterConfig(lifeBarInfo, healStrength));
	}

	public playSkillPulse(): void {
		gsap.killTweensOf(this.altarContainer.scale);
		gsap
			.timeline()
			.to(this.heroFrame, { tint: COLOR_SKILL_GOLD, duration: DURATION_SKILL_TINT_IN, ease: 'power2.out' })
			.to(this.heroFrame, { tint: COLOR_WHITE, duration: DURATION_SKILL_TINT_OUT, ease: 'power2.out' }, '>');
		gsap.fromTo(
			this.altarContainer.scale,
			{ x: SCALE_SKILL_PEAK, y: SCALE_SKILL_PEAK },
			{ x: 1, y: 1, duration: DURATION_SKILL_SCALE_RECOVER, ease: 'elastic.out(1, 0.52)' }
		);
	}

	public updateParticleEmitters(deltaSeconds: number): void {
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

	public destroy(): void {
		gsap.killTweensOf([
			this.altarContainer, this.altarContainer?.scale,
			this.heroFrameFlash, this.heroFrame, this.hitBar,
			this.hitBar?.scale, this.stagePulseState
		]);
		for (const emitter of Array.from(this.activeParticleEmitters)) {
			if (!emitter.destroyed) {
				emitter.destroy();
			}
		}
		this.activeParticleEmitters.clear();
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
			.to(this.stagePulseState, { mix: peakMix, duration: duration * PULSE_RISE_RATIO, ease: 'power2.out' })
			.to(this.stagePulseState, { mix: 0, duration: duration * PULSE_FALL_RATIO, ease: 'power2.inOut' });
	}

	private updateStagePulseFilter(): void {
		const stageFilters = this.app.stage.filters ?? [];

		if (this.stagePulseState.mix <= PULSE_THRESHOLD) {
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
		this.stagePulseFilter.tint(this.mixColor(COLOR_WHITE, this.stagePulseColor, this.stagePulseState.mix), false);
		this.stagePulseFilter.brightness(1 + this.stagePulseState.brightnessDelta * this.stagePulseState.mix, true);
	}

	private spawnHealingEmitter(config: EmitterConfigV3): void {
		const particleLayer = new Container();
		const emitter = new Emitter(particleLayer, config);

		this.altarContainer.addChild(particleLayer);
		this.activeParticleEmitters.add(emitter);
		emitter.playOnceAndDestroy(() => {
			this.activeParticleEmitters.delete(emitter);
			particleLayer.destroy({ children: true });
		});
	}

	private createAltarHealEmitterConfig(centerX: number, centerY: number, healStrength: number): EmitterConfigV3 {
		return {
			lifetime: { min: 1.4, max: 2.2 },
			frequency: 0.04,
			spawnChance: 1,
			particlesPerWave: 4,
			emitterLifetime: 0.74,
			maxParticles: 78,
			pos: {
				x: centerX,
				y: centerY + 24
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

	private createAltarSparkEmitterConfig(centerX: number, centerY: number, healStrength: number): EmitterConfigV3 {
		return {
			lifetime: { min: 0.95, max: 1.5 },
			frequency: 0.024,
			spawnChance: 1,
			particlesPerWave: 5,
			emitterLifetime: 0.62,
			maxParticles: 88,
			pos: {
				x: centerX,
				y: centerY + 42
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

	private createLifeBarHealEmitterConfig(lifeBarInfo: LifeBarInfo, healStrength: number): EmitterConfigV3 {
		const activeWidth = Math.max(64, lifeBarInfo.maxWidth * lifeBarInfo.percent - 20);

		return {
			lifetime: { min: 1.08, max: 1.72 },
			frequency: 0.032,
			spawnChance: 1,
			particlesPerWave: 4,
			emitterLifetime: 0.62,
			maxParticles: 68,
			pos: {
				x: lifeBarInfo.centerX,
				y: lifeBarInfo.centerY
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
							y: -lifeBarInfo.barSprite.height / 2,
							w: activeWidth,
							h: lifeBarInfo.barSprite.height
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
