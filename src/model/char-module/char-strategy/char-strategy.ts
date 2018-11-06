import { Char } from '../../../model/char-module/char';
import { Texture } from 'pixi.js';
import { GameStates } from '../../../services/game-logic.service';
import { Reel } from '../../reel';

export namespace CharStrategy {
	export interface CharStrategy {
		create(target?: any): Char;
		useSkill(target?: any): void;
	}

	export class CharContext {
		constructor(private strategy: CharStrategy, public target?: any) {}

		public createCharClass(): Char {
			return this.strategy.create(this.target);
		}

		public useClassSkill(target?: any) {
			return this.strategy.useSkill(target);
		}
	}

	export class WarriorClassStrategy implements CharStrategy {
		public NAME = 'Warrior';
		public PORTRAIT: Texture = PIXI.Loader.shared.resources['../assets/warrior.png'].texture;
		public BACKGROUND: Texture = PIXI.Loader.shared.resources['../assets/warrior_background.png'].texture;
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
		public PORTRAIT: Texture = PIXI.Loader.shared.resources['../assets/berserker.png'].texture;
		public BACKGROUND: Texture = PIXI.Loader.shared.resources['../assets/berserker_background.png'].texture;
		public LIFE = 30;
		public CREDITS = 20;
		public SKILL_DESC = 'Berserker Skill Makes every Spinner roll 2 slots';
		public TARGET_TYPE: any = 'Reel';

		public create(): Char {
			const char = new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
			return char;
		}
		public useSkill(target: any) {
			for (let reel of target.reelArr) {
				for (let i = 0; i < 2; i++) {
					target.arrayRotateOne(reel.symbolsPosition, true);
				}
			}
			target._gameLogicService.state = GameStates.START;
		}
	}

	export class ClericClassStrategy implements CharStrategy {
		public NAME = 'Cleric';
		public PORTRAIT: Texture = PIXI.Loader.shared.resources['../assets/cleric.png'].texture;
		public BACKGROUND: Texture = PIXI.Loader.shared.resources['../assets/cleric_background.png'].texture;
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
		public PORTRAIT: Texture = PIXI.Loader.shared.resources['../assets/mage.png'].texture;
		public BACKGROUND: Texture = PIXI.Loader.shared.resources['../assets/mage_background.png'].texture;
		public LIFE = 10;
		public CREDITS = 100;
		public SKILL_DESC = 'Mage Skill Makes every Spinner roll slots  by the number of their locations';
		public TARGET_TYPE: any = 'Reel';

		public create(): Char {
			const char = new Char(this.PORTRAIT, this.LIFE, this.CREDITS, this.SKILL_DESC);
			return char;
		}
		public useSkill(target: any) {
			// Mage Skill Makes:s
			// The first Spinner roll 1 slot
			// The second Spinner rolls 2 slots
			// The third Spinner rolls 3 slots
			for (let i = 0; i < target.reelArr.length - 1; i++) {
				for (let j = 0; j < i + 1; j++) {
					target.arrayRotateOne(target.reelArr[i].symbolsPosition, true);
				}
			}
			target._gameLogicService.state = GameStates.START;
		}
	}
}
