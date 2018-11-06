import { Component, OnInit, ViewChild } from '@angular/core';
import { Sprite, Application, Rectangle, Texture, TextStyle, Graphics, Container, DisplayObject, Text } from 'pixi.js';
import { GameLogicService, GameStates } from '../../../services/game-logic.service';
import { Char } from '../../char-module/char';
import { CharStrategy } from '../../char-module/char-strategy/char-strategy';
import { AppComponent } from '../../../app/app.component';
import { Reel } from '../../reel';
import { Button } from '../../gui-module/button';

declare var PIXI: any;

export class CharSelectionScreen {
	private CHAR_BOX_H = this.app.screen.height;
	private CHAR_BOX_W = this.app.screen.width / 4;
	private btnTexture = PIXI.Loader.shared.resources['../assets/button.png'].texture;
	private btnOverTexture = PIXI.Loader.shared.resources['../assets/button-HOVER.png'].texture;
	private btnPushTexture = PIXI.Loader.shared.resources['../assets/button-PUSH.png'].texture;

	private charClasses = [
		new CharStrategy.WarriorClassStrategy(),
		new CharStrategy.BerserkerClassStrategy(),
		new CharStrategy.MageClassStrategy(),
		new CharStrategy.ClericClassStrategy()
	];

	public selectCharContainer = new Container();

	constructor(private app: Application, private appComponent: AppComponent) {
		let i = 0;
		const Titlestyle = new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 32,
			fontStyle: '',
			fontWeight: 'bold',
			fill: [ '#753213', '#FAE888' ], // gradient
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

		const descStyle = new TextStyle({
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
			wordWrapWidth: this.CHAR_BOX_W - 18
		});

		const style = new TextStyle({
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

		// Create Class options
		for (let char of this.charClasses) {
			const charRegionGraphics = new Graphics();
			const classBackground = new Sprite(char.BACKGROUND);
			const classPortrait = new Sprite(char.PORTRAIT);
			const lifeIcon = new Sprite(PIXI.Loader.shared.resources['../assets/life_icon.png'].texture);
			const creditIcon = new Sprite(PIXI.Loader.shared.resources['../assets/credit_icon.png'].texture);

			const classNameText: Text = new Text(char.NAME, Titlestyle);
			const creditsText: Text = new Text(char.CREDITS.toString(), style);
			const lifeText: Text = new Text(char.LIFE.toString(), style);

			const SkillText: Text = new Text(char.SKILL_DESC, descStyle);

			charRegionGraphics.y = this.app.screen.height / 2;
			charRegionGraphics.x = 32;

			if (i > 0) {
				// put a little margin between then
				charRegionGraphics.x = this.CHAR_BOX_W * i + 32;
			}

			// plot class background
			// scale to fit container
			classBackground.y = charRegionGraphics.height / 2 - 292;
			if (i > 0) {
				classBackground.x = charRegionGraphics.width / 2 - 26;
			} else {
				classBackground.x = charRegionGraphics.width / 2 - 24;
			}
			classBackground.scale.x = classBackground.scale.y = Math.min(
				190 / classBackground.width,
				1000 / classBackground.height
			);

			// plot class portrait
			// scale to fit container
			classPortrait.y = charRegionGraphics.height / 2 - 260;
			classPortrait.x = charRegionGraphics.width / 2 - 32;
			classPortrait.scale.x = classPortrait.scale.y = Math.min(
				200 / classPortrait.width,
				200 / classPortrait.height
			);

			// Plot Class Name
			classNameText.y = charRegionGraphics.height / 2 - 75;
			classNameText.x = charRegionGraphics.width / 2;

			if (i > 0) {
				switch (i) {
					case 1:
						classNameText.x -= 16;
						break;
					case 2:
						classNameText.x += 20;
						break;
					case 3:
						classNameText.x += 20;
						break;
				}
			}

			// Plot Class Life
			lifeIcon.y = charRegionGraphics.height / 2 - 16;
			lifeIcon.x = charRegionGraphics.width / 2 - 16;

			lifeText.y = charRegionGraphics.height / 2;
			lifeText.x = charRegionGraphics.width / 2;

			// Plot Class Credits
			creditIcon.y = charRegionGraphics.height / 2 - 16;
			creditIcon.x = charRegionGraphics.width / 2 + 84;

			creditsText.y = charRegionGraphics.height / 2;
			creditsText.x = charRegionGraphics.width / 2 + 100;
			if (i == 2) {
				creditsText.x = charRegionGraphics.width / 2 + 92;
			}

			// Plot Class Skill
			SkillText.y = charRegionGraphics.height / 2 + 80;
			SkillText.x = -16;

			// create select btn
			const btnSelect = new Button(
				172,
				172,
				this.btnTexture,
				this.btnOverTexture,
				this.btnPushTexture,
				'Select',
				style
			);

			btnSelect.btnContainer.addListener('pointerdown', () => {
				const target = char.TARGET_TYPE == 'Char' ? null : this.appComponent.reel;
				const context = new CharStrategy.CharContext(char, target);
				this.appComponent.char = context.createCharClass();
				this.appComponent.char.charContext = context;

				if (this.appComponent.char.charContext.target == null) {
					this.appComponent.char.charContext.target = this.appComponent.char;
				}
				// Setup game
				this.appComponent.setup();
			});

			btnSelect.btnContainer.x = SkillText.x + 48;
			btnSelect.btnContainer.y = SkillText.y + 172;

			// Add graphics to the container
			charRegionGraphics.addChild(classBackground);
			charRegionGraphics.addChild(classPortrait);
			charRegionGraphics.addChild(classNameText);
			charRegionGraphics.addChild(lifeIcon);
			charRegionGraphics.addChild(lifeText);
			charRegionGraphics.addChild(creditIcon);
			charRegionGraphics.addChild(creditsText);
			charRegionGraphics.addChild(SkillText);
			charRegionGraphics.addChild(btnSelect.btnContainer);

			charRegionGraphics.interactive = true;
			charRegionGraphics.buttonMode = true;

			this.selectCharContainer.addChild(charRegionGraphics);
			i++;
		}
	}
}
