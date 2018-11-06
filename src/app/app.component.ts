import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Sprite, Application, TextStyle, Rectangle, Texture, Container, DisplayObject, Text } from 'pixi.js';
import { GameLogicService } from '../services/game-logic.service';
import { DebuggerService } from '../services/debugger.service';
import { Reel } from '../model/reel';
import { GUI } from '../model/gui-module/gui';
import { PayTable } from '../model/pay-module/pay-table';
import { Char } from '../model/char-module/char';
import { CharSelectionScreen } from '../model/char-module/char-gui/char-select-screen';
import { PayTableGUI } from '../model/pay-module/pay-table-gui/pay-table-gui';

declare var PIXI: any;

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit {
	@ViewChild('pixiContainer') pixiContainer;
	public debugValueSubscription: Subscription;

	public app: Application = new Application(800, 600, {
		backgroundColor: 0x0000
	});

	public reel: Reel;
	public gui: GUI;
	public payTable: PayTable;
	public char: Char;
	public charSelectionScreen: CharSelectionScreen;

	public appstyle = new TextStyle({
		fontFamily: 'Primitive',
		fontSize: 36,
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

	constructor(private _gameLogicService: GameLogicService, private _debugService: DebuggerService) {
		this.debugValueSubscription = this._debugService.debugConfigValue$.subscribe((value) => {
			if (value != undefined) {
				this._gameLogicService.debugConfig = value;
				if (!isNaN(value.credits) && this.char != undefined) {
					this.char.credits = value.credits;
				}
			}
		});
	}

	ngOnInit() {
		this.pixiContainer.nativeElement.appendChild(this.app.view);
		this.app.renderer.view.style.display = 'block';
		this.app.renderer.view.style.position = 'absolute';
		this.app.renderer.view.style.display = 'block';
		this.app.renderer.autoResize = true;

		PIXI.Loader.shared
			.add([
				'../assets/3xBAR.png',
				'../assets/BAR.png',
				'../assets/2xBAR.png',
				'../assets/7.png',
				'../assets/Cherry.png',
				'../assets/berserker.png',
				'../assets/berserker_background.png',
				'../assets/warrior.png',
				'../assets/warrior_background.png',
				'../assets/cleric.png',
				'../assets/cleric_background.png',
				'../assets/mage.png',
				'../assets/mage_background.png',
				'../assets/life_icon.png',
				'../assets/credit_icon.png',
				'../assets/button.png',
				'../assets/button-HOVER.png',
				'../assets/button-PUSH.png',
				'../assets/background_frame.png',
				'../assets/paytable_frame.png',
				'../assets/paytable_frame_highlight.png',
				'../assets/char_frame.png',
				'../assets/life_bar.png',
				'../assets/potion_icon.png',
				'../assets/skill_bar_full.png',
				'../assets/skill_bar_empty.png',
				'../assets/CherryIcon.png',
				'../assets/7Icon.png',
				'../assets/CherrySevenIcon.png',
				'../assets/X3BarIcon.png',
				'../assets/X2BarIcon.png',
				'../assets/BarIcon.png',
				'../assets/AnyBarIcon.png',
				'../assets/coin.png',
				'../assets/coin_reward.png',
				'../assets/xp_reward.png',
				'../assets/info.png',
				'../assets/info-HOVER.png',
				'../assets/info-PUSH.png',
				'../assets/protected_icon.png',
				'../assets/hit.png',
				'../assets/lose_msg.png'
			])
			.on('progress', this.loadProgressHandler)
			.load(this.loadCharSelect.bind(this));
	}

	public loadProgressHandler(loader, resource) {
		console.log(`loaded ${resource.url}. Loading is ${loader.progress}% complete. `);
	}

	public loadCharSelect() {
		this.reel = new Reel(this.app, this._gameLogicService);
		this.payTable = new PayTable(this.app, this._gameLogicService, this.reel);

		this.charSelectionScreen = new CharSelectionScreen(this.app, this);
		this.app.stage.addChild(this.charSelectionScreen.selectCharContainer);
	}

	public setup() {
		//after select, start game loop
		this.charSelectionScreen.selectCharContainer.visible = false;

		this.app.stage.addChild(this.reel.reelContainer);
		this.gui = new GUI(this.app, this.reel, this.char, this.payTable, this.appstyle, this._gameLogicService);
		// Set PayTable container
		const payTableGUI = new PayTableGUI(this.app, this.payTable, this._gameLogicService);

		this.app.ticker.add(() => {
			this._gameLogicService.gameLoop(this.app, this.reel, this.gui, this.payTable, this.char);
		});
	}
}
