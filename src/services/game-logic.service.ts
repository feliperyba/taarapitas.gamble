import { Injectable } from '@angular/core';
import { Sprite, Application, Container, FillGradient, TextStyle, Text } from 'pixi.js';
import { Reel } from '../model/reel';
import { GUI } from '../model/gui-module/gui';
import { PayTable } from '../model/pay-module/pay-table';
import { Char } from '../model/char-module/char';
import { Button } from '../model/gui-module/button';
import { getTexture } from '../rendering/assets';
import { DESIGN_HEIGHT, DESIGN_WIDTH, SCENE_LAYOUT } from '../rendering/viewport';

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
		this.msgContainer.visible = false;
		this.msgContainer.x = DESIGN_WIDTH / 2 - SCENE_LAYOUT.overlay.width / 2;
		this.msgContainer.y = DESIGN_HEIGHT / 2 - SCENE_LAYOUT.overlay.height / 2;
	}

	public gameLoop(app: Application, sceneRoot: Container, reels: Reel, gui: GUI, payTable: PayTable, char: Char) {
		switch (this.state) {
			case GameStates.WAITING:
				break;
			case GameStates.START:
				if (char.credits-- > 0) {
					if (!char.usingSkill) {
						char.credits -= 1.0;
					}
					this.rollSlots(reels, char.usingSkill);
				} else {
					alert('You dont have gold coins to play');
					this.state = GameStates.WAITING;
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
				this.showEndGameMsg(char, sceneRoot);
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

	public showEndGameMsg(char: Char, sceneRoot: Container) {
		if (this.msgContainer.visible == false) {
			this.msgContainer.removeChildren();
			const grad = new FillGradient({
				start: { x: 0, y: 0 },
				end: { x: 0, y: 1 },
				textureSpace: 'local'
			});
			grad.addColorStop(0, '#ffffff').addColorStop(1, '#ff0000');
			const style = new TextStyle({
				fontFamily: 'Primitive',
				fontSize: 22,
				fontStyle: 'normal',
				fontWeight: 'bold',
				fill: grad,
				stroke: { color: '#000', width: 5 },
				dropShadow: {
					color: '#B2240C',
					blur: 2,
					angle: Math.PI / 6,
					distance: 3
				},
				wordWrap: true,
				wordWrapWidth: 400
			});
			const bigGrad = new FillGradient({
				start: { x: 0, y: 0 },
				end: { x: 0, y: 1 },
				textureSpace: 'local'
			});
			bigGrad.addColorStop(0, '#ffffff').addColorStop(1, '#ff0000');
			const Bigstyle = new TextStyle({
				fontFamily: 'Primitive',
				fontSize: 36,
				fontStyle: 'normal',
				fontWeight: 'bold',
				fill: bigGrad,
				stroke: { color: '#000', width: 5 },
				dropShadow: {
					color: '#B2240C',
					blur: 2,
					angle: Math.PI / 6,
					distance: 3
				},
				wordWrap: true,
				wordWrapWidth: 400
			});

			const background = new Sprite(getTexture('assets/lose_msg.png'));
			background.x = 0;
			background.y = 0;
			background.width = SCENE_LAYOUT.overlay.width;
			background.height = SCENE_LAYOUT.overlay.height;

			let string = 'You Lose!';
			const loseText = new Text({ text: string, style: Bigstyle });
			loseText.x = SCENE_LAYOUT.overlay.width / 2 - loseText.width / 2;
			loseText.y = 128;

			string = 'You have survived for ' + char.roundsAlive.toString() + ' rounds';
			const text = new Text({ text: string, style });
			text.x = SCENE_LAYOUT.overlay.width / 2 - text.width / 2;
			text.y = 238;

			const btnTexture = getTexture('assets/button.png');
			const btnOverTexture = getTexture('assets/button-HOVER.png');
			const btnPushTexture = getTexture('assets/button-PUSH.png');
			const endBtn = new Button(96, 248, btnTexture, btnOverTexture, btnPushTexture, 'Restart', style);
			endBtn.btnContainer.x = SCENE_LAYOUT.overlay.width / 2 - 124;
			endBtn.btnContainer.y = 352;

			endBtn.btnContainer.on('pointerdown', () => {
				window.location.reload();
			});

			this.msgContainer.addChild(background);
			this.msgContainer.addChild(loseText);
			this.msgContainer.addChild(text);
			this.msgContainer.addChild(endBtn.btnContainer);
			this.msgContainer.x = DESIGN_WIDTH / 2 - SCENE_LAYOUT.overlay.width / 2;
			this.msgContainer.y = DESIGN_HEIGHT / 2 - SCENE_LAYOUT.overlay.height / 2;

			this.msgContainer.visible = true;
			sceneRoot.addChild(this.msgContainer);
		}
	}
}
