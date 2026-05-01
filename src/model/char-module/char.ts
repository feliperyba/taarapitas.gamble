import { Texture } from 'pixi.js';
import { GameLogicService, GameStates } from '../../services/game-logic.service';
import { CharStrategy } from '../../model/char-module/char-strategy/char-strategy';

export class Char {
	public charContext: CharStrategy.CharContext;
	public roundsAlive = 0;
	public stackWins = 0;
	public nextLevel = 1;
	public isProtected = false;
	public usingSkill = false;
	public specialBar = 0;
	public totalLife: number;
	public hit = false;

	constructor(
		public portrait: Texture,
		public life: number,
		public credits: number,
		public skillDesc: string,
		public level = 1,
		public exp = 0
	) {
		this.totalLife = life;
	}

	public useSpecialSkill(target?: any) {
		this.usingSkill = true;
		this.charContext.useClassSkill(target);
	}

	public checkBattleResults(result: any, service: GameLogicService) {
		if (result != null) {
			this.credits += parseInt(result.toString());
			this.specialBar += 1;

			service.state = GameStates.WIN;
		} else {
			this.hit = true;
			if (!this.usingSkill && !this.isProtected) {
				this.life -= service.DEFAULT_DMG;
			}
			if (this.isProtected) {
				this.isProtected = false;
			}

			if (this.life <= 0) {
				service.state = GameStates.LOSE;
				return;
			}

			service.state = GameStates.WAITING;
		}

		if (this.usingSkill) {
			this.usingSkill = false;
			this.specialBar = 0;
		}

		this.roundsAlive++;
	}
}
