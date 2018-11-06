import { Component, OnInit, ViewChild } from '@angular/core';
import { Sprite, Application, Rectangle, Texture, Container, TextStyle, Graphics, DisplayObject, Text } from 'pixi.js';
import { GameLogicService, GameStates } from '../../services/game-logic.service';
import { Reel } from '../reel';
import { Char } from '../char-module/char';
import { CharGUI } from '../char-module/char-gui/char-gui';
import { Button } from './button';
import { PayTableGUI } from '../pay-module/pay-table-gui/pay-table-gui';
import { PayTable } from '../pay-module/pay-table';

declare var PIXI: any;

export class GUI {
	private DEFAULT_STYLE = new TextStyle({
		fontFamily: 'Primitive',
		fontSize: 22,
		fontStyle: '',
		fontWeight: 'bold',
		fill: [ '#fff', '#ccc' ], // gradient
		stroke: '#000',
		strokeThickness: 5,
		dropShadow: true,
		dropShadowColor: '#C86913',
		dropShadowBlur: 0,
		dropShadowAngle: Math.PI / 6,
		dropShadowDistance: 0,
		wordWrap: true,
		wordWrapWidth: 400
	});

	constructor(
		public app: Application,
		public reel: Reel,
		public char: Char,
		public payTable: PayTable,
		public style: TextStyle,
		public _gameLogicService: GameLogicService
	) {
		this.GUISetup();
	}

	public GUISetup() {
		// Add frame background
		this.app.stage.addChild(new Sprite(PIXI.Loader.shared.resources['../assets/background_frame.png'].texture));

		// Set Reel Container
		var margin = (this.app.screen.height - this.reel.SYMBOL_SIZE * this.reel.SLOT_NUMBER) / 2;
		this.reel.reelContainer.y = margin + 32;
		this.reel.reelContainer.x =
			Math.round((this.app.screen.width - this.reel.REEL_WIDTH * this.reel.SLOT_NUMBER) / 2) + 144;

		var top = new Graphics();
		top.beginFill(0, 1);
		top.drawRect(0, -227, this.app.screen.width, margin * 3);

		var bottom = new Graphics();
		bottom.beginFill(0, 1);
		bottom.drawRect(0, this.reel.reelContainer.height - this.reel.SYMBOL_SIZE * 2, this.app.screen.width, margin);

		this.reel.reelContainer.addChild(top);
		this.reel.reelContainer.addChild(bottom);

		// Set Char container
		this.app.stage.addChild(
			new CharGUI(this.app, this.char, this._gameLogicService, this.style, this.reel, margin).setup()
		);

		// Add play btn
		const btnTexture = PIXI.Loader.shared.resources['../assets/button.png'].texture;
		const btnOverTexture = PIXI.Loader.shared.resources['../assets/button-HOVER.png'].texture;
		const btnPushTexture = PIXI.Loader.shared.resources['../assets/button-PUSH.png'].texture;
		const playBtn = new Button(96, 248, btnTexture, btnOverTexture, btnPushTexture, 'Fight', this.DEFAULT_STYLE);

		playBtn.btnContainer.width += 32;
		playBtn.btnContainer.height -= 8;
		playBtn.btnContainer.x = this.app.stage.width / 10 - 28;
		playBtn.btnContainer.y = this.app.stage.height - 284;
		playBtn.btnText.x += 18;
		playBtn.btnText.y += 4;

		// Set the interactivity.
		playBtn.btnContainer.interactive = true;
		playBtn.btnContainer.buttonMode = true;
		playBtn.btnContainer.addListener('pointerdown', () => {
			if (this._gameLogicService.state == GameStates.WAITING) {
				this._gameLogicService.state = GameStates.START;
			}
			// if the player won the last round, reset reels and roll again
			if (this._gameLogicService.state == GameStates.WIN) {
				for (let r of this.reel.reelArr) {
					r.container.children[this.reel.reelWinSlotPos].tint = 16777215;
				}
				this.reel.reelWinSlotPos = 0;
				this._gameLogicService.state = GameStates.START;
			}
		});

		this.app.stage.addChild(playBtn.btnContainer);
	}

	public lerp(a1, a2, t) {
		return a1 * (1 - t) + a2 * t;
	}
}
