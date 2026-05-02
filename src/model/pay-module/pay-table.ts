import { Application } from 'pixi.js';
import { GameLogicService } from '../../services/game-logic.service';
import { Reel } from '../reel';
import { Char } from '../char-module/char';
import {
	PayStrategy,
	CherryBottonStrategy,
	CherryTopStrategy,
	CherryCenterStrategy,
	SevenStrategy,
	SevenCherryStrategy,
	X3BarStrategy,
	X2BarStrategy,
	BarStrategy,
	AnyBarStrategy
} from './pay-table-strategy/pay-table-strategy';
import { PayTableGUI } from './pay-table-gui/pay-table-gui';

export { COMBINATIONS } from './combinations';

export class PayTable {
	public readonly strategiesArr: PayStrategy[];
	public payTableGUI!: PayTableGUI;

	constructor(public readonly app: Application, public readonly _gameLogicService: GameLogicService, public readonly reels: Reel) {
		this.strategiesArr = [
			new CherryBottonStrategy(),
			new CherryTopStrategy(),
			new CherryCenterStrategy(),
			new SevenStrategy(),
			new SevenCherryStrategy(),
			new X3BarStrategy(),
			new X2BarStrategy(),
			new BarStrategy(),
			new AnyBarStrategy()
		];
	}

	public checkPayStrategies(reels: Reel, char: Char): void {
		for (const strategy of this.strategiesArr) {
			const result = strategy.check(reels);
			if (result !== null) {
				char.checkBattleResults(result, this._gameLogicService.stateMachine, this._gameLogicService.DEFAULT_DMG);
				this.payTableGUI.result = result;
				return;
			}
		}
		char.checkBattleResults(null, this._gameLogicService.stateMachine, this._gameLogicService.DEFAULT_DMG);
		this.payTableGUI.result = null;
	}
}
