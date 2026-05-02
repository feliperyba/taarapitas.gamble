import { Sprite, Application, Texture, FillGradient, TextStyle, Graphics, Container, Rectangle, Text, NineSliceSprite } from 'pixi.js';
import {
	WarriorClassStrategy,
	BerserkerClassStrategy,
	MageClassStrategy,
	ClericClassStrategy,
	CharContext
} from '../../char-module/char-strategy/char-strategy';
import { AppComponent } from '../../../app/app.component';
import { Button } from '../../gui-module/button';
import { getTexture } from '../../../rendering/assets';
import { DESIGN_WIDTH, SCENE_LAYOUT } from '../../../rendering/viewport';

export class CharSelectionScreen {
	private readonly btnTexture!: Texture;
	private readonly btnOverTexture!: Texture;
	private readonly btnPushTexture!: Texture;

	private readonly charClasses = [
		new WarriorClassStrategy(),
		new BerserkerClassStrategy(),
		new MageClassStrategy(),
		new ClericClassStrategy()
	];

	public readonly selectCharContainer = new Container();

	constructor(private readonly app: Application, private readonly appComponent: AppComponent) {
		this.btnTexture = getTexture('assets/button.png');
		this.btnOverTexture = getTexture('assets/button-HOVER.png');
		this.btnPushTexture = getTexture('assets/button-PUSH.png');

		let i = 0;
		const titleGrad = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		titleGrad.addColorStop(0, '#753213').addColorStop(1, '#FAE888');
		const titleStyle = new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 58,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: titleGrad,
			stroke: { color: '#000', width: 3 },
			dropShadow: {
				color: '#C86913',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			wordWrap: true,
			wordWrapWidth: SCENE_LAYOUT.charSelect.cardWidth - SCENE_LAYOUT.charSelect.contentInset * 2,
			align: 'center'
		});

		const descGrad = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		descGrad.addColorStop(0, '#ffffff').addColorStop(1, '#cccccc');
		const descStyle = new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 30,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: descGrad,
			stroke: { color: '#000', width: 3 },
			dropShadow: {
				color: '#C86913',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			wordWrap: true,
			wordWrapWidth: SCENE_LAYOUT.charSelect.cardWidth - SCENE_LAYOUT.charSelect.contentInset * 2,
			align: 'center'
		});

		const nameGrad = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		nameGrad.addColorStop(0, '#ffffff').addColorStop(1, '#cccccc');
		const style = new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 42,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: nameGrad,
			stroke: { color: '#000', width: 5 },
			dropShadow: {
				color: '#C86913',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			wordWrap: true,
			wordWrapWidth: 120,
			align: 'center'
		});
		const buttonStyle = new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 44,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: nameGrad,
			stroke: { color: '#000', width: 6 },
			dropShadow: {
				color: '#C86913',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			wordWrap: true,
			wordWrapWidth: SCENE_LAYOUT.charSelect.selectButtonWidth - 40,
			align: 'center'
		});

		for (const char of this.charClasses) {
			const cardLayout = SCENE_LAYOUT.charSelect;
			const columnStep = SCENE_LAYOUT.charSelect.cardWidth + SCENE_LAYOUT.charSelect.columnGap;
			const totalWidth = this.charClasses.length * SCENE_LAYOUT.charSelect.cardWidth +
				(this.charClasses.length - 1) * SCENE_LAYOUT.charSelect.columnGap;
			const cardX = (DESIGN_WIDTH - totalWidth) / 2 + i * columnStep;
			const contentCenterX = cardLayout.cardWidth / 2;
			const cardContainer = new Container();
			const classBackground = new NineSliceSprite({
				texture: char.BACKGROUND,
				width: cardLayout.cardWidth,
				height: cardLayout.cardHeight,
				leftWidth: 48,
				topHeight: 72,
				rightWidth: 48,
				bottomHeight: 72
			});
			const classPortrait = new Sprite(char.PORTRAIT);
			const statPanel = new Graphics();
			const descPanel = new Graphics();
			const lifeIcon = new Sprite(getTexture('assets/life_icon.png'));
			const creditIcon = new Sprite(getTexture('assets/credit_icon.png'));

			const classNameText: Text = new Text({ text: char.NAME, style: titleStyle });
			const creditsText: Text = new Text({ text: char.CREDITS.toString(), style });
			const lifeText: Text = new Text({ text: char.LIFE.toString(), style });

			const skillText: Text = new Text({ text: char.SKILL_DESC, style: descStyle });

			cardContainer.x = cardX;
			cardContainer.y = SCENE_LAYOUT.charSelect.top;
			cardContainer.hitArea = new Rectangle(
				0,
				0,
				cardLayout.cardWidth,
				cardLayout.cardHeight
			);

			classPortrait.scale.x = classPortrait.scale.y = Math.min(
				cardLayout.portraitSize / classPortrait.width,
				cardLayout.portraitSize / classPortrait.height
			);
			classPortrait.x = contentCenterX - classPortrait.width / 2;
			classPortrait.y = cardLayout.portraitY;

			classNameText.anchor.set(0.5);
			classNameText.x = contentCenterX;
			classNameText.y = cardLayout.titleY;

			const panelX = cardLayout.contentInset;
			const panelWidth = cardLayout.cardWidth - cardLayout.contentInset * 2;
			const statCenterY = cardLayout.statPanelY + cardLayout.statPanelHeight / 2;
			const lifeCenterX = contentCenterX - 96;
			const creditCenterX = contentCenterX + 96;

			statPanel.roundRect(panelX, cardLayout.statPanelY, panelWidth, cardLayout.statPanelHeight, 6)
				.fill({ color: 0x160905, alpha: 0.34 })
				.stroke({ color: 0xd28a34, alpha: 0.16, width: 2 });
			lifeIcon.width = cardLayout.statIconSize;
			lifeIcon.height = cardLayout.statIconSize;
			lifeIcon.anchor.set(0.5);
			lifeIcon.x = lifeCenterX;
			lifeIcon.y = statCenterY;

			lifeText.anchor.set(0.5);
			lifeText.x = lifeIcon.x;
			lifeText.y = lifeIcon.y + 4;

			creditIcon.width = cardLayout.statIconSize;
			creditIcon.height = cardLayout.statIconSize;
			creditIcon.anchor.set(0.5);
			creditIcon.x = creditCenterX;
			creditIcon.y = statCenterY;

			creditsText.anchor.set(0.5);
			creditsText.x = creditIcon.x;
			creditsText.y = creditIcon.y + 4;

			descPanel.roundRect(panelX, cardLayout.descPanelY, panelWidth, cardLayout.descPanelHeight, 6)
				.fill({ color: 0x160905, alpha: 0.26 })
				.stroke({ color: 0xd28a34, alpha: 0.14, width: 2 });
			skillText.anchor.set(0.5);
			skillText.x = contentCenterX;
			skillText.y = cardLayout.descPanelY + cardLayout.descPanelHeight / 2;

			const btnSelect = new Button(
				cardLayout.selectButtonHeight,
				cardLayout.selectButtonWidth,
				this.btnTexture,
				this.btnOverTexture,
				this.btnPushTexture,
				'Select',
				buttonStyle
			);

			btnSelect.btnContainer.on('pointerdown', () => {
				const target = char.TARGET_TYPE === 'Char' ? undefined : this.appComponent.reel;
				const context = new CharContext(char, target);
				this.appComponent.char = context.createCharClass();
				this.appComponent.char.charContext = context;

				if (this.appComponent.char.charContext.target == null) {
					this.appComponent.char.charContext.target = this.appComponent.char;
				}
				this.appComponent.setup();
			});

			btnSelect.btnContainer.x = contentCenterX - cardLayout.selectButtonWidth / 2;
			btnSelect.btnContainer.y = cardLayout.cardHeight - cardLayout.selectButtonHeight - cardLayout.selectButtonBottom;

			cardContainer.addChild(classBackground);
			cardContainer.addChild(statPanel);
			cardContainer.addChild(descPanel);
			cardContainer.addChild(classPortrait);
			cardContainer.addChild(classNameText);
			cardContainer.addChild(lifeIcon);
			cardContainer.addChild(lifeText);
			cardContainer.addChild(creditIcon);
			cardContainer.addChild(creditsText);
			cardContainer.addChild(skillText);
			cardContainer.addChild(btnSelect.btnContainer);

			cardContainer.eventMode = 'static';
			cardContainer.cursor = 'pointer';

			this.selectCharContainer.addChild(cardContainer);
			i++;
		}
	}

	public destroy(): void {
		this.selectCharContainer.destroy({ children: true });
	}
}
