import { Component, OnInit, ViewChild } from '@angular/core';
import { Sprite, Application, Rectangle, Texture, Container, DisplayObject, Text } from 'pixi.js';
import { GameLogicService, GameStates } from '../../services/game-logic.service';
import { Reel } from '../reel';
import { Char } from '../char-module/char';
import { PayTableStrategy } from '../../model/pay-module/pay-table-strategy/pay-table-strategy';
import { PayTableGUI } from '../../model/pay-module/pay-table-gui/pay-table-gui';

declare const PIXI: any;

export enum COMBINATIONS {
	CHERRY_TOP = 2000,
	CHERRY_CENTER = 1000,
	CHERRY_BOTTOM = 4000,
	SEVEN = 150,
	SEVEN_CHERRY = 75,
	X3BAR = 50,
	X2BAR = 20,
	BAR = 10,
	ANY_BAR = 5
}

export class PayTable {
	public strategiesArr = [];
	public payTableGUI: PayTableGUI;

	constructor(public app: Application, public _gameLogicService: GameLogicService, public reels: Reel) {
		this.strategiesArr = [
			new PayTableStrategy.CherryBottonStrategy(),
			new PayTableStrategy.CherryTopStrategy(),
			new PayTableStrategy.CherryCenterStrategy(),
			new PayTableStrategy.SevenStrategy(),
			new PayTableStrategy.SevenCherryStrategy(),
			new PayTableStrategy.X3BarStrategy(),
			new PayTableStrategy.X2BarStrategy(),
			new PayTableStrategy.BarStrategy(),
			new PayTableStrategy.AnyBarStrategy()
		];
	}

	public checkPayStrategies(reels: Reel, char: Char): any {
		const payCheck = new Promise((resolve, reject) => {
			for (let strategy of this.strategiesArr) {
				let payContext = new PayTableStrategy.PayTableContext(strategy, reels);
				const result = payContext.executeStrategy();
				if (result != null) {
					resolve(result);
					break;
				}
			}
			resolve(null);
			reject(new Error('Error checking'));
		});

		payCheck
			.then((result) => {
				char.checkBattleResults(result, this._gameLogicService);
				this.payTableGUI.result = result;
				return result;
			})
			.catch((err) => {
				console.log(err);
				return null;
			});
	}
}
