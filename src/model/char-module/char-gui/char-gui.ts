import { Component, OnInit, ViewChild } from '@angular/core';
import { Sprite, Application, Rectangle, Texture, TextStyle, Graphics, Container, DisplayObject, Text } from 'pixi.js';
import { GameLogicService, GameStates } from '../../../services/game-logic.service';
import { Char } from '../../char-module/char';
import { IfStmt } from '@angular/compiler';
import { Reel } from '../../reel';

declare var PIXI: any;

export class CharGUI {
	public charGUIContainer = new Container();
	public charRegionGraphics = new Graphics();
	public creditsText: Text = new Text();
	public lifeText: Text = new Text();
	public lifeBar: Sprite;
	public lvlText: Text = new Text();

	private changeSkillAlpha = false;
	private changeLifeAlpha = false;

	constructor(
		public app: Application,
		public char: Char,
		public _gameLogicService: GameLogicService,
		public style: TextStyle,
		public reel: Reel,
		public margin: number
	) {}

	public setup(): Graphics {
		this.charRegionGraphics = this.charRegionGraphics.beginFill(0, 1);
		this.charRegionGraphics.drawRect(0, 0, this.app.screen.width, this.margin);

		this.setupCharFrame();

		return this.charRegionGraphics;
	}

	private setupCharFrame() {
		const portrait = new Sprite(this.char.portrait);
		const frame = new Sprite(PIXI.Loader.shared.resources['../assets/char_frame.png'].texture);
		const isProtectedframe = new Sprite(PIXI.Loader.shared.resources['../assets/protected_icon.png'].texture);
		const coin = new Sprite(PIXI.Loader.shared.resources['../assets/coin.png'].texture);

		// plot class portrait
		// scale to fit container
		portrait.y = Math.round((this.charRegionGraphics.width - this.creditsText.width) / 16) - 54;
		portrait.x = Math.round((this.margin - this.creditsText.height) / 4) - 26;
		portrait.scale.x = portrait.scale.y = Math.min(120 / portrait.width, 120 / portrait.height);

		// plot class frame
		// scale to fit container
		frame.y = Math.round((this.charRegionGraphics.width - this.creditsText.width) / 16) - 68;
		frame.x = Math.round((this.margin - this.creditsText.height) / 4) - 30;
		frame.scale.x = frame.scale.y = Math.min(320 / frame.width, 320 / frame.height);
		frame.interactive = true;
		frame.buttonMode = true;

		// plot class isProtectedframe
		// scale to fit container
		isProtectedframe.y = Math.round((this.charRegionGraphics.width - isProtectedframe.width) / 16);
		isProtectedframe.x = Math.round((this.margin - isProtectedframe.height) / 4) + 8;
		isProtectedframe.scale.x = isProtectedframe.scale.y = Math.min(
			64 / isProtectedframe.width,
			64 / isProtectedframe.height
		);
		isProtectedframe.visible = false;

		// plot class coins
		// scale to fit container
		coin.y = Math.round((this.charRegionGraphics.width - coin.width) / 16) - 16;
		coin.x = Math.round((this.margin - coin.height) / 4) + 362;
		coin.scale.x = coin.scale.y = Math.min(48 / coin.width, 48 / coin.height);

		this.charRegionGraphics.addChild(portrait);
		this.charRegionGraphics.addChild(frame);
		this.charRegionGraphics.addChild(coin);

		this.setupLifeBar();
		this.setupInfoBtn();
		this.setupCredits();
		this.setupClassSkillBtn();
		this.setupPotionBtn();

		//set isProtected animation
		this.app.ticker.add(() => {
			if (this.char.isProtected) {
				isProtectedframe.visible = true;
			} else {
				isProtectedframe.visible = false;
			}
		});

		this.charRegionGraphics.addChild(isProtectedframe);
	}

	private setupLifeBar() {
		// Life Bar
		this.lifeBar = new Sprite(PIXI.Loader.shared.resources['../assets/life_bar.png'].texture);
		this.lifeBar.x = Math.round((this.charRegionGraphics.width - this.lifeBar.width) / 8) + 32;
		this.lifeBar.y = Math.round((this.margin - this.lifeBar.height) / 4);

		//Run number lerp animation effect
		this.app.ticker.add(() => {
			let percent = this.char.life / this.char.totalLife * 100;
			const valAux = this.lifeText.text;

			let lerpValue: any = this.lerp(this.char.life, parseInt(valAux), 0.49);
			this.lifeBar.height = 24;
			this.lifeBar.width = this.lifeBar.texture.width / 1.85 * (percent / 100);

			//Toogle Alpha
			if (this.char.life <= 5) {
				if (!this.changeLifeAlpha) {
					if (this.lifeBar.alpha < 0) {
						this.changeLifeAlpha = !this.changeLifeAlpha;
					}
					this.lifeBar.alpha -= 0.1;
				}

				if (this.changeLifeAlpha) {
					if (this.lifeBar.alpha > 1.0) {
						this.changeLifeAlpha = !this.changeLifeAlpha;
					}
					this.lifeBar.alpha += 0.1;
				}
			} else {
				this.lifeBar.alpha = 1;
			}
		});

		//Setup Hit effect
		const hitBar = new Sprite(PIXI.Loader.shared.resources['../assets/hit.png'].texture);
		hitBar.alpha = 0;
		hitBar.x = Math.round((this.charRegionGraphics.width - this.lifeBar.width) / 8) - 104;
		hitBar.y = Math.round((this.margin - this.lifeBar.height) / 4) - 48;
		hitBar.scale.x = hitBar.scale.y = Math.min(172 / hitBar.width, 172 / hitBar.height);

		//Run Hit Effect if Lose condition
		this.app.ticker.add(() => {
			if (this.char.hit == true) {
				this.char.hit = false;
				hitBar.alpha = 1.0;
			} else {
				hitBar.alpha -= 0.01;
			}
		});
		this.charRegionGraphics.addChild(this.lifeBar);
		this.charRegionGraphics.addChild(hitBar);
	}

	private setupCredits() {
		this.creditsText = new Text(this.char.credits.toString(), this.style);
		this.creditsText.x = Math.round((this.charRegionGraphics.width - this.creditsText.width) / 2) - 20;
		this.creditsText.y = Math.round((this.margin - this.creditsText.height) / 4) + 10;

		//Run number lerp animation effect
		this.app.ticker.add(() => {
			const valAux = this.creditsText.text;

			let lerpValue: any = this.lerp(this.char.credits, parseInt(valAux), 0.5);

			this.creditsText.text = Math.round(lerpValue).toString();
		});
		this.charRegionGraphics.addChild(this.creditsText);
	}

	private setupClassSkillBtn() {
		const skillOff = new Sprite(PIXI.Loader.shared.resources['../assets/skill_bar_empty.png'].texture);
		const skillReady = new Sprite(PIXI.Loader.shared.resources['../assets/skill_bar_full.png'].texture);
		const skillDesc = new Text('Skill Bar');

		skillOff.x = Math.round((this.charRegionGraphics.width - this.creditsText.width) / 16) + 212;
		skillOff.y = Math.round((this.margin - this.creditsText.height) / 4) + 76;
		skillOff.scale.x = skillOff.scale.y = Math.min(104 / skillOff.width, 104 / skillOff.height);
		skillOff.width += 32;
		skillOff.rotation -= 179.5;
		skillOff.buttonMode = true;
		skillOff.interactive = true;

		skillReady.x = Math.round((this.charRegionGraphics.width - this.creditsText.width) / 16) + 212;
		skillReady.y = Math.round((this.margin - this.creditsText.height) / 4) + 68;
		skillReady.scale.x = skillReady.scale.y = Math.min(104 / skillReady.width, 104 / skillReady.height);
		skillReady.width += 32;
		skillReady.rotation -= 179.5;
		skillReady.buttonMode = true;
		skillReady.interactive = true;
		skillReady.visible = false;

		// Set btn skill action
		skillReady.on('pointerdown', () => {
			if (
				(this.char.specialBar >= 3 && this._gameLogicService.state == GameStates.WAITING) ||
				this._gameLogicService.state == GameStates.WIN
			) {
				if (this._gameLogicService.state == GameStates.WIN) {
					for (let r of this.reel.reelArr) {
						r.container.children[this.reel.reelWinSlotPos].tint = 16777215;
					}
					this.reel.reelWinSlotPos = 0;
				}

				this.char.usingSkill = true;
				this.char.charContext.useClassSkill(this.char.charContext.target);

				// if Char is the target, remove condition now
				if (this.char.charContext.target instanceof Char) {
					this.char.usingSkill = false;
					this.char.specialBar = 0;
				}
			}
		});

		// Add alpha update and visibility when skill is ready
		this.app.ticker.add(() => {
			if (this.char.specialBar >= 3) {
				skillReady.visible = true;
				//Toogle Alpha
				if (!this.changeSkillAlpha) {
					if (skillReady.alpha < 0) {
						this.changeSkillAlpha = !this.changeSkillAlpha;
					}
					skillReady.alpha -= 0.1;
				}

				if (this.changeSkillAlpha) {
					if (skillReady.alpha > 1.0) {
						this.changeSkillAlpha = !this.changeSkillAlpha;
					}
					skillReady.alpha += 0.1;
				}
			} else {
				skillReady.visible = false;
				skillReady.alpha = 1;
			}
		});

		this.charRegionGraphics.addChild(skillOff);
		this.charRegionGraphics.addChild(skillReady);
	}
	private setupPotionBtn() {}

	private setupInfoBtn() {
		const potionGraphics = new Graphics();
		potionGraphics.buttonMode = true;
		potionGraphics.interactive = true;
		const potion = new Sprite(PIXI.Loader.shared.resources['../assets/potion_icon.png'].texture);
		const potionText = new Text(this._gameLogicService.POTION_PRICE.toString(), this.style);
		potionText.visible = false;

		// plot class potion
		// scale to fit container
		potion.y = Math.round((this.charRegionGraphics.width - potion.width) / 16) - 32;
		potion.x = Math.round((this.margin - potion.height) / 4) + 512;
		potion.scale.x = potion.scale.y = Math.min(64 / potion.width, 64 / potion.height);

		potionText.x = Math.round((this.charRegionGraphics.width - potionText.width) / 2) + 172;
		potionText.y = Math.round((this.margin - potionText.height) / 4) + 10;

		//Run number lerp animation effect
		this.app.ticker.add(() => {
			const valAux = this._gameLogicService.POTION_PRICE;
			let lerpValue: any = this.lerp(valAux, parseInt(potionText.text), 0.51);
			potionText.text = Math.round(lerpValue).toString();
		});

		//buy potion and recovery life
		//on hover, show information
		potionGraphics
			.on('pointerdown', () => {
				if (this.char.credits - this._gameLogicService.POTION_PRICE >= 0) {
					this.char.life += this._gameLogicService.POTION_HEALTH;
					this.char.credits -= this._gameLogicService.POTION_PRICE;
					if (this.char.life > this.char.totalLife) {
						this.char.life = this.char.totalLife;
					}
					this._gameLogicService.POTION_PRICE *= 2;
				}
			})
			.on('pointerover', () => {
				potionText.visible = true;
			})
			.on('pointerout', () => {
				potionText.visible = false;
			});

		this.charRegionGraphics.addChild(this.creditsText);
		potionGraphics.addChild(potion);
		potionGraphics.addChild(potionText);
		this.charRegionGraphics.addChildAt(potionGraphics, this.charRegionGraphics.children.length - 1);
	}

	public lerp(a1, a2, t) {
		return a1 * (1 - t) + a2 * t;
	}
}
