import { Application, Container, TextStyle, Graphics, Text, Texture } from 'pixi.js';
import { Subscription } from 'rxjs';
import { GameLogicService } from '../../services/game-logic.service';
import { GameStates } from '../game-states';
import { Reel } from '../reel';
import { Char } from '../char-module/char';
import { CharGUI } from '../char-module/char-gui/char-gui';
import { Button } from './button';
import { PayTable } from '../pay-module/pay-table';
import { PayTableGUI } from '../pay-module/pay-table-gui/pay-table-gui';
import { getTexture } from '../../rendering/assets';
import { SCENE_LAYOUT } from '../../rendering/viewport';
import { DEFAULT_TEXT_STYLE, ACTION_LABEL_STYLE, ACTION_DETAIL_STYLE, COLOR_WHITE, COLOR_BLACK } from '../pixi-styles';
import { createText } from '../pixi-helpers';
import { PANEL } from '../constants/layout';
import { SKILL_CHARGE_MAX } from '../constants/skill';
import { HUD_BEAM, RAIL_PANEL, REEL_ALTAR, BOARD_BACKDROP, STATUS_PANEL, BUTTON_SHADOW } from '../constants/gui-style';
import { drawLayeredPanel } from './layout-helpers';
import { clearWinHighlight } from '../pay-module/win-highlighter';

export class GUI {
	public readonly uiRoot = new Container();
	public readonly backdropLayer = new Container();
	public readonly leftRailLayer = new Container();
	public readonly reelLayer = new Container();
	public readonly rightReliquaryLayer = new Container();
	public readonly topHudLayer = new Container();
	public readonly actionLayer = new Container();
	public readonly heroAltarLayer = new Container();
	public readonly modalLayer = new Container();

	private reelMask?: Graphics;
	private actionStateText = new Text({ text: '' });
	private actionDetailText = new Text({ text: '' });
	private prevActionLabel = '';
	private prevActionDetail = '';
	private charGui!: CharGUI;
	public payTableGUI!: PayTableGUI;
	private playBtn!: Button;
	private stateSub!: Subscription;

	private readonly btnTexture: Texture;
	private readonly btnOverTexture: Texture;
	private readonly btnPushTexture: Texture;

	constructor(
		public readonly app: Application,
		public readonly sceneRoot: Container,
		public readonly reel: Reel,
		public readonly char: Char,
		public readonly payTable: PayTable,
		public readonly style: TextStyle,
		private readonly gameLogicService: GameLogicService
	) {
		this.btnTexture = getTexture('assets/button.png');
		this.btnOverTexture = getTexture('assets/button-HOVER.png');
		this.btnPushTexture = getTexture('assets/button-PUSH.png');

		this.setupGUI();
	}

	public setupGUI(): void {
		this.uiRoot.addChild(this.backdropLayer);
		this.uiRoot.addChild(this.leftRailLayer);
		this.uiRoot.addChild(this.reelLayer);
		this.uiRoot.addChild(this.rightReliquaryLayer);
		this.uiRoot.addChild(this.topHudLayer);
		this.uiRoot.addChild(this.actionLayer);
		this.uiRoot.addChild(this.heroAltarLayer);
		this.uiRoot.addChild(this.modalLayer);
		this.sceneRoot.addChild(this.uiRoot);

		this.leftRailLayer.addChild(this.createRailPanel(SCENE_LAYOUT.game.leftRail, 0.96));
		this.reelLayer.addChild(this.createReelAltarPanel());
		this.rightReliquaryLayer.addChild(this.createRailPanel(SCENE_LAYOUT.game.rightReliquary, 0.96));
		this.topHudLayer.addChild(this.createTopHudBeam());

		this.configureReels();
		this.reelLayer.addChild(this.reel.reelContainer);
		this.reelLayer.addChild(this.createBoardOverlay());

		const charGui = new CharGUI(this.app, this.char, this.gameLogicService, this.style, this.reel);
		this.charGui = charGui;
		const charGuiContainer = charGui.setup();
		this.heroAltarLayer.addChild(charGuiContainer);

		this.playBtn = new Button(
			SCENE_LAYOUT.game.fightButton.height,
			SCENE_LAYOUT.game.fightButton.width,
			this.btnTexture,
			this.btnOverTexture,
			this.btnPushTexture,
			'Fight',
			DEFAULT_TEXT_STYLE
		);

		this.playBtn.btnContainer.x = SCENE_LAYOUT.game.fightButton.x;
		this.playBtn.btnContainer.y = SCENE_LAYOUT.game.fightButton.y;
		this.playBtn.btnContainer.on('pointerdown', () => {
			if (this.gameLogicService.state === GameStates.WAITING) {
				this.gameLogicService.handleStart();
			}

			if (this.gameLogicService.state === GameStates.WIN) {
				const winPos = this.reel.reelWinSlotPos;
				if (winPos !== undefined) {
					clearWinHighlight(this.reel, winPos);
				}
				this.gameLogicService.handleStart();
			}
		});

		this.actionLayer.addChild(this.createStatusPanel());
		this.actionLayer.addChild(this.createButtonShadow(this.playBtn.btnContainer.x, this.playBtn.btnContainer.y));
		this.actionLayer.addChild(this.playBtn.btnContainer);

		this.stateSub = this.gameLogicService.stateMachine.state$.subscribe(state => {
			this.playBtn.setDisabled(!(state === GameStates.WAITING || state === GameStates.WIN));
			this.updateActionFeedback(state);
		});
	}

	public destroy(): void {
		this.stateSub?.unsubscribe();
		this.playBtn?.destroy();
		this.charGui?.destroy();
		this.uiRoot.destroy({ children: true });
	}

	private createTopHudBeam(): Container {
		const beam = new Container();
		const hud = SCENE_LAYOUT.game.topHud;

		const panel = drawLayeredPanel([
			{ x: hud.x, y: hud.y + HUD_BEAM.OUTER.Y_OFFSET, width: hud.width, height: hud.height - HUD_BEAM.OUTER.Y_OFFSET, radius: HUD_BEAM.OUTER.RADIUS, fillColor: HUD_BEAM.OUTER.FILL, fillAlpha: HUD_BEAM.OUTER.ALPHA },
			{ x: hud.x + HUD_BEAM.INNER.INSET, y: hud.y + HUD_BEAM.OUTER.Y_OFFSET + HUD_BEAM.INNER.INSET, width: hud.width - HUD_BEAM.INNER.INSET * 2, height: hud.height - HUD_BEAM.INNER.BOTTOM_INSET, radius: HUD_BEAM.INNER.RADIUS, fillColor: PANEL.INNER_BG, fillAlpha: HUD_BEAM.INNER.FILL_ALPHA, strokeColor: HUD_BEAM.INNER.STROKE, strokeAlpha: HUD_BEAM.INNER.STROKE_ALPHA, strokeWidth: HUD_BEAM.INNER.STROKE_WIDTH },
		]);

		const trim = drawLayeredPanel([
			{ x: hud.x + HUD_BEAM.TOP_TRIM.X_INSET, y: hud.y + HUD_BEAM.TOP_TRIM.Y_INSET, width: hud.width - HUD_BEAM.TOP_TRIM.WIDTH_INSET, height: HUD_BEAM.TOP_TRIM.HEIGHT, radius: HUD_BEAM.TOP_TRIM.RADIUS, fillColor: HUD_BEAM.TOP_TRIM.FILL, fillAlpha: HUD_BEAM.TOP_TRIM.ALPHA },
			{ x: hud.x + HUD_BEAM.BOTTOM_TRIM.X_INSET, y: hud.y + hud.bottom - HUD_BEAM.BOTTOM_TRIM.BOTTOM_INSET, width: hud.width - HUD_BEAM.BOTTOM_TRIM.WIDTH_INSET, height: HUD_BEAM.BOTTOM_TRIM.HEIGHT, radius: HUD_BEAM.BOTTOM_TRIM.RADIUS, fillColor: COLOR_BLACK, fillAlpha: HUD_BEAM.BOTTOM_TRIM.ALPHA },
		]);

		beam.addChild(panel);
		beam.addChild(trim);
		return beam;
	}

	private createRailPanel(rect: { x: number; y: number; width: number; height: number }, alpha: number): Container {
		const container = new Container();
		const panel = drawLayeredPanel([
			{ x: rect.x + RAIL_PANEL.OUTER.X_INSET, y: rect.y + RAIL_PANEL.OUTER.Y_INSET, width: rect.width - RAIL_PANEL.OUTER.WIDTH_INSET, height: rect.height - RAIL_PANEL.OUTER.HEIGHT_INSET, radius: RAIL_PANEL.OUTER.RADIUS, fillColor: COLOR_BLACK, fillAlpha: RAIL_PANEL.OUTER.ALPHA },
			{ x: rect.x, y: rect.y, width: rect.width, height: rect.height, radius: RAIL_PANEL.MID.RADIUS, fillColor: RAIL_PANEL.MID.FILL, fillAlpha: alpha, strokeColor: RAIL_PANEL.MID.STROKE, strokeAlpha: RAIL_PANEL.MID.STROKE_ALPHA, strokeWidth: RAIL_PANEL.MID.STROKE_WIDTH },
			{ x: rect.x + RAIL_PANEL.INNER.INSET, y: rect.y + RAIL_PANEL.INNER.INSET, width: rect.width - RAIL_PANEL.INNER.INSET * 2, height: rect.height - RAIL_PANEL.INNER.INSET * 2, radius: RAIL_PANEL.INNER.RADIUS, fillColor: PANEL.INNER_BG, fillAlpha: RAIL_PANEL.INNER.FILL_ALPHA, strokeColor: RAIL_PANEL.INNER.STROKE, strokeAlpha: RAIL_PANEL.INNER.STROKE_ALPHA, strokeWidth: RAIL_PANEL.INNER.STROKE_WIDTH },
		]);
		container.addChild(panel);
		return container;
	}

	private createReelAltarPanel(): Container {
		const container = new Container();
		const altar = SCENE_LAYOUT.game.reelAltar;
		const viewport = SCENE_LAYOUT.game.reelViewport;

		const panel = drawLayeredPanel([
			{ x: altar.x + REEL_ALTAR.SHADOW.X_OFFSET, y: altar.y + REEL_ALTAR.SHADOW.Y_OFFSET, width: altar.width - REEL_ALTAR.SHADOW.WIDTH_OFFSET, height: altar.height - REEL_ALTAR.SHADOW.HEIGHT_OFFSET, radius: REEL_ALTAR.SHADOW.RADIUS, fillColor: COLOR_BLACK, fillAlpha: REEL_ALTAR.SHADOW.ALPHA },
			{ x: altar.x + REEL_ALTAR.OUTER.X_OFFSET, y: altar.y + REEL_ALTAR.OUTER.Y_OFFSET, width: altar.width - REEL_ALTAR.OUTER.WIDTH_OFFSET, height: altar.height - REEL_ALTAR.OUTER.HEIGHT_OFFSET, radius: REEL_ALTAR.OUTER.RADIUS, fillColor: REEL_ALTAR.OUTER.FILL, fillAlpha: REEL_ALTAR.OUTER.ALPHA, strokeColor: REEL_ALTAR.OUTER.STROKE, strokeAlpha: REEL_ALTAR.OUTER.STROKE_ALPHA, strokeWidth: REEL_ALTAR.OUTER.STROKE_WIDTH },
			{ x: altar.x + REEL_ALTAR.INNER.X_OFFSET, y: altar.y + REEL_ALTAR.INNER.Y_OFFSET, width: altar.width - REEL_ALTAR.INNER.WIDTH_OFFSET, height: altar.height - REEL_ALTAR.INNER.HEIGHT_OFFSET, radius: REEL_ALTAR.INNER.RADIUS, fillColor: PANEL.ALTAR_INNER_BG, fillAlpha: REEL_ALTAR.INNER.ALPHA, strokeColor: REEL_ALTAR.INNER.STROKE, strokeAlpha: REEL_ALTAR.INNER.STROKE_ALPHA, strokeWidth: REEL_ALTAR.INNER.STROKE_WIDTH },
			{ x: viewport.x - REEL_ALTAR.VIEWPORT_PADDING.OUTER, y: viewport.y - REEL_ALTAR.VIEWPORT_PADDING.OUTER, width: viewport.width + REEL_ALTAR.VIEWPORT_PADDING.OUTER * 2, height: viewport.height + REEL_ALTAR.VIEWPORT_PADDING.OUTER * 2, radius: REEL_ALTAR.VIEWPORT_PADDING.RADIUS, fillColor: REEL_ALTAR.VIEWPORT_PADDING.FILL, fillAlpha: REEL_ALTAR.VIEWPORT_PADDING.ALPHA },
			{ x: viewport.x - REEL_ALTAR.VIEWPORT_PADDING.INNER, y: viewport.y - REEL_ALTAR.VIEWPORT_PADDING.INNER, width: viewport.width + REEL_ALTAR.VIEWPORT_PADDING.INNER * 2, height: viewport.height + REEL_ALTAR.VIEWPORT_PADDING.INNER * 2, radius: REEL_ALTAR.VIEWPORT_FRAME.RADIUS, strokeColor: REEL_ALTAR.VIEWPORT_FRAME.STROKE, strokeAlpha: REEL_ALTAR.VIEWPORT_FRAME.STROKE_ALPHA, strokeWidth: REEL_ALTAR.VIEWPORT_FRAME.STROKE_WIDTH },
		]);

		container.addChild(panel);
		container.addChild(this.createBoardBackdrop());
		return container;
	}

	private getReelBoardSize(): { width: number; height: number } {
		return {
			width: this.reel.REEL_WIDTH * this.reel.REEL_COUNT * SCENE_LAYOUT.game.reelViewport.reelScale,
			height: this.reel.SYMBOL_SIZE * this.reel.REEL_COUNT * SCENE_LAYOUT.game.reelViewport.reelScale
		};
	}

	private createBoardBackdrop(): Graphics {
		const reelViewport = SCENE_LAYOUT.game.reelViewport;
		const { width, height } = this.getReelBoardSize();
		const frameInset = reelViewport.frameInset;
		const boardX = reelViewport.x - frameInset;
		const boardY = reelViewport.y - frameInset;
		const boardWidth = width + frameInset * 2;
		const boardHeight = height + frameInset * 2;

		return drawLayeredPanel([
			{ x: boardX - BOARD_BACKDROP.SHADOW.INSET, y: boardY - BOARD_BACKDROP.SHADOW.Y_INSET, width: boardWidth + BOARD_BACKDROP.SHADOW.INSET * 2, height: boardHeight + BOARD_BACKDROP.SHADOW.Y_INSET * 2, radius: BOARD_BACKDROP.SHADOW.RADIUS, fillColor: BOARD_BACKDROP.SHADOW.FILL, fillAlpha: BOARD_BACKDROP.SHADOW.ALPHA },
			{ x: boardX, y: boardY, width: boardWidth, height: boardHeight, radius: BOARD_BACKDROP.OUTER.RADIUS, fillColor: PANEL.INNER_BG, fillAlpha: BOARD_BACKDROP.OUTER.ALPHA, strokeColor: BOARD_BACKDROP.OUTER.STROKE, strokeAlpha: BOARD_BACKDROP.OUTER.STROKE_ALPHA, strokeWidth: BOARD_BACKDROP.OUTER.STROKE_WIDTH },
			{ x: boardX + BOARD_BACKDROP.MID.INSET, y: boardY + BOARD_BACKDROP.MID.INSET, width: boardWidth - BOARD_BACKDROP.MID.INSET * 2, height: boardHeight - BOARD_BACKDROP.MID.INSET * 2, radius: BOARD_BACKDROP.MID.RADIUS, strokeColor: BOARD_BACKDROP.MID.STROKE, strokeAlpha: BOARD_BACKDROP.MID.STROKE_ALPHA, strokeWidth: BOARD_BACKDROP.MID.STROKE_WIDTH },
			{ x: boardX + BOARD_BACKDROP.INNER.INSET, y: boardY + BOARD_BACKDROP.INNER.INSET, width: boardWidth - BOARD_BACKDROP.INNER.INSET * 2, height: boardHeight - BOARD_BACKDROP.INNER.INSET * 2, radius: BOARD_BACKDROP.INNER.RADIUS, fillColor: PANEL.ALTAR_INNER_BG, fillAlpha: BOARD_BACKDROP.INNER.ALPHA },
			{ x: boardX + BOARD_BACKDROP.TOP_TRIM.X_INSET, y: boardY + BOARD_BACKDROP.TOP_TRIM.Y_INSET, width: boardWidth - BOARD_BACKDROP.TOP_TRIM.WIDTH_INSET, height: BOARD_BACKDROP.TOP_TRIM.HEIGHT, radius: BOARD_BACKDROP.TOP_TRIM.RADIUS, fillColor: PANEL.ACCENT_GOLD, fillAlpha: BOARD_BACKDROP.TOP_TRIM.ALPHA },
		]);
	}

	private configureReels(): void {
		this.reel.reelContainer.x = SCENE_LAYOUT.game.reelViewport.x;
		this.reel.reelContainer.y = SCENE_LAYOUT.game.reelViewport.y;
		this.reel.reelContainer.scale.set(SCENE_LAYOUT.game.reelViewport.reelScale);

		this.reelMask?.destroy();
		this.reelMask = new Graphics();
		this.reelMask
			.roundRect(
				0,
				0,
				this.reel.REEL_WIDTH * this.reel.REEL_COUNT,
				this.reel.SYMBOL_SIZE * this.reel.REEL_COUNT,
				SCENE_LAYOUT.game.reelViewport.maskRadius
			)
			.fill({ color: COLOR_WHITE, alpha: 1 });
		this.reel.reelContainer.addChild(this.reelMask);
		this.reel.reelContainer.mask = this.reelMask;
	}

	private createBoardOverlay(): Container {
		const overlay = new Container();
		const grid = new Graphics();
		const gloss = new Graphics();
		const localWidth = this.reel.REEL_WIDTH * this.reel.REEL_COUNT;
		const localHeight = this.reel.SYMBOL_SIZE * this.reel.REEL_COUNT;

		overlay.x = SCENE_LAYOUT.game.reelViewport.x;
		overlay.y = SCENE_LAYOUT.game.reelViewport.y;
		overlay.scale.set(SCENE_LAYOUT.game.reelViewport.reelScale);

		grid.rect(0, 0, localWidth, localHeight).stroke({ color: PANEL.GRID_BORDER_COLOR, alpha: 0.82, width: 6 });

		for (let column = 1; column < this.reel.REEL_COUNT; column++) {
			grid.moveTo(column * this.reel.REEL_WIDTH, 0).lineTo(column * this.reel.REEL_WIDTH, localHeight).stroke({ color: PANEL.GRID_LINE_COLOR, alpha: 0.92, width: 6 });
		}

		for (let row = 1; row < this.reel.REEL_COUNT; row++) {
			grid.moveTo(0, row * this.reel.SYMBOL_SIZE).lineTo(localWidth, row * this.reel.SYMBOL_SIZE).stroke({ color: PANEL.GRID_LINE_COLOR, alpha: 0.92, width: 6 });
		}

		grid.rect(0, 0, localWidth, PANEL.GRID_VIGNETTE_HEIGHT).fill({ color: COLOR_BLACK, alpha: 0.22 });
		grid.rect(0, localHeight - PANEL.GRID_VIGNETTE_HEIGHT, localWidth, PANEL.GRID_VIGNETTE_HEIGHT).fill({ color: COLOR_BLACK, alpha: 0.28 });
		gloss.roundRect(8, 8, localWidth - 16, 18, 10).fill({ color: 0xf7ddb1, alpha: 0.06 });

		overlay.addChild(grid);
		overlay.addChild(gloss);
		return overlay;
	}

	private createStatusPanel(): Container {
		const region = SCENE_LAYOUT.game.statusWell;
		const panel = new Container();

		const background = drawLayeredPanel([
			{ x: region.x, y: region.y, width: region.width, height: region.height, radius: STATUS_PANEL.OUTER.RADIUS, fillColor: STATUS_PANEL.OUTER.FILL, fillAlpha: STATUS_PANEL.OUTER.ALPHA, strokeColor: STATUS_PANEL.OUTER.STROKE, strokeAlpha: STATUS_PANEL.OUTER.STROKE_ALPHA, strokeWidth: STATUS_PANEL.OUTER.STROKE_WIDTH },
			{ x: region.x + STATUS_PANEL.INNER.INSET, y: region.y + STATUS_PANEL.INNER.INSET, width: region.width - STATUS_PANEL.INNER.INSET * 2, height: region.height - STATUS_PANEL.INNER.INSET * 2, radius: STATUS_PANEL.INNER.RADIUS, fillColor: STATUS_PANEL.INNER.FILL, fillAlpha: STATUS_PANEL.INNER.ALPHA, strokeColor: STATUS_PANEL.INNER.STROKE, strokeAlpha: STATUS_PANEL.INNER.STROKE_ALPHA, strokeWidth: STATUS_PANEL.INNER.STROKE_WIDTH },
			{ x: region.x + STATUS_PANEL.TRIM.INSET, y: region.y + STATUS_PANEL.TRIM.INSET, width: region.width - STATUS_PANEL.TRIM.INSET * 2, height: STATUS_PANEL.TRIM.HEIGHT, radius: STATUS_PANEL.TRIM.RADIUS, fillColor: PANEL.ACCENT_GOLD, fillAlpha: STATUS_PANEL.TRIM.ALPHA },
		]);

		this.actionStateText = createText({ text: 'Ready', style: ACTION_LABEL_STYLE, anchorX: 0.5, x: region.centerX, y: region.y + PANEL.ACTION_LABEL_Y_OFFSET });
		this.actionDetailText = createText({ text: 'The altar waits for your next fight.', style: ACTION_DETAIL_STYLE, anchorX: 0.5, x: region.centerX, y: region.y + PANEL.ACTION_DETAIL_Y_OFFSET });

		panel.addChild(background);
		panel.addChild(this.actionStateText);
		panel.addChild(this.actionDetailText);
		return panel;
	}

	private static readonly STATE_LABELS: Partial<Record<GameStates, string>> = {
		[GameStates.START]: 'Rolling',
		[GameStates.ROLL]: 'Rolling',
		[GameStates.RESULTS]: 'Rolling',
		[GameStates.WIN]: 'Victory',
		[GameStates.LOSE]: 'Defeated',
	};

	private static readonly STATE_DETAILS: Partial<Record<GameStates, string>> = {
		[GameStates.START]: 'The ritual is resolving across the parchment reels.',
		[GameStates.ROLL]: 'The ritual is resolving across the parchment reels.',
		[GameStates.RESULTS]: 'The ritual is resolving across the parchment reels.',
		[GameStates.LOSE]: 'Your champion has fallen and the altar grows silent.',
	};

	private resolveWaitingDetail(): string {
		if (this.char.credits() <= 0) {
			return 'You have no gold coins to fight.';
		}
		if (this.char.specialBar() >= SKILL_CHARGE_MAX) {
			return 'Skill is ready. Fight or unleash your class power.';
		}
		return 'Fight spends 1 gold unless a skill is primed.';
	}

	private updateActionFeedback(state: GameStates): void {
		const label = GUI.STATE_LABELS[state] ?? 'Ready';
		let detail: string;

		if (state === GameStates.WIN) {
			detail = this.payTableGUI?.result != null
				? `Won ${this.payTableGUI.result} gold. Press Fight to continue.`
				: 'A winning line struck true.';
		} else {
			detail = GUI.STATE_DETAILS[state] ?? this.resolveWaitingDetail();
		}

		if (label !== this.prevActionLabel) {
			this.prevActionLabel = label;
			this.actionStateText.text = label;
		}
		if (detail !== this.prevActionDetail) {
			this.prevActionDetail = detail;
			this.actionDetailText.text = detail;
		}
	}

	private createButtonShadow(x: number, y: number): Graphics {
		const shadow = new Graphics();
		shadow
			.roundRect(x + BUTTON_SHADOW.X_OFFSET, y + BUTTON_SHADOW.Y_OFFSET, SCENE_LAYOUT.game.fightButton.width, SCENE_LAYOUT.game.fightButton.height, BUTTON_SHADOW.RADIUS)
			.fill({ color: COLOR_BLACK, alpha: BUTTON_SHADOW.ALPHA });
		return shadow;
	}
}
