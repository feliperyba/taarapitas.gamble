import { Char } from '../../../model/char-module/char';
import { Texture } from 'pixi.js';
import { GameStates } from '../../game-states';

import { getTexture } from '../../../rendering/assets';
import type { Reel } from '../../../model/reel';
import { CharTargetType } from '../../../model/interfaces';
import { arrayRotateOne } from '../../math-utils';

export type SkillTarget = Char | Reel;

export interface CharInfo {
	readonly NAME: string;
	readonly PORTRAIT: Texture;
	readonly BACKGROUND: Texture;
	readonly LIFE: number;
	readonly CREDITS: number;
	readonly SKILL_DESC: string;
}

export interface CharFactory {
	create(): Char;
}

export interface CharSkillBehavior<T extends SkillTarget> {
	readonly TARGET_TYPE: CharTargetType;
	useSkill(target: T): void;
}

export type CharStrategy<T extends SkillTarget = SkillTarget> = CharInfo & CharFactory & CharSkillBehavior<T>;

export class CharContext<T extends SkillTarget = SkillTarget> {
	constructor(private readonly strategy: CharStrategy<T>, public target?: T) {}

	public get name(): string {
		return this.strategy.NAME;
	}

	public createCharClass(): Char {
		return this.strategy.create();
	}

	public useClassSkill(target?: T): void {
		if (target !== undefined) {
			this.strategy.useSkill(target);
		}
	}
}

export class WarriorClassStrategy implements CharStrategy<Char> {
	public readonly NAME = 'Warrior';
	public readonly PORTRAIT: Texture = getTexture('assets/warrior.png');
	public readonly BACKGROUND: Texture = getTexture('assets/warrior_background.png');
	public readonly LIFE = 25;
	public readonly CREDITS = 35;
	public readonly SKILL_DESC = 'Warrior Skill creates a shield protector that last one hit';
	public readonly TARGET_TYPE = CharTargetType.Char;

	public create(): Char {
		return new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
	}
	public useSkill(target: Char): void {
		target.setProtected(true);
	}
}

export class BerserkerClassStrategy implements CharStrategy<Reel> {
	public readonly NAME = 'Berserker';
	public readonly PORTRAIT: Texture = getTexture('assets/berserker.png');
	public readonly BACKGROUND: Texture = getTexture('assets/berserker_background.png');
	public readonly LIFE = 30;
	public readonly CREDITS = 20;
	public readonly SKILL_DESC = 'Berserker Skill Makes every Spinner roll 2 slots';
	public readonly TARGET_TYPE = CharTargetType.Reel;

	public create(): Char {
		return new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
	}
	public useSkill(target: Reel): void {
		for (const r of target.reelArr) {
			for (let i = 0; i < 2; i++) {
				arrayRotateOne(r.symbolsPosition, true);
			}
		}
		target.setGameState(GameStates.START);
	}
}

export class ClericClassStrategy implements CharStrategy<Char> {
	public readonly NAME = 'Cleric';
	public readonly PORTRAIT: Texture = getTexture('assets/cleric.png');
	public readonly BACKGROUND: Texture = getTexture('assets/cleric_background.png');
	public readonly LIFE = 15;
	public readonly CREDITS = 10;
	public readonly SKILL_DESC = 'Cleric Skill Recover 10 points of life';
	public readonly TARGET_TYPE = CharTargetType.Char;

	public create(): Char {
		return new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
	}
	public useSkill(target: Char): void {
		target.heal(10);
	}
}

export class MageClassStrategy implements CharStrategy<Reel> {
	public readonly NAME = 'Mage';
	public readonly PORTRAIT: Texture = getTexture('assets/mage.png');
	public readonly BACKGROUND: Texture = getTexture('assets/mage_background.png');
	public readonly LIFE = 10;
	public readonly CREDITS = 100;
	public readonly SKILL_DESC = 'Mage Skill Makes every Spinner roll slots  by the number of their locations';
	public readonly TARGET_TYPE = CharTargetType.Reel;

	public create(): Char {
		return new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
	}
	public useSkill(target: Reel): void {
		for (let i = 0; i < target.reelArr.length - 1; i++) {
			for (let j = 0; j < i + 1; j++) {
				arrayRotateOne(target.reelArr[i].symbolsPosition, true);
			}
		}
		target.setGameState(GameStates.START);
	}
}
