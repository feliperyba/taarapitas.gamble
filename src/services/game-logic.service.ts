import { Component, OnInit, ViewChild, Injectable } from '@angular/core';
import { Sprite, Application, Rectangle, Texture, Container, TextStyle, Text } from 'pixi.js';

import { Reel } from '../model/reel';
import { GUI } from '../model/gui-module/gui';
import { PayTable } from '../model/pay-module/pay-table';
import { Char } from '../model/char-module/char';
import { Button } from '../model/gui-module/button';

export enum GameStates {
	WAITING,
	START,
	ROLL,
	RESULTS,
	WIN,
	LOSE
}

@Injectable()
export class GameLogicService {
	public DEFAULT_DMG = 5;
	public POTION_PRICE = 25;
	public POTION_HEALTH = 10;
	public state = GameStates.WAITING;
	public debugConfig: any;
	public msgContainer = new Container();

	constructor() {
		// Create Msg board to notify the user
		this.msgContainer.visible = false;
		this.msgContainer.width = 400;
		this.msgContainer.height = 300;
		this.msgContainer.x = window.screen.width / 3;
		this.msgContainer.y = window.screen.height / 2;

		// Add message background
	}

	public gameLoop(app: Application, reels: Reel, gui: GUI, payTable: PayTable, char: Char) {
		switch (this.state) {
			case GameStates.WAITING:
				break;
			case GameStates.START:
				if (char.credits-- > 0) {
					// skill does not cost credits
					if (!char.usingSkill) {
						char.credits -= 1.0;
					}
					this.rollSlots(reels, char.usingSkill);
				} else {
					alert('You dont have gold coins to play');
					GameStates.WAITING;
				}
				break;
			case GameStates.ROLL:
				break;
			case GameStates.RESULTS:
				this.checkReelResults(reels, payTable, char);
				break;
			case GameStates.WIN:
				break;
			case GameStates.LOSE:
				this.showEndGameMsg(char, app);
				break;
		}
	}

	public rollSlots(reels: Reel, usingSkill: boolean) {
		if (this.state == GameStates.ROLL) return;
		this.state = GameStates.ROLL;
		reels.spin(usingSkill);
	}

	public checkReelResults(reels: Reel, payTable: PayTable, char: Char) {
		payTable.checkPayStrategies(reels, char);
	}

	public showEndGameMsg(char: Char, app: Application) {
		if (this.msgContainer.visible == false) {
			const style = new TextStyle({
				fontFamily: 'Primitive',
				fontSize: 22,
				fontStyle: '',
				fontWeight: 'bold',
				fill: [ '#fff', '#FF0000' ], // gradient
				stroke: '#000',
				strokeThickness: 5,
				dropShadow: true,
				dropShadowColor: '#B2240C',
				dropShadowBlur: 2,
				dropShadowAngle: Math.PI / 6,
				dropShadowDistance: 3,
				wordWrap: true,
				wordWrapWidth: 400
			});
			const Bigstyle = new TextStyle({
				fontFamily: 'Primitive',
				fontSize: 36,
				fontStyle: '',
				fontWeight: 'bold',
				fill: [ '#fff', '#FF0000' ], // gradient
				stroke: '#000',
				strokeThickness: 5,
				dropShadow: true,
				dropShadowColor: '#B2240C',
				dropShadowBlur: 2,
				dropShadowAngle: Math.PI / 6,
				dropShadowDistance: 3,
				wordWrap: true,
				wordWrapWidth: 400
			});

			// Add background
			const background = new Sprite(PIXI.Loader.shared.resources['../assets/lose_msg.png'].texture);
			background.x = this.msgContainer.width / 2 + 64;
			background.y = this.msgContainer.height / 2 + 64;

			// Add End text
			let string = 'You Lose!';
			const loseText = new Text(string, Bigstyle);
			loseText.x = background.x + background.width / 5 + 96;
			loseText.y = background.y + background.width / 4;

			string = '\n\n\n You have survived for ' + char.roundsAlive.toString() + ' rounds';
			const text = new Text(string, style);
			text.x = background.x + background.width / 5 + 16;
			text.y = background.y + background.width / 4;

			// Add End btn
			const btnTexture = PIXI.Loader.shared.resources['../assets/button.png'].texture;
			const btnOverTexture = PIXI.Loader.shared.resources['../assets/button-HOVER.png'].texture;
			const btnPushTexture = PIXI.Loader.shared.resources['../assets/button-PUSH.png'].texture;
			const endBtn = new Button(96, 248, btnTexture, btnOverTexture, btnPushTexture, 'Restart', style);
			endBtn.btnContainer.x = background.x + background.width / 2 - 54;
			endBtn.btnContainer.y = background.y + background.width / 2 + 32;
			endBtn.btnText.x += 8;
			endBtn.btnText.y += 4;

			endBtn.btnContainer.on('pointerdown', () => {
				window.location.reload();
			});

			this.msgContainer.addChild(background);
			this.msgContainer.addChild(loseText);
			this.msgContainer.addChild(text);
			this.msgContainer.addChild(endBtn.btnContainer);
			this.msgContainer.x = app.stage.x / 2;
			this.msgContainer.y = app.stage.y / 2;

			this.msgContainer.visible = true;
			app.stage.addChild(this.msgContainer);
		}
	}
}
