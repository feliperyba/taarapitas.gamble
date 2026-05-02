import { Char } from '../../../model/char-module/char';
import { Texture } from 'pixi.js';
import { GameStates } from '../../../services/game-logic.service';
import { Reel } from '../../reel';
import { getTexture } from '../../../rendering/assets';

export namespace CharStrategy {
	export interface CharStrategy {
		NAME: string;
		create(target?: any): Char;
		useSkill(target?: any): void;
	}

	export class CharContext {
		constructor(private strategy: CharStrategy, public target?: any) {}

		public get name(): string {
			return this.strategy.NAME;
		}

		public createCharClass(): Char {
			return this.strategy.create(this.target);
		}

		public useClassSkill(target?: any) {
			return this.strategy.useSkill(target);
		}
	}

	export class WarriorClassStrategy implements CharStrategy {
		public NAME = 'Warrior';
		public PORTRAIT: Texture = getTexture('assets/warrior.png');
		public BACKGROUND: Texture = getTexture('assets/warrior_background.png');
		public LIFE = 25;
		public CREDITS = 35;
		public SKILL_DESC = 'Warrior Skill creates a shield protector that last one hit';
		public TARGET_TYPE: any = 'Char';

		public create(): Char {
			const char = new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
			return char;
		}
		public useSkill(target: any) {
			target.isProtected = true;
		}
	}

	export class BerserkerClassStrategy implements CharStrategy {
		public NAME = 'Berserker';
		public PORTRAIT: Texture = getTexture('assets/berserker.png');
		public BACKGROUND: Texture = getTexture('assets/berserker_background.png');
		public LIFE = 30;
		public CREDITS = 20;
		public SKILL_DESC = 'Berserker Skill Makes every Spinner roll 2 slots';
		public TARGET_TYPE: any = 'Reel';

		public create(): Char {
			const char = new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
			return char;
		}
		public useSkill(target: any) {
			for (const reel of target.reelArr) {
				for (let i = 0; i < 2; i++) {
					target.arrayRotateOne(reel.symbolsPosition, true);
				}
			}
			target._gameLogicService.state = GameStates.START;
		}
	}

	export class ClericClassStrategy implements CharStrategy {
		public NAME = 'Cleric';
		public PORTRAIT: Texture = getTexture('assets/cleric.png');
		public BACKGROUND: Texture = getTexture('assets/cleric_background.png');
		public LIFE = 15;
		public CREDITS = 10;
		public SKILL_DESC = 'Cleric Skill Recover 10 points of life';
		public TARGET_TYPE: any = 'Char';

		public create(): Char {
			const char = new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
			return char;
		}
		public useSkill(target: any) {
			target.life += 10;
			if (target.life > target.totalLife) {
				target.life = target.totalLife;
			}
		}
	}

	export class MageClassStrategy implements CharStrategy {
		public NAME = 'Mage';
		public PORTRAIT: Texture = getTexture('assets/mage.png');
		public BACKGROUND: Texture = getTexture('assets/mage_background.png');
		public LIFE = 10;
		public CREDITS = 100;
		public SKILL_DESC = 'Mage Skill Makes every Spinner roll slots  by the number of their locations';
		public TARGET_TYPE: any = 'Reel';

		public create(): Char {
			const char = new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
			return char;
		}
		public useSkill(target: any) {
			for (let i = 0; i < target.reelArr.length - 1; i++) {
				for (let j = 0; j < i + 1; j++) {
					target.arrayRotateOne(target.reelArr[i].symbolsPosition, true);
				}
			}
			target._gameLogicService.state = GameStates.START;
		}
	}
}
