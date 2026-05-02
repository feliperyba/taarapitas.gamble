import { Texture } from 'pixi.js';
import { GameStates } from '../../services/game-logic.service';
import { GameStateMachine } from '../../services/game-state-machine';
import { CharContext } from '../../model/char-module/char-strategy/char-strategy';
import type { PayResult } from '../interfaces';
import type { Reel } from '../reel';

export class Char {
	public charContext!: CharContext;
	public readonly totalLife: number;

	private _roundsAlive = 0;
	private _isProtected = false;
	private _usingSkill = false;
	private _specialBar = 0;
	private _hit = false;
	private _life: number;
	private _credits: number;

	constructor(
		public readonly portrait: Texture,
		life: number,
		credits: number,
		public readonly skillDesc: string
	) {
		this.totalLife = life;
		this._life = life;
		this._credits = credits;
	}

	get roundsAlive(): number { return this._roundsAlive; }
	get isProtected(): boolean { return this._isProtected; }
	get usingSkill(): boolean { return this._usingSkill; }
	get specialBar(): number { return this._specialBar; }
	get hit(): boolean { return this._hit; }
	get life(): number { return this._life; }
	get credits(): number { return this._credits; }

	public addCredits(amount: number): void {
		this._credits += amount;
	}

	public removeCredits(amount: number): boolean {
		if (this._credits < amount) return false;
		this._credits -= amount;
		return true;
	}

	public setCredits(amount: number): void {
		this._credits = amount;
	}

	public takeDamage(amount: number): void {
		this._life -= amount;
	}

	public heal(amount: number): void {
		this._life += amount;
		if (this._life > this.totalLife) {
			this._life = this.totalLife;
		}
	}

	public setProtected(value: boolean): void {
		this._isProtected = value;
	}

	public setUsingSkill(value: boolean): void {
		this._usingSkill = value;
	}

	public setSpecialBar(value: number): void {
		this._specialBar = value;
	}

	public incrementSpecialBar(): void {
		this._specialBar += 1;
	}

	public setHit(value: boolean): void {
		this._hit = value;
	}

	public useSpecialSkill(target?: Char | Reel) {
		this._usingSkill = true;
		this.charContext.useClassSkill(target);
	}

	public checkBattleResults(result: PayResult, stateMachine: GameStateMachine, defaultDmg: number) {
		if (result !== null) {
			this.addCredits(parseInt(result.toString()));
			this.incrementSpecialBar();
			stateMachine.transition(GameStates.WIN);
		} else {
			this._hit = true;
			if (!this._usingSkill && !this._isProtected) {
				this.takeDamage(defaultDmg);
			}
			if (this._isProtected) {
				this._isProtected = false;
			}

			if (this._life <= 0) {
				stateMachine.transition(GameStates.LOSE);
				return;
			}

			stateMachine.transition(GameStates.WAITING);
		}

		if (this._usingSkill) {
			this._usingSkill = false;
			this._specialBar = 0;
		}

		this._roundsAlive++;
	}
}
