import { Container } from 'pixi.js';
import { Emitter, type EmitterConfigV3 } from '@barvynkoa/particle-emitter';
import { getTexture } from '../../../rendering/assets';
import type { LifeBarInfo } from './screen-effects';
import { HEAL_ALTAR_EMITTER, HEAL_SPARK_EMITTER, HEAL_LIFEBAR_EMITTER } from '../../constants/emitter';

interface EmitterConfigParams {
	lifetime: { min: number; max: number };
	frequency: number;
	particlesPerWave: number;
	emitterLifetime: number;
	maxParticles: number;
	pos: { x: number; y: number };
	behaviors: EmitterConfigV3['behaviors'];
}

export class ParticleEffects {
	private altarContainer!: Container;
	private readonly activeParticleEmitters = new Set<Emitter>();

	public setup(altarContainer: Container): void {
		this.altarContainer = altarContainer;
	}

	public playHealBurst(healedAmount: number, portraitCenterX: number, portraitCenterY: number, lifeBarInfo: LifeBarInfo, potionHealth: number): void {
		if (healedAmount <= 0) return;

		const healStrength = Math.min(2.15, 1.18 + healedAmount / Math.max(1, potionHealth));
		this.spawnHealingEmitter(this.createAltarHealEmitterConfig(portraitCenterX, portraitCenterY, healStrength));
		this.spawnHealingEmitter(this.createAltarSparkEmitterConfig(portraitCenterX, portraitCenterY, healStrength));
		this.spawnHealingEmitter(this.createLifeBarHealEmitterConfig(lifeBarInfo, healStrength));
	}

	public updateParticleEmitters(deltaSeconds: number): void {
		if (this.activeParticleEmitters.size === 0) return;

		const toDelete: Emitter[] = [];
		for (const emitter of this.activeParticleEmitters) {
			if (emitter.destroyed) {
				toDelete.push(emitter);
				continue;
			}
			emitter.update(deltaSeconds);
		}
		for (const emitter of toDelete) {
			this.activeParticleEmitters.delete(emitter);
		}
	}

	public destroy(): void {
		for (const emitter of this.activeParticleEmitters) {
			if (!emitter.destroyed) {
				emitter.destroy();
			}
		}
		this.activeParticleEmitters.clear();
	}

	private createEmitterConfig(params: EmitterConfigParams): EmitterConfigV3 {
		return {
			lifetime: params.lifetime,
			frequency: params.frequency,
			spawnChance: 1,
			particlesPerWave: params.particlesPerWave,
			emitterLifetime: params.emitterLifetime,
			maxParticles: params.maxParticles,
			pos: params.pos,
			emit: false,
			autoUpdate: false,
			behaviors: params.behaviors
		};
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
		const C = HEAL_ALTAR_EMITTER;
		return this.createEmitterConfig({
			lifetime: C.LIFETIME,
			frequency: C.FREQUENCY,
			particlesPerWave: C.PARTICLES_PER_WAVE,
			emitterLifetime: C.EMITTER_LIFETIME,
			maxParticles: C.MAX_PARTICLES,
			pos: { x: centerX, y: centerY + C.POS_Y_OFFSET },
			behaviors: [
				{ type: 'alpha', config: { alpha: { list: C.ALPHA_CURVE } } },
				{ type: 'scale', config: { scale: { list: C.SCALE_CURVE } } },
				{ type: 'color', config: { color: { list: C.COLOR_CURVE } } },
				{ type: 'moveSpeed', config: { speed: { list: [{ value: C.SPEED_BASE * healStrength, time: 0 }, { value: C.SPEED_TAIL, time: 1 }], isStepped: false } } },
				{ type: 'rotationStatic', config: C.ROTATION },
				{ type: 'spawnShape', config: { type: 'torus', data: { x: 0, y: 0, radius: C.SPAWN_RADIUS_BASE * healStrength, innerRadius: C.SPAWN_INNER_RADIUS, affectRotation: true } } },
				{ type: 'textureSingle', config: { texture: getTexture('assets/symbol_01.png') } }
			]
		});
	}

	private createAltarSparkEmitterConfig(centerX: number, centerY: number, healStrength: number): EmitterConfigV3 {
		const C = HEAL_SPARK_EMITTER;
		return this.createEmitterConfig({
			lifetime: C.LIFETIME,
			frequency: C.FREQUENCY,
			particlesPerWave: C.PARTICLES_PER_WAVE,
			emitterLifetime: C.EMITTER_LIFETIME,
			maxParticles: C.MAX_PARTICLES,
			pos: { x: centerX, y: centerY + C.POS_Y_OFFSET },
			behaviors: [
				{ type: 'alpha', config: { alpha: { list: C.ALPHA_CURVE } } },
				{ type: 'scale', config: { scale: { list: C.SCALE_CURVE } } },
				{ type: 'color', config: { color: { list: C.COLOR_CURVE } } },
				{ type: 'moveSpeed', config: { speed: { list: [{ value: C.SPEED_BASE * healStrength, time: 0 }, { value: C.SPEED_TAIL, time: 1 }], isStepped: false } } },
				{ type: 'rotationStatic', config: C.ROTATION },
				{ type: 'spawnShape', config: { type: 'rect', data: C.SPAWN_RECT } },
				{ type: 'textureSingle', config: { texture: getTexture('assets/symbol_01.png') } }
			]
		});
	}

	private createLifeBarHealEmitterConfig(lifeBarInfo: LifeBarInfo, healStrength: number): EmitterConfigV3 {
		const C = HEAL_LIFEBAR_EMITTER;
		const activeWidth = Math.max(C.MIN_ACTIVE_BAR_WIDTH, lifeBarInfo.maxWidth * lifeBarInfo.percent - C.BAR_WIDTH_PADDING);
		return this.createEmitterConfig({
			lifetime: C.LIFETIME,
			frequency: C.FREQUENCY,
			particlesPerWave: C.PARTICLES_PER_WAVE,
			emitterLifetime: C.EMITTER_LIFETIME,
			maxParticles: C.MAX_PARTICLES,
			pos: { x: lifeBarInfo.centerX, y: lifeBarInfo.centerY },
			behaviors: [
				{ type: 'alpha', config: { alpha: { list: C.ALPHA_CURVE } } },
				{ type: 'scale', config: { scale: { list: C.SCALE_CURVE } } },
				{ type: 'color', config: { color: { list: C.COLOR_CURVE } } },
				{ type: 'moveSpeed', config: { speed: { list: [{ value: C.SPEED_BASE * healStrength, time: 0 }, { value: C.SPEED_TAIL, time: 1 }], isStepped: false } } },
				{ type: 'rotationStatic', config: C.ROTATION },
				{ type: 'spawnShape', config: { type: 'rect', data: { x: -activeWidth / 2, y: -lifeBarInfo.barSprite.height / 2, w: activeWidth, h: lifeBarInfo.barSprite.height } } },
				{ type: 'textureSingle', config: { texture: getTexture('assets/symbol_01.png') } }
			]
		});
	}
}
