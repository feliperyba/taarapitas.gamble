import { Component, OnInit, ViewChild } from '@angular/core';
import { Sprite, Application, Rectangle, Texture, TextStyle, Graphics, Container, DisplayObject, Text } from 'pixi.js';
import { GameLogicService, GameStates } from '../../../services/game-logic.service';
import { PayTable } from '../../pay-module/pay-table';
import { PayTableStrategy } from '../../pay-module/pay-table-strategy/pay-table-strategy';

declare var PIXI: any;

export class PayTableGUI {
	private descStyle = new TextStyle({
		fontFamily: 'Primitive',
		fontSize: 18,
		fontStyle: '',
		fontWeight: 'bold',
		fill: [ '#fff', '#ccc' ], // gradient
		stroke: '#000',
		strokeThickness: 3,
		dropShadow: true,
		dropShadowColor: '#C86913',
		dropShadowBlur: 0,
		dropShadowAngle: Math.PI / 6,
		dropShadowDistance: 0,
		wordWrap: true,
		wordWrapWidth: 256
	});
	private normalStyle = new TextStyle({
		fontFamily: 'Primitive',
		fontSize: 22,
		fontStyle: '',
		fontWeight: 'bold',
		fill: [ '#ffffff', '#a99047' ], // gradient
		stroke: '#000',
		strokeThickness: 2,
		dropShadow: true,
		dropShadowColor: '#f2ebb5',
		dropShadowBlur: 0,
		dropShadowAngle: Math.PI / 6,
		dropShadowDistance: 0,
		wordWrap: true,
		wordWrapWidth: 400
	});
	private smallStyle = new TextStyle({
		fontFamily: 'Primitive',
		fontSize: 16,
		fontStyle: '',
		fontWeight: 'bold',
		fill: [ '#fff', '#ccc' ], // gradient
		stroke: '#000',
		strokeThickness: 2,
		dropShadow: true,
		dropShadowColor: '#C86913',
		dropShadowBlur: 0,
		dropShadowAngle: Math.PI / 6,
		dropShadowDistance: 0,
		wordWrap: true,
		wordWrapWidth: 400
	});

	private FRAME: Texture = PIXI.Loader.shared.resources['../assets/paytable_frame.png'].texture;
	private FRAME_HIGHLIGHT: Sprite = new Sprite(
		PIXI.Loader.shared.resources['../assets/paytable_frame_highlight.png'].texture
	);

	public payTableContainer = new Container();
	public payTableObjs = [];
	public result: any;
	private changeAlpha = false;

	constructor(public app: Application, public payTable: PayTable, public _gameLogicService: GameLogicService) {
		this.payTableContainer.width = 265;
		this.payTableContainer.height = 500;
		this.payTableContainer.x = 0;
		this.payTableContainer.y = 30;

		// Add frame highlight obj
		this.FRAME_HIGHLIGHT.scale.x = this.FRAME_HIGHLIGHT.scale.y = Math.min(
			196 / this.FRAME_HIGHLIGHT.width,
			96 / this.FRAME_HIGHLIGHT.height
		);
		this.FRAME_HIGHLIGHT.visible = false;

		let positionY = this.payTableContainer.y;
		let i = 0;
		// Loop trough pay strategies and add it to the GUI
		for (let payStrategy of this.payTable.strategiesArr) {
			const payOptionRegion = new Graphics();
			payOptionRegion.width = this.payTableContainer.width;
			payOptionRegion.height = this.payTableContainer.height / 9;

			payOptionRegion.y = positionY;
			payOptionRegion.x = payOptionRegion.width / 2 + 52;

			const payIcon = new Sprite(payStrategy.payIcon);
			const payFrame = new Sprite(this.FRAME);
			const combDesc = new Text(payStrategy.combDesc, this.smallStyle);
			const payDesc = new Text(payStrategy.desc, this.smallStyle);
			const payValue = new Text(payStrategy.enumIndex, this.normalStyle);
			const COIN = new Text(payStrategy.enumIndex);
			// plot pay icon
			// scale to fit container
			payIcon.y = positionY;
			payIcon.x = payIcon.width / 2 - 48 + 20;
			payIcon.scale.x = payIcon.scale.y = Math.min(48 / payIcon.width, 48 / payIcon.height);
			if (i == 7) {
				payIcon.x = payIcon.width / 2 - 20 + 20;
			}
			// plot pay frame
			// scale to fit container
			payFrame.y = positionY;
			payFrame.x = payOptionRegion.width / 2 + 20;
			payFrame.scale.x = payFrame.scale.y = Math.min(190 / payFrame.width, 96 / payFrame.height);

			//plot combination description
			combDesc.y = positionY + 40;
			combDesc.x = payOptionRegion.width / 2 + 40;
			combDesc.rotation = -45;

			//plot combination description
			payDesc.y = positionY + 40;
			payDesc.x = payOptionRegion.width / 2 + 60;
			payDesc.rotation = -45;

			//plot credits value
			payValue.y = positionY + 12;
			payValue.x = payOptionRegion.width / 2 + 112;

			const coin: Sprite = new Sprite(PIXI.Loader.shared.resources['../assets/coin_reward.png'].texture);
			coin.y = positionY + 10;
			coin.x = payOptionRegion.width / 2 + 172;
			coin.scale.x = coin.scale.y = Math.min(32 / coin.width, 32 / coin.height);

			payOptionRegion.addChild(payIcon);
			payOptionRegion.addChild(payFrame);
			payOptionRegion.addChild(combDesc);
			payOptionRegion.addChild(payDesc);

			// Add region to the container array
			this.payTableObjs[payStrategy.enumIndex] = { container: payFrame, pos: i };
			this.payTableContainer.addChild(payOptionRegion);

			payOptionRegion.addChild(coin);
			payOptionRegion.addChild(payValue);

			Math.round((positionY += 24));
			i++;
		}
		// Add to the stage screen
		this.app.stage.addChild(this.payTableContainer);
		this.payTableContainer.addChild(this.FRAME_HIGHLIGHT);
		this.payTable.payTableGUI = this;

		this.addPayWinAnimations();
	}

	public addPayWinAnimations() {
		// Locate result position and play indicator
		this.app.ticker.add(() => {
			let now = Date.now();
			if (this._gameLogicService.state == GameStates.WIN && this.result != null) {
				this.FRAME_HIGHLIGHT.visible = true;
				const currPayObj = this.payTableObjs[this.result];
				this.FRAME_HIGHLIGHT.x = currPayObj.container.x + 54;
				if (currPayObj.pos <= 0) {
					currPayObj.pos = 1;
				}
				this.FRAME_HIGHLIGHT.y = 40 + Math.round(51 * currPayObj.pos);
				this.FRAME_HIGHLIGHT.visible = true;

				if (currPayObj.pos <= 3) {
					this.FRAME_HIGHLIGHT.y += 2.5 * currPayObj.pos;
				}
				if (currPayObj.pos >= 6) {
					this.FRAME_HIGHLIGHT.y -= 1.5 * currPayObj.pos;
				}

				//Toogle Alpha
				if (!this.changeAlpha) {
					if (this.FRAME_HIGHLIGHT.alpha < 0) {
						this.changeAlpha = !this.changeAlpha;
					}
					this.FRAME_HIGHLIGHT.alpha -= 0.1;
				}

				if (this.changeAlpha) {
					if (this.FRAME_HIGHLIGHT.alpha > 1.0) {
						this.changeAlpha = !this.changeAlpha;
					}
					this.FRAME_HIGHLIGHT.alpha += 0.1;
				}
			} else {
				this.FRAME_HIGHLIGHT.visible = false;
			}
		});
	}
}
