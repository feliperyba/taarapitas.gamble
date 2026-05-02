import { Application, Container, TextStyle, Graphics, Text, Texture } from 'pixi.js';
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
import { MASK_ALPHA_INVISIBLE } from '../constants/colors';
import { PANEL } from '../constants/layout';
import { SKILL_CHARGE_MAX } from '../constants/skill';
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
	private lastActionLabel = '';
	private lastActionDetail = '';
	private charGui!: CharGUI;
	public payTableGUI!: PayTableGUI;
	private tickerFn: (() => void) | null = null;

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
		public readonly _gameLogicService: GameLogicService
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

		const charGui = new CharGUI(this.app, this.char, this._gameLogicService, this.style, this.reel);
		this.charGui = charGui;
		const charGuiContainer = charGui.setup();
		this.heroAltarLayer.addChild(charGuiContainer);

		const playBtn = new Button(
			SCENE_LAYOUT.game.fightButton.height,
			SCENE_LAYOUT.game.fightButton.width,
			this.btnTexture,
			this.btnOverTexture,
			this.btnPushTexture,
			'Fight',
			DEFAULT_TEXT_STYLE
		);

		playBtn.btnContainer.x = SCENE_LAYOUT.game.fightButton.x;
		playBtn.btnContainer.y = SCENE_LAYOUT.game.fightButton.y;
		playBtn.btnContainer.on('pointerdown', () => {
			if (this._gameLogicService.state === GameStates.WAITING) {
				this._gameLogicService.state = GameStates.START;
			}

			if (this._gameLogicService.state === GameStates.WIN) {
				const winPos = this.reel.reelWinSlotPos;
				if (winPos !== undefined) {
					clearWinHighlight(this.reel, winPos);
				}
				this._gameLogicService.state = GameStates.START;
			}
		});

		this.actionLayer.addChild(this.createStatusPanel());
		this.actionLayer.addChild(this.createButtonShadow(playBtn.btnContainer.x, playBtn.btnContainer.y));
		this.actionLayer.addChild(playBtn.btnContainer);

		this.tickerFn = () => {
			playBtn.setDisabled(!(this._gameLogicService.state === GameStates.WAITING || this._gameLogicService.state === GameStates.WIN));
			this.updateActionFeedback();
		};
		this.app.ticker.add(this.tickerFn);
	}

	public destroy(): void {
		if (this.tickerFn) {
			this.app.ticker.remove(this.tickerFn);
			this.tickerFn = null;
		}
		this.charGui?.destroy();
		this.uiRoot.destroy({ children: true });
	}

	private createTopHudBeam(): Container {
		const beam = new Container();
		const hud = SCENE_LAYOUT.game.topHud;

		const panel = drawLayeredPanel([
			{ x: hud.x, y: hud.y + 8, width: hud.width, height: hud.height - 8, radius: 28, fillColor: 0x120706, fillAlpha: 0.84 },
			{ x: hud.x + 10, y: hud.y + 18, width: hud.width - 20, height: hud.height - 30, radius: 22, fillColor: PANEL.INNER_BG, fillAlpha: 0.8, strokeColor: 0xa06f37, strokeAlpha: 0.26, strokeWidth: 3 },
		]);

		const trim = drawLayeredPanel([
			{ x: hud.x + 18, y: hud.y + 24, width: hud.width - 36, height: 22, radius: 12, fillColor: 0xf7d7a5, fillAlpha: 0.08 },
			{ x: hud.x + 22, y: hud.y + hud.bottom - 36, width: hud.width - 44, height: 10, radius: 8, fillColor: COLOR_BLACK, fillAlpha: 0.24 },
		]);

		beam.addChild(panel);
		beam.addChild(trim);
		return beam;
	}

	private createRailPanel(rect: { x: number; y: number; width: number; height: number }, alpha: number): Container {
		const container = new Container();
		const panel = drawLayeredPanel([
			{ x: rect.x + 14, y: rect.y + 18, width: rect.width - 14, height: rect.height - 12, radius: 34, fillColor: COLOR_BLACK, fillAlpha: 0.28 },
			{ x: rect.x, y: rect.y, width: rect.width, height: rect.height, radius: 32, fillColor: 0x100605, fillAlpha: alpha, strokeColor: 0x6f4924, strokeAlpha: 0.34, strokeWidth: 3 },
			{ x: rect.x + 12, y: rect.y + 12, width: rect.width - 24, height: rect.height - 24, radius: 24, fillColor: PANEL.INNER_BG, fillAlpha: 0.8, strokeColor: 0xe1b86a, strokeAlpha: 0.12, strokeWidth: 2 },
		]);
		container.addChild(panel);
		return container;
	}

	private createReelAltarPanel(): Container {
		const container = new Container();
		const altar = SCENE_LAYOUT.game.reelAltar;
		const viewport = SCENE_LAYOUT.game.reelViewport;

		const panel = drawLayeredPanel([
			{ x: altar.x + 20, y: altar.y + 26, width: altar.width - 20, height: altar.height - 18, radius: 44, fillColor: COLOR_BLACK, fillAlpha: 0.34 },
			{ x: altar.x + 24, y: altar.y + 30, width: altar.width - 48, height: altar.height - 56, radius: 38, fillColor: 0x0a0403, fillAlpha: 0.82, strokeColor: 0xb57f41, strokeAlpha: 0.22, strokeWidth: 4 },
			{ x: altar.x + 54, y: altar.y + 72, width: altar.width - 108, height: altar.height - 126, radius: 28, fillColor: PANEL.ALTAR_INNER_BG, fillAlpha: 0.46, strokeColor: 0xe0b56b, strokeAlpha: 0.14, strokeWidth: 2 },
			{ x: viewport.x - 14, y: viewport.y - 14, width: viewport.width + 28, height: viewport.height + 28, radius: 24, fillColor: 0x090403, fillAlpha: 0.84 },
			{ x: viewport.x - 4, y: viewport.y - 4, width: viewport.width + 8, height: viewport.height + 8, radius: 20, strokeColor: 0x4b2b18, strokeAlpha: 0.42, strokeWidth: 3 },
		]);

		container.addChild(panel);
		container.addChild(this.createBoardBackdrop());
		return container;
	}

	private getReelBoardSize(): { width: number; height: number } {
		return {
			width: this.reel.REEL_WIDTH * this.reel.SLOT_NUMBER * SCENE_LAYOUT.game.reelViewport.reelScale,
			height: this.reel.SYMBOL_SIZE * this.reel.SLOT_NUMBER * SCENE_LAYOUT.game.reelViewport.reelScale
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
			{ x: boardX - 18, y: boardY - 24, width: boardWidth + 36, height: boardHeight + 48, radius: 42, fillColor: 0x040101, fillAlpha: 0.5 },
			{ x: boardX, y: boardY, width: boardWidth, height: boardHeight, radius: 28, fillColor: PANEL.INNER_BG, fillAlpha: 0.96, strokeColor: 0x7a4a21, strokeAlpha: 0.72, strokeWidth: 4 },
			{ x: boardX + 10, y: boardY + 10, width: boardWidth - 20, height: boardHeight - 20, radius: 20, strokeColor: 0xe6b55b, strokeAlpha: 0.22, strokeWidth: 2 },
			{ x: boardX + 18, y: boardY + 18, width: boardWidth - 36, height: boardHeight - 36, radius: 16, fillColor: PANEL.ALTAR_INNER_BG, fillAlpha: 0.24 },
			{ x: boardX + 22, y: boardY + 18, width: boardWidth - 44, height: 14, radius: 10, fillColor: PANEL.ACCENT_GOLD, fillAlpha: 0.08 },
		]);
	}

	private configureReels() {
		this.reel.reelContainer.x = SCENE_LAYOUT.game.reelViewport.x;
		this.reel.reelContainer.y = SCENE_LAYOUT.game.reelViewport.y;
		this.reel.reelContainer.scale.set(SCENE_LAYOUT.game.reelViewport.reelScale);

		this.reelMask?.destroy();
		this.reelMask = new Graphics();
		this.reelMask
			.roundRect(
				0,
				0,
				this.reel.REEL_WIDTH * this.reel.SLOT_NUMBER,
				this.reel.SYMBOL_SIZE * this.reel.SLOT_NUMBER,
				SCENE_LAYOUT.game.reelViewport.maskRadius
			)
			.fill({ color: COLOR_WHITE, alpha: 1 });
		this.reelMask.alpha = MASK_ALPHA_INVISIBLE;
		this.reel.reelContainer.addChild(this.reelMask);
		this.reel.reelContainer.mask = this.reelMask;
	}

	private createBoardOverlay(): Container {
		const overlay = new Container();
		const grid = new Graphics();
		const gloss = new Graphics();
		const localWidth = this.reel.REEL_WIDTH * this.reel.SLOT_NUMBER;
		const localHeight = this.reel.SYMBOL_SIZE * this.reel.SLOT_NUMBER;

		overlay.x = SCENE_LAYOUT.game.reelViewport.x;
		overlay.y = SCENE_LAYOUT.game.reelViewport.y;
		overlay.scale.set(SCENE_LAYOUT.game.reelViewport.reelScale);

		grid.rect(0, 0, localWidth, localHeight).stroke({ color: PANEL.GRID_BORDER_COLOR, alpha: 0.82, width: 6 });

		for (let column = 1; column < this.reel.SLOT_NUMBER; column++) {
			grid.moveTo(column * this.reel.REEL_WIDTH, 0).lineTo(column * this.reel.REEL_WIDTH, localHeight).stroke({ color: PANEL.GRID_LINE_COLOR, alpha: 0.92, width: 6 });
		}

		for (let row = 1; row < this.reel.SLOT_NUMBER; row++) {
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
			{ x: region.x, y: region.y, width: region.width, height: region.height, radius: 28, fillColor: 0x150806, fillAlpha: 0.88, strokeColor: 0x94632f, strokeAlpha: 0.26, strokeWidth: 3 },
			{ x: region.x + 10, y: region.y + 10, width: region.width - 20, height: region.height - 20, radius: 22, fillColor: 0x090302, fillAlpha: 0.76, strokeColor: 0xe3bb73, strokeAlpha: 0.12, strokeWidth: 2 },
			{ x: region.x + 16, y: region.y + 16, width: region.width - 32, height: 18, radius: 10, fillColor: PANEL.ACCENT_GOLD, fillAlpha: 0.08 },
		]);

		this.actionStateText = createText({ text: 'Ready', style: ACTION_LABEL_STYLE, anchorX: 0.5, x: region.centerX, y: region.y + PANEL.ACTION_LABEL_Y_OFFSET });
		this.actionDetailText = createText({ text: 'The altar waits for your next fight.', style: ACTION_DETAIL_STYLE, anchorX: 0.5, x: region.centerX, y: region.y + PANEL.ACTION_DETAIL_Y_OFFSET });

		panel.addChild(background);
		panel.addChild(this.actionStateText);
		panel.addChild(this.actionDetailText);
		return panel;
	}

	private updateActionFeedback(): void {
		let label = 'Ready';
		let detail = 'The altar waits for your next fight.';

		switch (this._gameLogicService.state) {
			case GameStates.START:
			case GameStates.ROLL:
			case GameStates.RESULTS:
				label = 'Rolling';
				detail = 'The ritual is resolving across the parchment reels.';
				break;
			case GameStates.WIN:
				label = 'Victory';
				detail = this.payTableGUI?.result != null ? `Won ${this.payTableGUI.result} gold. Press Fight to continue.` : 'A winning line struck true.';
				break;
			case GameStates.LOSE:
				label = 'Defeated';
				detail = 'Your champion has fallen and the altar grows silent.';
				break;
			default:
				if (this.char.credits <= 0) {
					label = 'No gold';
					detail = 'You have no gold coins to fight.';
				} else if (this.char.specialBar >= SKILL_CHARGE_MAX) {
					detail = 'Skill is ready. Fight or unleash your class power.';
				} else {
					detail = 'Fight spends 1 gold unless a skill is primed.';
				}
				break;
		}

		if (label !== this.lastActionLabel) {
			this.lastActionLabel = label;
			this.actionStateText.text = label;
		}
		if (detail !== this.lastActionDetail) {
			this.lastActionDetail = detail;
			this.actionDetailText.text = detail;
		}
	}

	private createButtonShadow(x: number, y: number): Graphics {
		const shadow = new Graphics();
		shadow
			.roundRect(x + 10, y + 14, SCENE_LAYOUT.game.fightButton.width, SCENE_LAYOUT.game.fightButton.height, 32)
			.fill({ color: COLOR_BLACK, alpha: 0.3 });
		return shadow;
	}
}
