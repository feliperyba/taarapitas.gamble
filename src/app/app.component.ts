import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Application, Container, FillGradient, TextStyle } from 'pixi.js';
import { GameLogicService } from '../services/game-logic.service';
import { DebuggerService } from '../services/debugger.service';
import { Reel } from '../model/reel';
import { GUI } from '../model/gui-module/gui';
import { PayTable } from '../model/pay-module/pay-table';
import { Char } from '../model/char-module/char';
import { CharSelectionScreen } from '../model/char-module/char-gui/char-select-screen';
import { PayTableGUI } from '../model/pay-module/pay-table-gui/pay-table-gui';
import { preloadAssets } from '../rendering/assets';
import { DESIGN_HEIGHT, DESIGN_WIDTH, ViewportState, computeViewport, getRendererDpi } from '../rendering/viewport';

@Component({
	standalone: false,
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: [ './app.component.css' ]
})
export class AppComponent implements AfterViewInit, OnDestroy {
	@ViewChild('pixiContainer') pixiContainer!: ElementRef<HTMLDivElement>;
	public debugValueSubscription: Subscription;

	public app: Application = new Application();
	public sceneRoot: Container = new Container();
	public viewport: ViewportState = computeViewport(DESIGN_WIDTH, DESIGN_HEIGHT);
	private resizeObserver?: ResizeObserver;

	public reel: Reel;
	public gui: GUI;
	public payTable: PayTable;
	public char: Char;
	public charSelectionScreen: CharSelectionScreen;

	public appstyle = (() => {
		const g = new FillGradient(0, 0, 0, 1);
		g.addColorStop(0, '#ffffff').addColorStop(1, '#a99047');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 36,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: g,
			stroke: { color: '#000', width: 2 },
			dropShadow: {
				color: '#f2ebb5',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			wordWrap: true,
			wordWrapWidth: 400
		});
	})();

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

	async ngAfterViewInit() {
		await document.fonts.load('bold 36px Primitive');

		await this.app.init({
			width: DESIGN_WIDTH,
			height: DESIGN_HEIGHT,
			background: 0x0000,
			resolution: getRendererDpi(),
			autoDensity: true
		});

		this.pixiContainer.nativeElement.appendChild(this.app.canvas);
		this.app.canvas.style.display = 'block';
		this.app.canvas.style.position = 'absolute';
		this.app.canvas.style.inset = '0';

		this.app.stage.addChild(this.sceneRoot);
		this.setupResizeHandling();
		this.resizeRendererToHost();

		await preloadAssets((pct) => {
			console.log(`Loading assets... ${pct}% complete.`);
		});

		this.loadCharSelect();
	}

	public loadCharSelect() {
		this.reel = new Reel(this.app, this._gameLogicService);
		this.payTable = new PayTable(this.app, this._gameLogicService, this.reel);

		this.charSelectionScreen = new CharSelectionScreen(this.app, this);
		this.sceneRoot.addChild(this.charSelectionScreen.selectCharContainer);
	}

	public setup() {
		this.charSelectionScreen.selectCharContainer.visible = false;

		this.gui = new GUI(this.app, this.sceneRoot, this.reel, this.char, this.payTable, this.appstyle, this._gameLogicService);
		new PayTableGUI(this.app, this.gui.leftRailLayer, this.payTable, this._gameLogicService);

		this.app.ticker.add(() => {
			this._gameLogicService.gameLoop(this.app, this.sceneRoot, this.reel, this.gui, this.payTable, this.char);
		});
	}

	ngOnDestroy() {
		this.resizeObserver?.disconnect();
		window.removeEventListener('resize', this.resizeRendererToHost);
		this.debugValueSubscription.unsubscribe();
		this.app.destroy();
	}

	private setupResizeHandling() {
		this.resizeObserver = new ResizeObserver(() => {
			this.resizeRendererToHost();
		});
		this.resizeObserver.observe(this.pixiContainer.nativeElement);
		window.addEventListener('resize', this.resizeRendererToHost);
	}

	private resizeRendererToHost = () => {
		const host = this.pixiContainer.nativeElement;
		const width = host.clientWidth || window.innerWidth || DESIGN_WIDTH;
		const height = host.clientHeight || window.innerHeight || DESIGN_HEIGHT;

		this.viewport = computeViewport(width, height);
		this.app.renderer.resolution = getRendererDpi();
		this.app.renderer.resize(this.viewport.actualWidth, this.viewport.actualHeight);

		this.sceneRoot.scale.set(this.viewport.scale);
		this.sceneRoot.position.set(this.viewport.offsetX, this.viewport.offsetY);
	};
}
