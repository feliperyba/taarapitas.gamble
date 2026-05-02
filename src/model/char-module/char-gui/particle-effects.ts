import { Container } from 'pixi.js';
import { Emitter, type EmitterConfigV3 } from '@barvynkoa/particle-emitter';
import { getTexture } from '../../../rendering/assets';
import type { LifeBarInfo } from './screen-effects';
import { HEAL_ALTAR_EMITTER, HEAL_SPARK_EMITTER, HEAL_LIFEBAR_EMITTER } from '../../constants/emitter';

export class ParticleEffects {
	private altarContainer!: Container;
	private readonly activeParticleEmitters = new Set<Emitter>();
	private readonly _pendingDelete: Emitter[] = [];
	private _altarStaticBehaviors!: EmitterConfigV3['behaviors'];
	private _sparkStaticBehaviors!: EmitterConfigV3['behaviors'];
	private _lifebarStaticBehaviors!: EmitterConfigV3['behaviors'];

	public setup(altarContainer: Container): void {
		this.altarContainer = altarContainer;
		this.buildStaticBehaviors();
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
		this._pendingDelete.length = 0;
		for (const emitter of this.activeParticleEmitters) {
			if (emitter.destroyed) {
				this._pendingDelete.push(emitter);
				continue;
			}
			emitter.update(deltaSeconds);
		}
		for (const emitter of this._pendingDelete) {
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

	private buildStaticBehaviors(): void {
		const AC = HEAL_ALTAR_EMITTER;
		const SC = HEAL_SPARK_EMITTER;
		const LC = HEAL_LIFEBAR_EMITTER;
		const texture = getTexture('assets/symbol_01.png');

		this._altarStaticBehaviors = [
			{ type: 'alpha', config: { alpha: { list: AC.ALPHA_CURVE } } },
			{ type: 'scale', config: { scale: { list: AC.SCALE_CURVE } } },
			{ type: 'color', config: { color: { list: AC.COLOR_CURVE } } },
			{ type: 'rotationStatic', config: AC.ROTATION },
			{ type: 'textureSingle', config: { texture } }
		];

		this._sparkStaticBehaviors = [
			{ type: 'alpha', config: { alpha: { list: SC.ALPHA_CURVE } } },
			{ type: 'scale', config: { scale: { list: SC.SCALE_CURVE } } },
			{ type: 'color', config: { color: { list: SC.COLOR_CURVE } } },
			{ type: 'rotationStatic', config: SC.ROTATION },
			{ type: 'textureSingle', config: { texture } }
		];

		this._lifebarStaticBehaviors = [
			{ type: 'alpha', config: { alpha: { list: LC.ALPHA_CURVE } } },
			{ type: 'scale', config: { scale: { list: LC.SCALE_CURVE } } },
			{ type: 'color', config: { color: { list: LC.COLOR_CURVE } } },
			{ type: 'rotationStatic', config: LC.ROTATION },
			{ type: 'textureSingle', config: { texture } }
		];
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
		return {
			lifetime: C.LIFETIME,
			frequency: C.FREQUENCY,
			spawnChance: 1,
			particlesPerWave: C.PARTICLES_PER_WAVE,
			emitterLifetime: C.EMITTER_LIFETIME,
			maxParticles: C.MAX_PARTICLES,
			pos: { x: centerX, y: centerY + C.POS_Y_OFFSET },
			emit: false,
			autoUpdate: false,
			behaviors: [
				...this._altarStaticBehaviors,
				{ type: 'moveSpeed', config: { speed: { list: [{ value: C.SPEED_BASE * healStrength, time: 0 }, { value: C.SPEED_TAIL, time: 1 }], isStepped: false } } },
				{ type: 'spawnShape', config: { type: 'torus', data: { x: 0, y: 0, radius: C.SPAWN_RADIUS_BASE * healStrength, innerRadius: C.SPAWN_INNER_RADIUS, affectRotation: true } } }
			]
		};
	}

	private createAltarSparkEmitterConfig(centerX: number, centerY: number, healStrength: number): EmitterConfigV3 {
		const C = HEAL_SPARK_EMITTER;
		return {
			lifetime: C.LIFETIME,
			frequency: C.FREQUENCY,
			spawnChance: 1,
			particlesPerWave: C.PARTICLES_PER_WAVE,
			emitterLifetime: C.EMITTER_LIFETIME,
			maxParticles: C.MAX_PARTICLES,
			pos: { x: centerX, y: centerY + C.POS_Y_OFFSET },
			emit: false,
			autoUpdate: false,
			behaviors: [
				...this._sparkStaticBehaviors,
				{ type: 'moveSpeed', config: { speed: { list: [{ value: C.SPEED_BASE * healStrength, time: 0 }, { value: C.SPEED_TAIL, time: 1 }], isStepped: false } } },
				{ type: 'spawnShape', config: { type: 'rect', data: C.SPAWN_RECT } }
			]
		};
	}

	private createLifeBarHealEmitterConfig(lifeBarInfo: LifeBarInfo, healStrength: number): EmitterConfigV3 {
		const C = HEAL_LIFEBAR_EMITTER;
		const activeWidth = Math.max(C.MIN_ACTIVE_BAR_WIDTH, lifeBarInfo.maxWidth * lifeBarInfo.percent - C.BAR_WIDTH_PADDING);
		return {
			lifetime: C.LIFETIME,
			frequency: C.FREQUENCY,
			spawnChance: 1,
			particlesPerWave: C.PARTICLES_PER_WAVE,
			emitterLifetime: C.EMITTER_LIFETIME,
			maxParticles: C.MAX_PARTICLES,
			pos: { x: lifeBarInfo.centerX, y: lifeBarInfo.centerY },
			emit: false,
			autoUpdate: false,
			behaviors: [
				...this._lifebarStaticBehaviors,
				{ type: 'moveSpeed', config: { speed: { list: [{ value: C.SPEED_BASE * healStrength, time: 0 }, { value: C.SPEED_TAIL, time: 1 }], isStepped: false } } },
				{ type: 'spawnShape', config: { type: 'rect', data: { x: -activeWidth / 2, y: -lifeBarInfo.barSprite.height / 2, w: activeWidth, h: lifeBarInfo.barSprite.height } } }
			]
		};
	}
}
