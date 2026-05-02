import { Application } from 'pixi.js';
import { Subject } from 'rxjs';
import { GameLogicService } from '../../services/game-logic.service';
import { Reel, REEL_POSITIONS, REEL_VALUES } from '../reel';
import { Char } from '../char-module/char';
import type { PayResult } from '../interfaces';
import { GameStates } from '../game-states';
import { COMBINATIONS } from './combinations';
import {
	PayCheckStrategy,
	createPositionMatchStrategy,
	createAnyLineMatchStrategy,
	createMultiValueMatchStrategy
} from './pay-table-strategy/pay-table-strategy';
import { applyWinHighlight } from './win-highlighter';

export { COMBINATIONS } from './combinations';

export class PayTable {
	public readonly strategiesArr: PayCheckStrategy[];
	public readonly result$ = new Subject<PayResult | null>();

	constructor(public readonly app: Application, public readonly _gameLogicService: GameLogicService, public readonly reels: Reel) {
		this.strategiesArr = [
			createPositionMatchStrategy({
				iconPath: 'assets/CherryIcon.png',
				enumIndex: COMBINATIONS.CHERRY_TOP,
				position: REEL_POSITIONS.TOP,
				reelValue: REEL_VALUES.CHERRY,
				displayLabel: 'TOP LINE',
				displayDetail: '3 DARK ELF'
			}),
			createPositionMatchStrategy({
				iconPath: 'assets/CherryIcon.png',
				enumIndex: COMBINATIONS.CHERRY_CENTER,
				position: REEL_POSITIONS.CENTER,
				reelValue: REEL_VALUES.CHERRY,
				displayLabel: 'CENTER LINE',
				displayDetail: '3 DARK ELF'
			}),
			createPositionMatchStrategy({
				iconPath: 'assets/CherryIcon.png',
				enumIndex: COMBINATIONS.CHERRY_BOTTOM,
				position: REEL_POSITIONS.BOTTOM,
				reelValue: REEL_VALUES.CHERRY,
				displayLabel: 'BOTTOM LINE',
				displayDetail: '3 DARK ELF'
			}),
			createAnyLineMatchStrategy({
				iconPath: 'assets/7Icon.png',
				enumIndex: COMBINATIONS.SEVEN,
				reelValue: REEL_VALUES.SEVEN,
				displayLabel: 'ANY LINE',
				displayDetail: '3 MINOTAUR'
			}),
			createMultiValueMatchStrategy({
				iconPath: 'assets/CherrySevenIcon.png',
				enumIndex: COMBINATIONS.SEVEN_CHERRY,
				reelValues: [REEL_VALUES.SEVEN, REEL_VALUES.CHERRY],
				displayLabel: 'ANY LINE',
				displayDetail: 'DARK ELF + MINOTAUR'
			}),
			createAnyLineMatchStrategy({
				iconPath: 'assets/X3BarIcon.png',
				enumIndex: COMBINATIONS.X3BAR,
				reelValue: REEL_VALUES.X3BAR,
				displayLabel: 'ANY LINE',
				displayDetail: '3 3xGOBLINS'
			}),
			createAnyLineMatchStrategy({
				iconPath: 'assets/X2BarIcon.png',
				enumIndex: COMBINATIONS.X2BAR,
				reelValue: REEL_VALUES.X2BAR,
				displayLabel: 'ANY LINE',
				displayDetail: '3 2xGOBLINS'
			}),
			createAnyLineMatchStrategy({
				iconPath: 'assets/BarIcon.png',
				enumIndex: COMBINATIONS.BAR,
				reelValue: REEL_VALUES.BAR,
				displayLabel: 'ANY LINE',
				displayDetail: '3 GOBLINS'
			}),
			createMultiValueMatchStrategy({
				iconPath: 'assets/AnyBarIcon.png',
				enumIndex: COMBINATIONS.ANY_BAR,
				reelValues: [REEL_VALUES.BAR, REEL_VALUES.X2BAR, REEL_VALUES.X3BAR],
				displayLabel: 'ANY LINE',
				displayDetail: 'ANY GOBLINS COMBO'
			}),
		];
	}

	public checkPayStrategies(reels: Reel, char: Char): void {
		let combination: PayResult = null;

		for (const strategy of this.strategiesArr) {
			const result = strategy.check(reels);
			if (result !== null) {
				applyWinHighlight(reels, result.positionIndex);
				combination = result.combination;
				break;
			}
		}

		const outcome = char.checkBattleResults(combination, this._gameLogicService.DEFAULT_DMG);
		char.finalizeRound();

		switch (outcome) {
			case 'WIN':
				this._gameLogicService.stateMachine.transition(GameStates.WIN);
				break;
			case 'LOSE':
				this._gameLogicService.stateMachine.transition(GameStates.LOSE);
				break;
			case 'WAITING':
				this._gameLogicService.stateMachine.transition(GameStates.WAITING);
				break;
		}

		this.result$.next(combination);
	}
}
