import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Application, Container } from 'pixi.js';
import { GameLogicService } from './game-logic.service';
import { GameOverOverlay } from './game-over-overlay';
import { Reel } from '../model/reel';
import { GUI } from '../model/gui-module/gui';
import { PayTable } from '../model/pay-module/pay-table';
import { Char } from '../model/char-module/char';
import { CharSelectionScreen } from '../model/char-module/char-gui/char-select-screen';
import { PayTableGUI } from '../model/pay-module/pay-table-gui/pay-table-gui';
import { createGradientTextStyle } from '../model/pixi-helpers';
import { CHARACTER_STRATEGIES } from './character-strategies.token';
import type { CharSelectHandler } from '../model/char-select-handler';

@Injectable({ providedIn: 'root' })
export class GameOrchestratorService implements CharSelectHandler {
	private readonly gameLogicService = inject(GameLogicService);
	private readonly charClasses = inject(CHARACTER_STRATEGIES);

	public readonly sceneRoot = new Container();
	public reel!: Reel;
	public gui!: GUI;
	public payTable!: PayTable;
	public payTableGUI!: PayTableGUI;
	public char!: Char;
	public charSelectionScreen: CharSelectionScreen | null = null;

	private app!: Application;
	private readonly gameOverOverlay = new GameOverOverlay();
	private readonly appStyle = createGradientTextStyle({
		fillStops: ['#ffffff', '#a99047'],
		fontSize: 36,
		strokeWidth: 2,
		dropShadowColor: '#f2ebb5',
		wordWrap: true,
		wordWrapWidth: 400
	});

	constructor() {
		this.gameOverOverlay.onRestart(() => window.location.reload());

		this.gameLogicService.gameOver$.pipe(
			takeUntilDestroyed()
		).subscribe(message => {
			this.gameOverOverlay.setup(this.sceneRoot);
			this.gameOverOverlay.showDeath(message);
		});
	}

	public setApp(app: Application): void {
		this.app = app;
	}

	public loadCharSelect(): void {
		this.reel = new Reel(
			this.app,
			() => { this.gameLogicService.handleResults(); },
			() => this.gameLogicService.debugConfig,
			() => { this.gameLogicService.handleStart(); }
		);
		this.payTable = new PayTable(this.app, this.gameLogicService, this.reel);
		this.charSelectionScreen = new CharSelectionScreen(this.app, this, this.charClasses);
		this.sceneRoot.addChild(this.charSelectionScreen.selectCharContainer);
	}

	public setup(): void {
		this.charSelectionScreen?.destroy();
		this.charSelectionScreen = null;

		this.gui = new GUI(this.app, this.sceneRoot, this.reel, this.char, this.payTable, this.appStyle, this.gameLogicService);
		this.payTableGUI = new PayTableGUI(this.app, this.gui.leftRailLayer, this.payTable, this.gameLogicService);
		this.gui.payTableGUI = this.payTableGUI;

		this.gameLogicService.setGameContext(this.sceneRoot, this.reel, this.payTable, this.char);
	}

	public destroy(): void {
		this.reel?.destroy();
		this.gui?.destroy();
		this.payTableGUI?.destroy();
		this.payTable?.destroy();
		this.charSelectionScreen?.destroy();
		this.gameOverOverlay.destroy();
		this.gameLogicService.destroy();
	}
}
