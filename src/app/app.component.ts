import { ChangeDetectionStrategy, Component, AfterViewInit, OnDestroy, viewChild, ElementRef, NgZone, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEventPattern } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { Application } from 'pixi.js';
import { GameLogicService } from '../services/game-logic.service';
import { DebuggerService } from '../services/debugger.service';
import { GameOrchestratorService } from '../services/game-orchestrator.service';
import { Reel } from '../model/reel';
import { Char } from '../model/char-module/char';
import { AssetLoadProgress, preloadAssets } from '../rendering/assets';
import { DESIGN_HEIGHT, DESIGN_WIDTH, ViewportState, computeViewport, computeViewportInto, getRendererDpi } from '../rendering/viewport';
import { DebuggerComponent } from '../components/debug/debug.component';
import { createPixiApp } from '../services/pixi-bootstrapper';
import { BOOT } from '../services/game-config';

@Component({
	standalone: true,
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrl: './app.component.css',
	imports: [DebuggerComponent, DecimalPipe],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit, OnDestroy {
	readonly pixiContainer = viewChild.required<ElementRef<HTMLDivElement>>('pixiContainer');

	private readonly _gameLogicService = inject(GameLogicService);
	private readonly _debugService = inject(DebuggerService);
	private readonly _ngZone = inject(NgZone);
	private readonly _orchestrator = inject(GameOrchestratorService);

	constructor() {
		this._debugService.debugConfig$.pipe(
			takeUntilDestroyed()
		).subscribe({
			next: (value) => {
				if (value != null) {
					this._gameLogicService.debugConfig = value;
					if (!isNaN(value.credits) && this._orchestrator.char !== undefined) {
						this._orchestrator.char.setCredits(value.credits);
					}
				}
			},
			error: (err) => console.error('Debug config subscription error:', err)
		});
	}

	public app!: Application;
	public viewport: ViewportState = computeViewport(DESIGN_WIDTH, DESIGN_HEIGHT);
	private resizeSub?: { unsubscribe: () => void };

	showLoader = signal(true);
	loaderClosing = signal(false);
	loadingFailed = signal(false);
	bootProgress = signal(0);

	private loaderHideTimer?: number;

	public get reel(): Reel { return this._orchestrator.reel; }
	public get char(): Char { return this._orchestrator.char; }

	async ngAfterViewInit(): Promise<void> {
		await this._ngZone.runOutsideAngular(async () => {
			await this.waitForNextTick();

			try {
				this.setLoadingProgress(BOOT.PROGRESS_FONTS_LOADED);
				await document.fonts.load('bold 36px Primitive');

				this.setLoadingProgress(BOOT.PROGRESS_APP_CREATED);

				this.app = await createPixiApp({
					width: DESIGN_WIDTH,
					height: DESIGN_HEIGHT,
					background: 0x0000,
					resolution: getRendererDpi(),
					autoDensity: true
				});

				this.pixiContainer()!.nativeElement.appendChild(this.app.canvas);

				this.app.stage.addChild(this._orchestrator.sceneRoot);
				this.setupResizeHandling();
				this.resizeRendererToHost();

				this.setLoadingProgress(BOOT.PROGRESS_ASSETS_START);
				await preloadAssets((progress) => {
					this.updateAssetProgress(progress);
				});

				this.setLoadingProgress(BOOT.PROGRESS_ASSETS_DONE);
				this._orchestrator.setApp(this.app);
				this._orchestrator.loadCharSelect();
				this.completeLoading();
			} catch (error) {
				console.error('Failed to boot the game.', error);
				this.applyLoaderState(() => {
					this.loadingFailed.set(true);
					this.showLoader.set(true);
					this.loaderClosing.set(false);
					this.bootProgress.update(p => Math.max(p, BOOT.PROGRESS_ERROR));
				});
			}
		});
	}

	public reloadPage(): void {
		window.location.reload();
	}

	ngOnDestroy(): void {
		this.resizeSub?.unsubscribe();
		this._orchestrator.destroy();
		this.app.destroy();
	}

	private setupResizeHandling(): void {
		const resize$ = fromEventPattern<ResizeObserverEntry[]>(
			addHandler => {
				const obs = new ResizeObserver(addHandler);
				obs.observe(this.pixiContainer()!.nativeElement);
				return obs;
			},
			(addHandler, obs) => obs.disconnect()
		);

		this.resizeSub = resize$.pipe(
			auditTime(16)
		).subscribe(() => this.resizeRendererToHost());
	}

	private resizeRendererToHost = () => {
		const host = this.pixiContainer()!.nativeElement;
		const width = host.clientWidth || window.innerWidth || DESIGN_WIDTH;
		const height = host.clientHeight || window.innerHeight || DESIGN_HEIGHT;

		computeViewportInto(this.viewport, width, height);
		this.app.renderer.resolution = getRendererDpi();
		this.app.renderer.resize(this.viewport.actualWidth, this.viewport.actualHeight);

		this._orchestrator.sceneRoot.scale.set(this.viewport.scale);
		this._orchestrator.sceneRoot.position.set(this.viewport.offsetX, this.viewport.offsetY);
	};

	private updateAssetProgress(progress: AssetLoadProgress) {
		const overallProgress = BOOT.ASSET_PROGRESS_BASE + progress.pct * BOOT.ASSET_PROGRESS_RANGE;
		this.setLoadingProgress(overallProgress);
	}

	private completeLoading() {
		this.setLoadingProgress(BOOT.PROGRESS_COMPLETE);
		window.clearTimeout(this.loaderHideTimer);

		this.applyLoaderState(() => {
			this.loaderClosing.set(true);
		});
		
		this.loaderHideTimer = window.setTimeout(() => {
			this.applyLoaderState(() => {
				this.showLoader.set(false);
				this.loaderClosing.set(false);
			});
		}, BOOT.LOADER_FADEOUT_DELAY_MS);
	}

	private setLoadingProgress(progress: number) {
		this.applyLoaderState(() => {
			this.bootProgress.update(p => Math.max(p, Math.min(100, Math.round(progress))));
		});
	}

	private applyLoaderState(update: () => void) {
		this._ngZone.run(() => {
			update();
		});
	}

	private waitForNextTick(): Promise<void> {
		return new Promise(resolve => queueMicrotask(resolve));
	}
}
