import { Application, Container, FillGradient, TextStyle, Graphics, NineSliceSprite, Text, Texture } from 'pixi.js';
import { GameLogicService, GameStates } from '../../services/game-logic.service';
import { Reel } from '../reel';
import { Char } from '../char-module/char';
import { CharGUI } from '../char-module/char-gui/char-gui';
import { Button } from './button';
import { PayTable } from '../pay-module/pay-table';
import { getTexture } from '../../rendering/assets';
import { SCENE_LAYOUT } from '../../rendering/viewport';

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
	private actionStateText = new Text();
	private actionDetailText = new Text();

	private DEFAULT_STYLE = (() => {
		const g = new FillGradient(0, 0, 0, 1);
		g.addColorStop(0, '#ffffff').addColorStop(1, '#cccccc');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 48,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: g,
			stroke: { color: '#000', width: 5 },
			dropShadow: {
				color: '#C86913',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			wordWrap: true,
			wordWrapWidth: 400,
			align: 'center'
		});
	})();

	private actionLabelStyle = (() => {
		const g = new FillGradient(0, 0, 0, 1);
		g.addColorStop(0, '#fff1c8').addColorStop(1, '#d6a44d');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 32,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: g,
			stroke: { color: '#000', width: 5 },
			dropShadow: {
				color: '#62240e',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			wordWrap: true,
			wordWrapWidth: SCENE_LAYOUT.game.statusWell.width - 44,
			align: 'center'
		});
	})();

	private actionDetailStyle = (() => {
		const g = new FillGradient(0, 0, 0, 1);
		g.addColorStop(0, '#fff6db').addColorStop(1, '#c5a067');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 18,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: g,
			stroke: { color: '#000', width: 4 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			wordWrap: true,
			wordWrapWidth: SCENE_LAYOUT.game.statusWell.width - 54,
			align: 'center'
		});
	})();

	private btnTexture: Texture;
	private btnOverTexture: Texture;
	private btnPushTexture: Texture;

	constructor(
		public app: Application,
		public sceneRoot: Container,
		public reel: Reel,
		public char: Char,
		public payTable: PayTable,
		public style: TextStyle,
		public _gameLogicService: GameLogicService
	) {
		this.btnTexture = getTexture('assets/button.png');
		this.btnOverTexture = getTexture('assets/button-HOVER.png');
		this.btnPushTexture = getTexture('assets/button-PUSH.png');

		this.GUISetup();
	}

	public GUISetup() {
		this.uiRoot.addChild(this.backdropLayer);
		this.uiRoot.addChild(this.leftRailLayer);
		this.uiRoot.addChild(this.reelLayer);
		this.uiRoot.addChild(this.rightReliquaryLayer);
		this.uiRoot.addChild(this.topHudLayer);
		this.uiRoot.addChild(this.actionLayer);
		this.uiRoot.addChild(this.heroAltarLayer);
		this.uiRoot.addChild(this.modalLayer);
		this.sceneRoot.addChild(this.uiRoot);

		this.backdropLayer.addChild(this.createBackdrop());
		this.leftRailLayer.addChild(this.createRailPanel(SCENE_LAYOUT.game.leftRail, 0.96));
		this.reelLayer.addChild(this.createReelAltarPanel());
		this.rightReliquaryLayer.addChild(this.createRailPanel(SCENE_LAYOUT.game.rightReliquary, 0.96));
		this.topHudLayer.addChild(this.createTopHudBeam());

		this.configureReels();
		this.reelLayer.addChild(this.reel.reelContainer);
		this.reelLayer.addChild(this.createBoardOverlay());

		const charGui = new CharGUI(this.app, this.char, this._gameLogicService, this.style, this.reel, 0).setup();
		this.heroAltarLayer.addChild(charGui);


		const playBtn = new Button(
			SCENE_LAYOUT.game.fightButton.height,
			SCENE_LAYOUT.game.fightButton.width,
			this.btnTexture,
			this.btnOverTexture,
			this.btnPushTexture,
			'Fight',
			this.DEFAULT_STYLE
		);

		playBtn.btnContainer.x = SCENE_LAYOUT.game.fightButton.x;
		playBtn.btnContainer.y = SCENE_LAYOUT.game.fightButton.y;
		playBtn.btnContainer.on('pointerdown', () => {
			if (this._gameLogicService.state == GameStates.WAITING) {
				this._gameLogicService.state = GameStates.START;
			}

			if (this._gameLogicService.state == GameStates.WIN) {
				for (const r of this.reel.reelArr) {
					r.container.children[this.reel.reelWinSlotPos].tint = 16777215;
				}
				this.reel.reelWinSlotPos = 0;
				this._gameLogicService.state = GameStates.START;
			}
		});

		this.actionLayer.addChild(this.createStatusPanel());
		this.actionLayer.addChild(this.createButtonShadow(playBtn.btnContainer.x, playBtn.btnContainer.y));
		this.actionLayer.addChild(playBtn.btnContainer);

		this.app.ticker.add(() => {
			playBtn.setDisabled(!(this._gameLogicService.state === GameStates.WAITING || this._gameLogicService.state === GameStates.WIN));
			this.updateActionFeedback();
		});
	}

	private createBackdrop(): Container {
		const container = new Container();
 		// todo: add some subtle animated background elements here, like particles and shaders for especial moments and effects 
		return container;
	}

	private createTopHudBeam(): Container {
		const beam = new Container();
		const hud = SCENE_LAYOUT.game.topHud;
		const panel = new Graphics();
		const trim = new Graphics();
		const divider = new Graphics();

		panel.roundRect(hud.x, hud.y + 8, hud.width, hud.height - 8, 28).fill({ color: 0x120706, alpha: 0.84 });
		panel
			.roundRect(hud.x + 10, hud.y + 18, hud.width - 20, hud.height - 30, 22)
			.fill({ color: 0x070302, alpha: 0.8 })
			.stroke({ color: 0xa06f37, alpha: 0.26, width: 3 });
		trim.roundRect(hud.x + 18, hud.y + 24, hud.width - 36, 22, 12).fill({ color: 0xf7d7a5, alpha: 0.08 });
		trim.roundRect(hud.x + 22, hud.bottom - 36, hud.width - 44, 10, 8).fill({ color: 0x000000, alpha: 0.24 });


		beam.addChild(panel);
		beam.addChild(trim);
		beam.addChild(divider);
		return beam;
	}

	private createRailPanel(rect: { x: number; y: number; width: number; height: number }, alpha: number): Container {
		const container = new Container();
		const shadow = new Graphics();
		const body = new Graphics();
		const inner = new Graphics();

		shadow.roundRect(rect.x + 14, rect.y + 18, rect.width - 14, rect.height - 12, 34).fill({ color: 0x000000, alpha: 0.28 });
		body
			.roundRect(rect.x, rect.y, rect.width, rect.height, 32)
			.fill({ color: 0x100605, alpha })
			.stroke({ color: 0x6f4924, alpha: 0.34, width: 3 });
		inner
			.roundRect(rect.x + 12, rect.y + 12, rect.width - 24, rect.height - 24, 24)
			.fill({ color: 0x070302, alpha: 0.8 })
			.stroke({ color: 0xe1b86a, alpha: 0.12, width: 2 });

		container.addChild(shadow);
		container.addChild(body);
		container.addChild(inner);

		return container;
	}

	private createReelAltarPanel(): Container {
		const container = new Container();
		const altar = SCENE_LAYOUT.game.reelAltar;
		const shadow = new Graphics();

		const body = new Graphics();
		const innerFrame = new Graphics();
		const viewportMat = new Graphics();

		shadow.roundRect(altar.x + 20, altar.y + 26, altar.width - 20, altar.height - 18, 44).fill({ color: 0x000000, alpha: 0.34 });

		body
			.roundRect(altar.x + 24, altar.y + 30, altar.width - 48, altar.height - 56, 38)
			.fill({ color: 0x0a0403, alpha: 0.82 })
			.stroke({ color: 0xb57f41, alpha: 0.22, width: 4 });
		innerFrame
			.roundRect(altar.x + 54, altar.y + 72, altar.width - 108, altar.height - 126, 28)
			.fill({ color: 0x120907, alpha: 0.46 })
			.stroke({ color: 0xe0b56b, alpha: 0.14, width: 2 });

		viewportMat
			.roundRect(
				SCENE_LAYOUT.game.reelViewport.x - 14,
				SCENE_LAYOUT.game.reelViewport.y - 14,
				SCENE_LAYOUT.game.reelViewport.width + 28,
				SCENE_LAYOUT.game.reelViewport.height + 28,
				24
			)
			.fill({ color: 0x090403, alpha: 0.84 });
		viewportMat
			.roundRect(
				SCENE_LAYOUT.game.reelViewport.x - 4,
				SCENE_LAYOUT.game.reelViewport.y - 4,
				SCENE_LAYOUT.game.reelViewport.width + 8,
				SCENE_LAYOUT.game.reelViewport.height + 8,
				20
			)
			.stroke({ color: 0x4b2b18, alpha: 0.42, width: 3 });

		container.addChild(shadow);
		container.addChild(body);
		container.addChild(innerFrame);
		container.addChild(viewportMat);
		container.addChild(this.createBoardBackdrop());
		
		return container;
	}

	private getReelBoardSize() {
		return {
			width: this.reel.REEL_WIDTH * this.reel.SLOT_NUMBER * SCENE_LAYOUT.game.reelViewport.reelScale,
			height: this.reel.SYMBOL_SIZE * this.reel.SLOT_NUMBER * SCENE_LAYOUT.game.reelViewport.reelScale
		};
	}

	private createBoardBackdrop(): Graphics {
		const reelViewport = SCENE_LAYOUT.game.reelViewport;
		const backdrop = new Graphics();
		const { width, height } = this.getReelBoardSize();
		const frameInset = reelViewport.frameInset;
		const boardX = reelViewport.x - frameInset;
		const boardY = reelViewport.y - frameInset;
		const boardWidth = width + frameInset * 2;
		const boardHeight = height + frameInset * 2;

		backdrop.roundRect(boardX - 18, boardY - 24, boardWidth + 36, boardHeight + 48, 42).fill({ color: 0x040101, alpha: 0.5 });
		backdrop
			.roundRect(boardX, boardY, boardWidth, boardHeight, 28)
			.fill({ color: 0x070302, alpha: 0.96 })
			.stroke({ color: 0x7a4a21, alpha: 0.72, width: 4 });
		backdrop
			.roundRect(boardX + 10, boardY + 10, boardWidth - 20, boardHeight - 20, 20)
			.stroke({ color: 0xe6b55b, alpha: 0.22, width: 2 });
		backdrop
			.roundRect(boardX + 18, boardY + 18, boardWidth - 36, boardHeight - 36, 16)
			.fill({ color: 0x120907, alpha: 0.24 });
		backdrop.roundRect(boardX + 22, boardY + 18, boardWidth - 44, 14, 10).fill({ color: 0xf3d3a0, alpha: 0.08 });

		return backdrop;
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
			.fill({ color: 0xffffff, alpha: 1 });
		this.reelMask.alpha = 0.001;
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

		grid.rect(0, 0, localWidth, localHeight).stroke({ color: 0x2d1408, alpha: 0.82, width: 6 });

		for (let column = 1; column < this.reel.SLOT_NUMBER; column++) {
			grid.moveTo(column * this.reel.REEL_WIDTH, 0).lineTo(column * this.reel.REEL_WIDTH, localHeight).stroke({ color: 0x120604, alpha: 0.92, width: 6 });
		}

		for (let row = 1; row < this.reel.SLOT_NUMBER; row++) {
			grid.moveTo(0, row * this.reel.SYMBOL_SIZE).lineTo(localWidth, row * this.reel.SYMBOL_SIZE).stroke({ color: 0x120604, alpha: 0.92, width: 6 });
		}

		grid.rect(0, 0, localWidth, 12).fill({ color: 0x000000, alpha: 0.22 });
		grid.rect(0, localHeight - 12, localWidth, 12).fill({ color: 0x000000, alpha: 0.28 });
		gloss.roundRect(8, 8, localWidth - 16, 18, 10).fill({ color: 0xf7ddb1, alpha: 0.06 });

		overlay.addChild(grid);
		overlay.addChild(gloss);
		return overlay;
	}

	private createStatusPanel(): Container {
		const region = SCENE_LAYOUT.game.statusWell;
		const panel = new Container();
		const background = new Graphics();
		const accent = new Graphics();

		background
			.roundRect(region.x, region.y, region.width, region.height, 28)
			.fill({ color: 0x150806, alpha: 0.88 })
			.stroke({ color: 0x94632f, alpha: 0.26, width: 3 });
		background
			.roundRect(region.x + 10, region.y + 10, region.width - 20, region.height - 20, 22)
			.fill({ color: 0x090302, alpha: 0.76 })
			.stroke({ color: 0xe3bb73, alpha: 0.12, width: 2 });
		accent.roundRect(region.x + 16, region.y + 16, region.width - 32, 18, 10).fill({ color: 0xf3d3a0, alpha: 0.08 });

		this.actionStateText = new Text('Ready', this.actionLabelStyle);
		this.actionStateText.anchor.set(0.5, 0);
		this.actionStateText.x = region.centerX;
		this.actionStateText.y = region.y + 42;

		this.actionDetailText = new Text('The altar waits for your next fight.', this.actionDetailStyle);
		this.actionDetailText.anchor.set(0.5, 0);
		this.actionDetailText.x = region.centerX;
		this.actionDetailText.y = region.y + 96;

		panel.addChild(background);
		panel.addChild(accent);
		panel.addChild(this.actionStateText);
		panel.addChild(this.actionDetailText);
		return panel;
	}

	private updateActionFeedback() {
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
				detail = this.payTable.payTableGUI?.result != null ? `Won ${this.payTable.payTableGUI.result} gold. Press Fight to continue.` : 'A winning line struck true.';
				break;
			case GameStates.LOSE:
				label = 'Defeated';
				detail = 'Your champion has fallen and the altar grows silent.';
				break;
			default:
				if (this.char.specialBar >= 3) {
					detail = 'Skill is ready. Fight or unleash your class power.';
				} else {
					detail = 'Fight spends 1 gold unless a skill is primed.';
				}
				break;
		}

		this.actionStateText.text = label;
		this.actionDetailText.text = detail;
	}

	private createButtonShadow(x: number, y: number): Graphics {
		const shadow = new Graphics();
		shadow
			.roundRect(x + 10, y + 14, SCENE_LAYOUT.game.fightButton.width, SCENE_LAYOUT.game.fightButton.height, 32)
			.fill({ color: 0x000000, alpha: 0.3 });
		return shadow;
	}

	public lerp(a1, a2, t) {
		return a1 * (1 - t) + a2 * t;
	}
}
