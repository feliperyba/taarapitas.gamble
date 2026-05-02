import { Sprite, Graphics, Container, Text, Rectangle } from 'pixi.js';
import { gsap } from 'gsap';
import { Char } from '../char';
import { Reel } from '../../reel';
import { GameLogicService, GameStates } from '../../../services/game-logic.service';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';
import { createGradientTextStyle } from '../../pixi-helpers';

const COLOR_WHITE = 0xffffff;
const COLOR_PANEL_BG = 0x150806;
const COLOR_PANEL_BORDER = 0x94632f;
const COLOR_PANEL_INNER_BG = 0x090302;
const COLOR_PANEL_INNER_BORDER = 0xe3bb73;
const COLOR_PANEL_TRIM = 0xf7d7a5;
const COLOR_SKILL_GLOW_OUTER = 0xf0912c;
const COLOR_SKILL_GLOW_INNER = 0x070302;

const SKILL_CONTAINER_Y_OFFSET = 98;
const SKILL_GLOW_OUTER_RADIUS = 68;
const SKILL_GLOW_INNER_RADIUS = 48;
const SKILL_OFF_MAX_SIZE = 118;
const SKILL_READY_MAX_SIZE = 112;
const SKILL_STATE_TEXT_Y_OFFSET = 144;

const DURATION_SKILL_READY_PULSE = 0.52;

const ALPHA_LOW_LIFE_PULSE = 0.35;
const ALPHA_SKILL_READY_PULSE_MIN = 0.48;
const ALPHA_SKILL_OFF = 0.92;
const ALPHA_SKILL_GLOW_BASE = 0.25;
const ALPHA_SKILL_GLOW_RANGE = 0.16;

const SKILL_CHARGE_MAX = 3;

export class SkillPanel {
	private skillReady!: Sprite;
	private skillOff!: Sprite;
	private skillGlow!: Graphics;
	private skillStateText: Text = new Text({ text: '' });
	private skillPulseActive = false;
	private lastRenderedSpecialBar = -1;

	private readonly panelTitleStyle = createGradientTextStyle({
		fillStops: ['#fff5cf', '#c18f40'],
		fontSize: 20,
		strokeWidth: 3,
		letterSpacing: 1
	});

	private readonly panelNoteStyle = createGradientTextStyle({
		fillStops: ['#fef4dc', '#be9860'],
		fontSize: 18,
		strokeWidth: 3,
		wordWrap: true,
		wordWrapWidth: SCENE_LAYOUT.game.skillWell.width - 130
	});

	public setup(parent: Container, char: Char, gameLogicService: GameLogicService, reel: Reel): void {
		const skillWell = SCENE_LAYOUT.game.skillWell;
		const skillContainer = new Container();
		const panel = new Graphics();
		const trim = new Graphics();
		const title = new Text({ text: 'SKILL', style: this.panelTitleStyle });
		this.skillGlow = new Graphics();
		this.skillOff = new Sprite(getTexture('assets/skill_bar_empty.png'));
		this.skillReady = new Sprite(getTexture('assets/skill_bar_full.png'));

		panel
			.roundRect(skillWell.x, skillWell.y, skillWell.width, skillWell.height, 24)
			.fill({ color: COLOR_PANEL_BG, alpha: 0.88 })
			.stroke({ color: COLOR_PANEL_BORDER, alpha: 0.24, width: 3 });
		panel
			.roundRect(skillWell.x + 10, skillWell.y + 10, skillWell.width - 20, skillWell.height - 20, 20)
			.fill({ color: COLOR_PANEL_INNER_BG, alpha: 0.72 })
			.stroke({ color: COLOR_PANEL_INNER_BORDER, alpha: 0.1, width: 2 });
		trim.roundRect(skillWell.x + 16, skillWell.y + 14, skillWell.width - 32, 16, 8).fill({ color: COLOR_PANEL_TRIM, alpha: 0.06 });

		title.anchor.set(0.5, 0);
		title.x = skillWell.centerX;
		title.y = skillWell.y + 4;

		skillContainer.x = skillWell.centerX;
		skillContainer.y = skillWell.y + SKILL_CONTAINER_Y_OFFSET;
		skillContainer.eventMode = 'static';
		skillContainer.cursor = 'pointer';
		skillContainer.hitArea = new Rectangle(-skillWell.width / 2 + 12, -72, skillWell.width - 24, 112);

		this.skillGlow.circle(0, 0, SKILL_GLOW_OUTER_RADIUS).fill({ color: COLOR_SKILL_GLOW_OUTER, alpha: 0.1 });
		this.skillGlow.circle(0, 0, SKILL_GLOW_INNER_RADIUS).fill({ color: COLOR_SKILL_GLOW_INNER, alpha: 0.74 });

		this.skillOff.anchor.set(0.5);
		this.skillOff.scale.x = this.skillOff.scale.y = Math.min(SKILL_OFF_MAX_SIZE / this.skillOff.width, SKILL_OFF_MAX_SIZE / this.skillOff.height);
		this.skillOff.alpha = 1;

		this.skillReady.anchor.set(0.5);
		this.skillReady.scale.x = this.skillReady.scale.y = Math.min(SKILL_READY_MAX_SIZE / this.skillReady.width, SKILL_READY_MAX_SIZE / this.skillReady.height);
		this.skillReady.visible = false;

		this.skillStateText = new Text({ text: 'Charge 0 / 3', style: this.panelNoteStyle });
		this.skillStateText.anchor.set(0.5, 0);
		this.skillStateText.x = skillWell.centerX;
		this.skillStateText.y = skillWell.y + SKILL_STATE_TEXT_Y_OFFSET;

		skillContainer.on('pointerdown', () => {
			if (
				(char.specialBar >= SKILL_CHARGE_MAX && gameLogicService.state === GameStates.WAITING) ||
				gameLogicService.state === GameStates.WIN
			) {
				if (gameLogicService.state === GameStates.WIN) {
					const winPos = reel.reelWinSlotPos;
					if (winPos !== undefined) {
						for (const r of reel.reelArr) {
							r.container.children[winPos].tint = COLOR_WHITE;
						}
						reel.reelWinSlotPos = undefined;
					}
				}

				char.setUsingSkill(true);
				char.charContext.useClassSkill(char.charContext.target);

				if (char.charContext.target instanceof Char) {
					char.setUsingSkill(false);
					char.setSpecialBar(0);
				}
			}
		});

		skillContainer.addChild(this.skillGlow);
		skillContainer.addChild(this.skillOff);
		skillContainer.addChild(this.skillReady);

		parent.addChild(panel);
		parent.addChild(trim);
		parent.addChild(title);
		parent.addChild(skillContainer);
		parent.addChild(this.skillStateText);
	}

	public render(specialBar: number): void {
		if (specialBar === this.lastRenderedSpecialBar) return;
		this.lastRenderedSpecialBar = specialBar;

		if (specialBar >= SKILL_CHARGE_MAX) {
			this.skillReady.visible = true;
			this.skillOff.alpha = ALPHA_LOW_LIFE_PULSE;

			if (!this.skillPulseActive) {
				this.skillPulseActive = true;
				this.skillReady.alpha = 1;
				gsap.killTweensOf(this.skillReady);
				gsap.to(this.skillReady, {
					alpha: ALPHA_SKILL_READY_PULSE_MIN,
					duration: DURATION_SKILL_READY_PULSE,
					ease: 'sine.inOut',
					yoyo: true,
					repeat: -1
				});
			}

			this.skillGlow.alpha = ALPHA_SKILL_GLOW_BASE + this.skillReady.alpha * ALPHA_SKILL_GLOW_RANGE;
			this.skillStateText.text = 'Ready to cast';
		} else {
			if (this.skillPulseActive) {
				this.skillPulseActive = false;
				gsap.killTweensOf(this.skillReady);
			}
			this.skillReady.visible = false;
			this.skillReady.alpha = 1;
			this.skillOff.alpha = ALPHA_SKILL_OFF;
			this.skillGlow.alpha = ALPHA_SKILL_OFF;
			this.skillStateText.text = `Charge ${specialBar} / ${SKILL_CHARGE_MAX}`;
		}
	}

	public destroy(): void {
		gsap.killTweensOf(this.skillReady);
	}
}
