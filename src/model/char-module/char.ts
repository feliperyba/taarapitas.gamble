import { signal, computed, WritableSignal } from '@angular/core';
import { Texture } from 'pixi.js';
import { CharContext } from './char-strategy/char-strategy';
import type { PayResult, BattleOutcome } from '../interfaces';
import type { Reel } from '../reel';

export class Char {
	public charContext: CharContext;
	public readonly totalLife: number;

	readonly roundsAlive = signal(0);
	readonly isProtected = signal(false);
	readonly usingSkill = signal(false);
	readonly specialBar = signal(0);
	readonly hit = signal(false);
	readonly life: WritableSignal<number>;
	readonly credits: WritableSignal<number>;
	readonly lifePercent = computed(() => this.life() / this.totalLife);

	constructor(
		public readonly portrait: Texture,
		life: number,
		credits: number,
		public readonly skillDesc: string,
		charContext: CharContext
	) {
		this.totalLife = life;
		this.life = signal(life);
		this.credits = signal(credits);
		this.charContext = charContext;
	}

	public addCredits(amount: number): void {
		this.credits.update(c => c + amount);
	}

	public removeCredits(amount: number): boolean {
		if (this.credits() < amount) return false;
		this.credits.update(c => c - amount);
		return true;
	}

	public setCredits(amount: number): void {
		this.credits.set(amount);
	}

	public takeDamage(amount: number): void {
		this.life.update(l => l - amount);
	}

	public heal(amount: number): void {
		this.life.update(l => Math.min(l + amount, this.totalLife));
	}

	public setProtected(value: boolean): void {
		this.isProtected.set(value);
	}

	public setUsingSkill(value: boolean): void {
		this.usingSkill.set(value);
	}

	public setSpecialBar(value: number): void {
		this.specialBar.set(value);
	}

	public incrementSpecialBar(): void {
		this.specialBar.update(v => v + 1);
	}

	public setHit(value: boolean): void {
		this.hit.set(value);
	}

	public useSpecialSkill(target?: Char | Reel): void {
		this.usingSkill.set(true);
		this.charContext.useClassSkill(target);
	}

	public checkBattleResults(result: PayResult, defaultDmg: number): BattleOutcome {
		if (result !== null) {
			this.addCredits(result);
			this.incrementSpecialBar();
			return 'WIN';
		}

		this.hit.set(true);

		if (!this.usingSkill() && !this.isProtected()) {
			this.takeDamage(defaultDmg);
		}

		if (this.isProtected()) {
			this.isProtected.set(false);
		}

		if (this.life() <= 0) {
			return 'LOSE';
		}

		return 'WAITING';
	}

	public finalizeRound(): void {
		if (this.usingSkill()) {
			this.usingSkill.set(false);
			this.specialBar.set(0);
		}

		this.roundsAlive.update(v => v + 1);
	}
}
