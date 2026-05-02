import { Char } from '../../../model/char-module/char';
import { Texture } from 'pixi.js';
import { GameStates } from '../../../services/game-logic.service';

import { getTexture } from '../../../rendering/assets';
import type { Reel } from '../../../model/reel';
import type { CharTargetType } from '../../../model/interfaces';

export type SkillTarget = Char | Reel;

export interface CharStrategy {
	readonly NAME: string;
	readonly PORTRAIT: Texture;
	readonly BACKGROUND: Texture;
	readonly LIFE: number;
	readonly CREDITS: number;
	readonly SKILL_DESC: string;
	readonly TARGET_TYPE: CharTargetType;
	create(target?: SkillTarget): Char;
	useSkill(target?: SkillTarget): void;
}

export class CharContext {
	constructor(private readonly strategy: CharStrategy, public target?: SkillTarget) {}

	public get name(): string {
		return this.strategy.NAME;
	}

	public createCharClass(): Char {
		return this.strategy.create(this.target);
	}

	public useClassSkill(target?: SkillTarget) {
		return this.strategy.useSkill(target);
	}
}

export class WarriorClassStrategy implements CharStrategy {
	public readonly NAME = 'Warrior';
	public readonly PORTRAIT: Texture = getTexture('assets/warrior.png');
	public readonly BACKGROUND: Texture = getTexture('assets/warrior_background.png');
	public readonly LIFE = 25;
	public readonly CREDITS = 35;
	public readonly SKILL_DESC = 'Warrior Skill creates a shield protector that last one hit';
	public readonly TARGET_TYPE: CharTargetType = 'Char';

	public create(): Char {
		const char = new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
		return char;
	}
	public useSkill(target: SkillTarget) {
		(target as Char).setProtected(true);
	}
}

export class BerserkerClassStrategy implements CharStrategy {
	public readonly NAME = 'Berserker';
	public readonly PORTRAIT: Texture = getTexture('assets/berserker.png');
	public readonly BACKGROUND: Texture = getTexture('assets/berserker_background.png');
	public readonly LIFE = 30;
	public readonly CREDITS = 20;
	public readonly SKILL_DESC = 'Berserker Skill Makes every Spinner roll 2 slots';
	public readonly TARGET_TYPE: CharTargetType = 'Reel';

	public create(): Char {
		const char = new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
		return char;
	}
	public useSkill(target: SkillTarget) {
		const reel = target as Reel;
		for (const r of reel.reelArr) {
			for (let i = 0; i < 2; i++) {
				reel.arrayRotateOne(r.symbolsPosition, true);
			}
		}
		reel.setGameState(GameStates.START);
	}
}

export class ClericClassStrategy implements CharStrategy {
	public readonly NAME = 'Cleric';
	public readonly PORTRAIT: Texture = getTexture('assets/cleric.png');
	public readonly BACKGROUND: Texture = getTexture('assets/cleric_background.png');
	public readonly LIFE = 15;
	public readonly CREDITS = 10;
	public readonly SKILL_DESC = 'Cleric Skill Recover 10 points of life';
	public readonly TARGET_TYPE: CharTargetType = 'Char';

	public create(): Char {
		const char = new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
		return char;
	}
	public useSkill(target: SkillTarget) {
		const charTarget = target as Char;
		charTarget.heal(10);
	}
}

export class MageClassStrategy implements CharStrategy {
	public readonly NAME = 'Mage';
	public readonly PORTRAIT: Texture = getTexture('assets/mage.png');
	public readonly BACKGROUND: Texture = getTexture('assets/mage_background.png');
	public readonly LIFE = 10;
	public readonly CREDITS = 100;
	public readonly SKILL_DESC = 'Mage Skill Makes every Spinner roll slots  by the number of their locations';
	public readonly TARGET_TYPE: CharTargetType = 'Reel';

	public create(): Char {
		const char = new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
		return char;
	}
	public useSkill(target: SkillTarget) {
		const reel = target as Reel;
		for (let i = 0; i < reel.reelArr.length - 1; i++) {
			for (let j = 0; j < i + 1; j++) {
				reel.arrayRotateOne(reel.reelArr[i].symbolsPosition, true);
			}
		}
		reel.setGameState(GameStates.START);
	}
}
