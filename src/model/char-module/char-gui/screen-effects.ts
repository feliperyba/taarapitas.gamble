import { Application, Container, Sprite } from 'pixi.js';
import { ScreenShakeEffects } from './screen-shake-effects';
import { ScreenPulseEffects } from './screen-pulse-effects';
import { ParticleEffects } from './particle-effects';

export interface LifeBarInfo {
	centerX: number;
	centerY: number;
	maxWidth: number;
	percent: number;
	height: number;
	barSprite: Sprite;
}

export { ScreenShakeEffects, ScreenPulseEffects, ParticleEffects };

export class ScreenEffects {
	private readonly shakeEffects = new ScreenShakeEffects();
	private readonly pulseEffects = new ScreenPulseEffects();
	private readonly particleEffects = new ParticleEffects();

	public setup(app: Application, altarContainer: Container, heroFrame: Sprite, heroFrameFlash: Sprite, hitBar: Sprite): void {
		this.shakeEffects.setup(altarContainer, heroFrameFlash, hitBar);
		this.pulseEffects.setup(app, altarContainer, heroFrame, heroFrameFlash);
		this.particleEffects.setup(altarContainer);
	}

	public playDamageShake(): void {
		this.shakeEffects.playDamageShake();
		this.pulseEffects.playDamageScreenPulse();
	}

	public playProtectedShake(): void {
		this.shakeEffects.playProtectedShake();
	}

	public playHealPulse(): void {
		this.pulseEffects.playHealPulse();
	}

	public playHealBurst(healedAmount: number, portraitCenterX: number, portraitCenterY: number, lifeBarInfo: LifeBarInfo, potionHealth: number): void {
		this.pulseEffects.playHealBurstScreenPulse();
		this.particleEffects.playHealBurst(healedAmount, portraitCenterX, portraitCenterY, lifeBarInfo, potionHealth);
	}

	public playSkillPulse(): void {
		this.pulseEffects.playSkillPulse();
	}

	public updateParticleEmitters(deltaSeconds: number): void {
		this.particleEffects.updateParticleEmitters(deltaSeconds);
	}

	public destroy(): void {
		this.shakeEffects.destroy();
		this.pulseEffects.destroy();
		this.particleEffects.destroy();
	}
}
