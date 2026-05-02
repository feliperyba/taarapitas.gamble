import { ChangeDetectorRef, Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
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
import { AssetLoadProgress, preloadAssets } from '../rendering/assets';
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
	public showLoader = true;
	public loaderClosing = false;
	public loadingFailed = false;
	public bootProgress = 0;

	public appstyle = (() => {
		const g = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
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
	private loaderHideTimer?: number;

	constructor(
		private _gameLogicService: GameLogicService,
		private _debugService: DebuggerService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _ngZone: NgZone
	) {
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
		await this.waitForNextTick();

		try {
			this.setLoadingProgress(10);
			await document.fonts.load('bold 36px Primitive');

			this.setLoadingProgress(24);

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

			this.setLoadingProgress(32);
			await preloadAssets((progress) => {
				this.updateAssetProgress(progress);
			});

			this.setLoadingProgress(96);
			this.loadCharSelect();
			this.completeLoading();
		} catch (error) {
			console.error('Failed to boot the game.', error);
			this.applyLoaderState(() => {
				this.loadingFailed = true;
				this.showLoader = true;
				this.loaderClosing = false;
				this.bootProgress = Math.max(this.bootProgress, 18);
			});
		}
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
		window.clearTimeout(this.loaderHideTimer);
		this.debugValueSubscription.unsubscribe();
		this.app.destroy();
	}

	public reloadPage() {
		window.location.reload();
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

	private updateAssetProgress(progress: AssetLoadProgress) {
		const overallProgress = 32 + progress.pct * 0.6;
		this.setLoadingProgress(overallProgress);
	}

	private completeLoading() {
		this.setLoadingProgress(100);
		window.clearTimeout(this.loaderHideTimer);
		this.applyLoaderState(() => {
			this.loaderClosing = true;
		});
		this.loaderHideTimer = window.setTimeout(() => {
			this.applyLoaderState(() => {
				this.showLoader = false;
				this.loaderClosing = false;
			});
		}, 220);
	}

	private setLoadingProgress(progress: number) {
		this.applyLoaderState(() => {
			this.bootProgress = Math.max(this.bootProgress, Math.min(100, Math.round(progress)));
		});
	}

	private applyLoaderState(update: () => void) {
		this._ngZone.run(() => {
			update();
			this._changeDetectorRef.detectChanges();
		});
	}

	private waitForNextTick(): Promise<void> {
		return new Promise((resolve) => {
			window.setTimeout(() => resolve(), 0);
		});
	}
}
