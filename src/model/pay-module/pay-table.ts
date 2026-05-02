import { Application } from 'pixi.js';
import { Subject } from 'rxjs';
import { GameLogicService } from '../../services/game-logic.service';
import { Reel } from '../reel';
import { REEL_POSITIONS, REEL_VALUES } from '../reel-types';
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

type PositionConfig = {
	type: 'position';
	iconPath: string;
	enumIndex: COMBINATIONS;
	position: REEL_POSITIONS;
	reelValue: REEL_VALUES;
	displayLabel: string;
	displayDetail: string;
};

type AnyLineConfig = {
	type: 'anyLine';
	iconPath: string;
	enumIndex: COMBINATIONS;
	reelValue: REEL_VALUES;
	displayLabel: string;
	displayDetail: string;
};

type MultiValueConfig = {
	type: 'multiValue';
	iconPath: string;
	enumIndex: COMBINATIONS;
	reelValues: REEL_VALUES[];
	displayLabel: string;
	displayDetail: string;
};

type StrategyConfig = PositionConfig | AnyLineConfig | MultiValueConfig;

export class PayTable {
	private static readonly STRATEGY_CONFIGS: StrategyConfig[] = [
		{ type: 'position', iconPath: 'assets/CherryIcon.png', enumIndex: COMBINATIONS.CHERRY_TOP, position: REEL_POSITIONS.TOP, reelValue: REEL_VALUES.CHERRY, displayLabel: 'TOP LINE', displayDetail: '3 DARK ELF' },
		{ type: 'position', iconPath: 'assets/CherryIcon.png', enumIndex: COMBINATIONS.CHERRY_CENTER, position: REEL_POSITIONS.CENTER, reelValue: REEL_VALUES.CHERRY, displayLabel: 'CENTER LINE', displayDetail: '3 DARK ELF' },
		{ type: 'position', iconPath: 'assets/CherryIcon.png', enumIndex: COMBINATIONS.CHERRY_BOTTOM, position: REEL_POSITIONS.BOTTOM, reelValue: REEL_VALUES.CHERRY, displayLabel: 'BOTTOM LINE', displayDetail: '3 DARK ELF' },
		{ type: 'anyLine', iconPath: 'assets/7Icon.png', enumIndex: COMBINATIONS.SEVEN, reelValue: REEL_VALUES.SEVEN, displayLabel: 'ANY LINE', displayDetail: '3 MINOTAUR' },
		{ type: 'multiValue', iconPath: 'assets/CherrySevenIcon.png', enumIndex: COMBINATIONS.SEVEN_CHERRY, reelValues: [REEL_VALUES.SEVEN, REEL_VALUES.CHERRY], displayLabel: 'ANY LINE', displayDetail: 'DARK ELF + MINOTAUR' },
		{ type: 'anyLine', iconPath: 'assets/X3BarIcon.png', enumIndex: COMBINATIONS.X3BAR, reelValue: REEL_VALUES.X3BAR, displayLabel: 'ANY LINE', displayDetail: '3 3xGOBLINS' },
		{ type: 'anyLine', iconPath: 'assets/X2BarIcon.png', enumIndex: COMBINATIONS.X2BAR, reelValue: REEL_VALUES.X2BAR, displayLabel: 'ANY LINE', displayDetail: '3 2xGOBLINS' },
		{ type: 'anyLine', iconPath: 'assets/BarIcon.png', enumIndex: COMBINATIONS.BAR, reelValue: REEL_VALUES.BAR, displayLabel: 'ANY LINE', displayDetail: '3 GOBLINS' },
		{ type: 'multiValue', iconPath: 'assets/AnyBarIcon.png', enumIndex: COMBINATIONS.ANY_BAR, reelValues: [REEL_VALUES.BAR, REEL_VALUES.X2BAR, REEL_VALUES.X3BAR], displayLabel: 'ANY LINE', displayDetail: 'ANY GOBLINS COMBO' },
	];

	public readonly strategies: PayCheckStrategy[];
	public readonly result$ = new Subject<PayResult | null>();

	constructor(public readonly app: Application, public readonly gameLogicService: GameLogicService, public readonly reels: Reel) {
		this.strategies = PayTable.STRATEGY_CONFIGS.map(config => {
			switch (config.type) {
				case 'position': return createPositionMatchStrategy(config);
				case 'anyLine': return createAnyLineMatchStrategy(config);
				case 'multiValue': return createMultiValueMatchStrategy(config);
				default: throw new Error(`Unknown strategy type: ${config satisfies never}`);
			}
		});
	}

	public checkPayStrategies(reels: Reel, char: Char): void {
		let combination: PayResult = null;

		for (const strategy of this.strategies) {
			const result = strategy.check(reels);
			if (result !== null) {
				applyWinHighlight(reels, result.positionIndex);
				combination = result.combination;
				break;
			}
		}

		const outcome = char.checkBattleResults(combination, this.gameLogicService.DEFAULT_DMG);
		char.finalizeRound();

		this.result$.next(combination);

		switch (outcome) {
			case 'WIN':
				this.gameLogicService.stateMachine.transition(GameStates.WIN);
				break;
			case 'LOSE':
				this.gameLogicService.stateMachine.transition(GameStates.LOSE);
				break;
			case 'WAITING':
				this.gameLogicService.stateMachine.transition(GameStates.WAITING);
				break;
		}
	}

	public destroy(): void {
		this.result$.complete();
	}
}
