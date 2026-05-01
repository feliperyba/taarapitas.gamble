import { Sprite, Application, TextStyle, Graphics, Container, Rectangle, Text, FillGradient } from 'pixi.js';
import { gsap } from 'gsap';
import { GameLogicService, GameStates } from '../../../services/game-logic.service';
import { Char } from '../../char-module/char';
import { Reel } from '../../reel';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';

export class CharGUI {
	public charGUIContainer = new Container();
	public charRegionGraphics = new Container();
	public creditsText: Text = new Text();
	public lifeText: Text = new Text();
	public lifeBar: Sprite;
	private heroAltarContainer = new Container();
	private heroFrame: Sprite;
	private heroDamageFlash: Sprite;
	private lifeBarMaxWidth = 0;
	private previousLife = 0;
	private previousSpecialBar = 0;
	private previousUsingSkill = false;
	private skillStateText: Text = new Text();
	private potionPriceText: Text = new Text();

	private hudValueStyle = (() => {
		const gradient = new FillGradient(0, 0, 0, 1);
		gradient.addColorStop(0, '#fff8dd').addColorStop(1, '#d1ab59');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 28,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: gradient,
			stroke: { color: '#000', width: 4 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			}
		});
	})();

	private heroLabelStyle = (() => {
		const gradient = new FillGradient(0, 0, 0, 1);
		gradient.addColorStop(0, '#fff5cf').addColorStop(1, '#b68946');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 28,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: gradient,
			stroke: { color: '#000', width: 4 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			letterSpacing: 1
		});
	})();

	private panelTitleStyle = (() => {
		const gradient = new FillGradient(0, 0, 0, 1);
		gradient.addColorStop(0, '#fff5cf').addColorStop(1, '#c18f40');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 20,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: gradient,
			stroke: { color: '#000', width: 3 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			letterSpacing: 1
		});
	})();

	private hudPriceStyle = (() => {
		const gradient = new FillGradient(0, 0, 0, 1);
		gradient.addColorStop(0, '#fff8dd').addColorStop(1, '#d1ab59');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 24,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: gradient,
			stroke: { color: '#000', width: 4 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			}
		});
	})();

	private panelNoteStyle = (() => {
		const gradient = new FillGradient(0, 0, 0, 1);
		gradient.addColorStop(0, '#fef4dc').addColorStop(1, '#be9860');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 18,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: gradient,
			stroke: { color: '#000', width: 3 },
			dropShadow: {
				color: '#2d1207',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			wordWrap: true,
			wordWrapWidth: SCENE_LAYOUT.game.potionWell.width - 130
		});
	})();

	private changeSkillAlpha = false;
	private changeLifeAlpha = false;

	constructor(
		public app: Application,
		public char: Char,
		public _gameLogicService: GameLogicService,
		public style: TextStyle,
		public reel: Reel,
		public margin: number
	) {}

	public setup(): Container {
		this.setupHeroCrest();
		this.setupCreditsCluster();
		this.setupClassSkillPanel();
		this.setupPotionPanel();
		return this.charRegionGraphics;
	}

	private setupHeroCrest() {
		const heroCrest = SCENE_LAYOUT.game.heroCrest;
		const frameTexture = getTexture('assets/char_frame.png');
		const frameScale = heroCrest.width / frameTexture.width;
		const portraitCenterX = heroCrest.x + Math.round(160 * frameScale);
		const portraitCenterY = heroCrest.y + Math.round(160 * frameScale);
		const portraitMaskRadius = Math.round(100 * frameScale);
		const portrait = new Sprite(this.char.portrait);
		const frame = new Sprite(frameTexture);
		const damageFlash = new Sprite(frameTexture);
		const protectedIcon = new Sprite(getTexture('assets/protected_icon.png'));
		const portraitMask = new Graphics();

		frame.scale.set(frameScale);
		frame.x = heroCrest.x;
		frame.y = heroCrest.y;
		this.heroFrame = frame;

		damageFlash.scale.set(frameScale);
		damageFlash.x = frame.x;
		damageFlash.y = frame.y;
		damageFlash.tint = 0xe01818;
		damageFlash.alpha = 0;
		this.heroDamageFlash = damageFlash;

		this.scaleSpriteToCover(portrait, portraitMaskRadius * 5, portraitMaskRadius * 5);
		portrait.anchor.set(0.5);
		portrait.x = portraitCenterX - Math.round(portraitMaskRadius * 0.05);
		portrait.y = portraitCenterY + Math.round(portraitMaskRadius * 0.70);

		portraitMask.circle(portraitCenterX, portraitCenterY, portraitMaskRadius).fill({ color: 0xffffff, alpha: 1 });
		portraitMask.alpha = 0.001;
		portrait.mask = portraitMask;

		protectedIcon.anchor.set(0.5);
		protectedIcon.x = portraitCenterX + 192;
		protectedIcon.y = portraitCenterY - 16;
		protectedIcon.scale.x = protectedIcon.scale.y = Math.min(40 / protectedIcon.width, 40 / protectedIcon.height);
		protectedIcon.visible = false;

		this.previousLife = this.char.life;
		this.previousSpecialBar = this.char.specialBar;
		this.previousUsingSkill = this.char.usingSkill;

		this.heroAltarContainer.addChild(portrait);
		this.heroAltarContainer.addChild(portraitMask);
		this.heroAltarContainer.addChild(frame);
		this.heroAltarContainer.addChild(damageFlash);
		this.charRegionGraphics.addChild(this.heroAltarContainer);

		this.setupLifeBar(portraitCenterX, portraitCenterY);

		this.app.ticker.add(() => {
			protectedIcon.visible = this.char.isProtected;
			this.updateHeroAltarMotion();
		});

		this.heroAltarContainer.addChild(protectedIcon);
	}

	private setupLifeBar(portraitCenterX: number, portraitCenterY: number) {
		const heroCrest = SCENE_LAYOUT.game.heroCrest;
		const frameScale = heroCrest.width / getTexture('assets/char_frame.png').width;
		const label = new Text('LIFE', this.heroLabelStyle);
		const barMask = new Graphics();
		const lifeBarX = heroCrest.x + Math.round(250 * frameScale);
		const lifeBarY = heroCrest.y + Math.round(72 * frameScale);
		const lifeBarWidth = Math.round(370 * frameScale);
		const lifeBarHeight = Math.round(42 * frameScale);
		this.lifeBarMaxWidth = lifeBarWidth;

		label.anchor.set(0.5, 0);
		label.x = lifeBarX + lifeBarWidth / 2;
		label.y = heroCrest.y + Math.round(130 * frameScale);

		barMask.roundRect(lifeBarX, lifeBarY, lifeBarWidth, lifeBarHeight, 12).fill({ color: 0xffffff, alpha: 1 });
		barMask.alpha = 0.001;

		this.lifeBar = new Sprite(getTexture('assets/life_bar.png'));
		this.lifeBar.x = lifeBarX;
		this.lifeBar.y = lifeBarY;
		this.lifeBar.height = lifeBarHeight;
		this.lifeBar.width = lifeBarWidth;
		this.lifeBar.mask = barMask;

		this.lifeText = new Text(`${this.char.life}/${this.char.totalLife}`, this.hudValueStyle);
		this.lifeText.anchor.set(0.5);
		this.lifeText.x = lifeBarX + lifeBarWidth / 2;
		this.lifeText.y = lifeBarY + lifeBarHeight / 2;

		const hitBar = new Sprite(getTexture('assets/hit.png'));
		hitBar.alpha = 0;
		hitBar.anchor.set(0.5);
		hitBar.x = portraitCenterX - 32;
		hitBar.y = portraitCenterY;
		hitBar.scale.x = hitBar.scale.y = Math.min(150 / hitBar.width, 150 / hitBar.height);

		this.app.ticker.add(() => {
			const displayedLife = Number.parseInt(this.lifeText.text.split('/')[0], 10) || this.char.life;
			const lerpValue = this.lerp(this.char.life, displayedLife, 0.48);
			const percent = Math.max(0, this.char.life / this.char.totalLife);

			if (!gsap.isTweening(this.lifeBar)) {
				this.lifeBar.width = lifeBarWidth * percent;
			}
			this.lifeText.text = `${Math.round(lerpValue)}/${this.char.totalLife}`;

			if (this.char.life <= 5) {
				if (!this.changeLifeAlpha) {
					if (this.lifeBar.alpha < 0.4) {
						this.changeLifeAlpha = !this.changeLifeAlpha;
					}
					this.lifeBar.alpha -= 0.08;
				}

				if (this.changeLifeAlpha) {
					if (this.lifeBar.alpha > 1.0) {
						this.changeLifeAlpha = !this.changeLifeAlpha;
					}
					this.lifeBar.alpha += 0.08;
				}
			} else {
				this.lifeBar.alpha = 1;
			}

			if (this.char.hit == true) {
				this.char.hit = false;
				this.playDamageTween(hitBar);
			}
		});

		this.heroAltarContainer.addChild(label);
		this.heroAltarContainer.addChild(this.lifeBar);
		this.heroAltarContainer.addChild(barMask);
		this.heroAltarContainer.addChild(this.lifeText);
		this.heroAltarContainer.addChild(hitBar);
	}

	private updateHeroAltarMotion() {
		if (this.previousLife > 0 && this.char.life < this.previousLife) {
			this.playLifeTween(this.char.life / this.char.totalLife, true);
		} else if (this.char.life > this.previousLife) {
			this.playLifeTween(this.char.life / this.char.totalLife, false);
		}

		if (this.char.usingSkill && !this.previousUsingSkill) {
			this.playSkillTween();
		}

		if (this.previousSpecialBar >= 3 && this.char.specialBar === 0) {
			this.playSkillTween();
		}

		this.previousLife = this.char.life;
		this.previousSpecialBar = this.char.specialBar;
		this.previousUsingSkill = this.char.usingSkill;
	}

	private playLifeTween(percent: number, tookDamage: boolean) {
		const targetWidth = this.lifeBarMaxWidth * Math.max(0, Math.min(1, percent));
		gsap.killTweensOf(this.lifeBar);
		gsap.to(this.lifeBar, {
			width: targetWidth,
			duration: tookDamage ? 0.9 : 0.66,
			ease: tookDamage ? 'power3.out' : 'back.out(1.6)'
		});
	}

	private playDamageTween(hitBar: Sprite) {
		gsap.killTweensOf([this.heroAltarContainer, this.heroDamageFlash, hitBar]);
		gsap
			.timeline()
			.to(this.heroAltarContainer, { x: -10, duration: 0.035, ease: 'power1.inOut' })
			.to(this.heroAltarContainer, { x: 8, duration: 0.045, ease: 'power1.inOut' })
			.to(this.heroAltarContainer, { x: -4, duration: 0.04, ease: 'power1.inOut' })
			.to(this.heroAltarContainer, { x: 0, duration: 0.12, ease: 'power3.out' });
		gsap
			.timeline()
			.set(this.heroDamageFlash, { alpha: 0 })
			.to(this.heroDamageFlash, { alpha: 0.66, duration: 0.055, ease: 'power2.out' })
			.to(this.heroDamageFlash, { alpha: 0.12, duration: 0.09, ease: 'power2.in' })
			.to(this.heroDamageFlash, { alpha: 0.38, duration: 0.045, ease: 'power2.out' })
			.to(this.heroDamageFlash, { alpha: 0, duration: 0.18, ease: 'power2.out' });
		gsap.fromTo(hitBar, { alpha: 1 }, { alpha: 0, duration: 1.33, ease: 'power2.out' });
		gsap.fromTo(hitBar.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.33, ease: 'power2.out' });
	}

	private playSkillTween() {
		gsap.killTweensOf(this.heroAltarContainer.scale);
		gsap
			.timeline()
			.to(this.heroFrame, { tint: 0xffd27a, duration: 0.12, ease: 'power2.out' })
			.to(this.heroFrame, { tint: 0xffffff, duration: 0.42, ease: 'power2.out' }, '>');
		gsap.fromTo(
			this.heroAltarContainer.scale,
			{ x: 1.018, y: 1.018 },
			{ x: 1, y: 1, duration: 0.46, ease: 'elastic.out(1, 0.52)' }
		);
	}

	private setupCreditsCluster() {
		const creditsCluster = SCENE_LAYOUT.game.creditsCluster;
		const panel = new Graphics();
		const trim = new Graphics();
		const label = new Text('CREDITS', this.panelTitleStyle);
		const coin = new Sprite(getTexture('assets/coin.png'));

		panel
			.roundRect(creditsCluster.x, creditsCluster.y, creditsCluster.width, creditsCluster.height, 22)
			.fill({ color: 0x140806, alpha: 0.82 })
			.stroke({ color: 0xa37139, alpha: 0.22, width: 3 });
		trim.roundRect(creditsCluster.x + 12, creditsCluster.y + 10, creditsCluster.width - 24, 16, 8).fill({ color: 0xf3d3a0, alpha: 0.07 });

		label.anchor.set(0.5, 0);
		label.x = creditsCluster.centerX;
		label.y = creditsCluster.y + 4;

		coin.anchor.set(0.5);
		coin.y = creditsCluster.centerY + 12;
		coin.scale.x = coin.scale.y = Math.min(52 / coin.width, 52 / coin.height);

		this.creditsText = new Text(this.char.credits.toString(), this.style);
		this.creditsText.anchor.set(0, 0.5);
		this.creditsText.y = creditsCluster.centerY + 10;

		const centerCreditsValue = () => {
			this.fitTextToWidth(this.creditsText, creditsCluster.width - 100, 0.76);
			const gap = 14;
			const coinWidth = coin.width;
			const totalWidth = coinWidth + gap + this.creditsText.width;
			coin.x = creditsCluster.centerX - totalWidth / 2 + coinWidth / 2;
			this.creditsText.x = coin.x + coinWidth / 2 + gap;
		};
		centerCreditsValue();

		this.app.ticker.add(() => {
			const currentValue = Number.parseInt(this.creditsText.text, 10) || this.char.credits;
			const lerpValue = this.lerp(this.char.credits, currentValue, 0.5);
			this.creditsText.text = Math.round(lerpValue).toString();
			centerCreditsValue();
		});

		this.charRegionGraphics.addChild(panel);
		this.charRegionGraphics.addChild(trim);
		this.charRegionGraphics.addChild(label);
		this.charRegionGraphics.addChild(coin);
		this.charRegionGraphics.addChild(this.creditsText);
	}

	private setupClassSkillPanel() {
		const skillWell = SCENE_LAYOUT.game.skillWell;
		const skillContainer = new Container();
		const panel = new Graphics();
		const trim = new Graphics();
		const title = new Text('SKILL', this.panelTitleStyle);
		const skillGlow = new Graphics();
		const skillOff = new Sprite(getTexture('assets/skill_bar_empty.png'));
		const skillReady = new Sprite(getTexture('assets/skill_bar_full.png'));

		panel
			.roundRect(skillWell.x, skillWell.y, skillWell.width, skillWell.height, 24)
			.fill({ color: 0x150806, alpha: 0.88 })
			.stroke({ color: 0x94632f, alpha: 0.24, width: 3 });
		panel
			.roundRect(skillWell.x + 10, skillWell.y + 10, skillWell.width - 20, skillWell.height - 20, 20)
			.fill({ color: 0x090302, alpha: 0.72 })
			.stroke({ color: 0xe3bb73, alpha: 0.1, width: 2 });
		trim.roundRect(skillWell.x + 16, skillWell.y + 14, skillWell.width - 32, 16, 8).fill({ color: 0xf7d7a5, alpha: 0.06 });

		title.anchor.set(0.5, 0);
		title.x = skillWell.centerX;
		title.y = skillWell.y + 4;

		skillContainer.x = skillWell.centerX;
		skillContainer.y = skillWell.y + 98;
		skillContainer.eventMode = 'static';
		skillContainer.cursor = 'pointer';
		skillContainer.hitArea = new Rectangle(-skillWell.width / 2 + 12, -72, skillWell.width - 24, 112);

		skillGlow.circle(0, 0, 68).fill({ color: 0xf0912c, alpha: 0.1 });
		skillGlow.circle(0, 0, 48).fill({ color: 0x070302, alpha: 0.74 });

		skillOff.anchor.set(0.5);
		skillOff.scale.x = skillOff.scale.y = Math.min(118 / skillOff.width, 118 / skillOff.height);
		skillOff.alpha = 1;

		skillReady.anchor.set(0.5);
		skillReady.scale.x = skillReady.scale.y = Math.min(112 / skillReady.width, 112 / skillReady.height);
		skillReady.visible = false;

		this.skillStateText = new Text('Charge 0 / 3', this.panelNoteStyle);
		this.skillStateText.anchor.set(0.5, 0);
		this.skillStateText.x = skillWell.centerX;
		this.skillStateText.y = skillWell.y + 144;

		skillContainer.on('pointerdown', () => {
			if (
				(this.char.specialBar >= 3 && this._gameLogicService.state == GameStates.WAITING) ||
				this._gameLogicService.state == GameStates.WIN
			) {
				if (this._gameLogicService.state == GameStates.WIN) {
					for (const r of this.reel.reelArr) {
						r.container.children[this.reel.reelWinSlotPos].tint = 16777215;
					}
					this.reel.reelWinSlotPos = 0;
				}

				this.char.usingSkill = true;
				this.char.charContext.useClassSkill(this.char.charContext.target);

				if (this.char.charContext.target instanceof Char) {
					this.char.usingSkill = false;
					this.char.specialBar = 0;
				}
			}
		});

		this.app.ticker.add(() => {
			if (this.char.specialBar >= 3) {
				skillReady.visible = true;
				skillOff.alpha = 0.35;

				if (!this.changeSkillAlpha) {
					if (skillReady.alpha < 0.48) {
						this.changeSkillAlpha = !this.changeSkillAlpha;
					}
					skillReady.alpha -= 0.05;
				}

				if (this.changeSkillAlpha) {
					if (skillReady.alpha > 1.0) {
						this.changeSkillAlpha = !this.changeSkillAlpha;
					}
					skillReady.alpha += 0.05;
				}

				skillGlow.alpha = 0.25 + skillReady.alpha * 0.16;
				this.skillStateText.text = 'Ready to cast';
			} else {
				skillReady.visible = false;
				skillReady.alpha = 1;
				skillOff.alpha = 0.92;
				skillGlow.alpha = 0.92;
				this.skillStateText.text = `Charge ${this.char.specialBar} / 3`;
			}
		});

		skillContainer.addChild(skillGlow);
		skillContainer.addChild(skillOff);
		skillContainer.addChild(skillReady);

		this.charRegionGraphics.addChild(panel);
		this.charRegionGraphics.addChild(trim);
		this.charRegionGraphics.addChild(title);
		this.charRegionGraphics.addChild(skillContainer);
		this.charRegionGraphics.addChild(this.skillStateText);
	}

	private setupPotionPanel() {
		const potionWell = SCENE_LAYOUT.game.potionWell;
		const potionContainer = new Container();
		const panel = new Graphics();
		const trim = new Graphics();
		const potionAura = new Graphics();
		const title = new Text('POTION', this.panelTitleStyle);
		const priceCoin = new Sprite(getTexture('assets/coin.png'));
		const potion = new Sprite(getTexture('assets/potion_icon.png'));
		const healText = new Text(`Heals ${this._gameLogicService.POTION_HEALTH} life`, this.panelNoteStyle);

		panel
			.roundRect(potionWell.x, potionWell.y, potionWell.width, potionWell.height, 24)
			.fill({ color: 0x150806, alpha: 0.88 })
			.stroke({ color: 0x94632f, alpha: 0.24, width: 3 });
		panel
			.roundRect(potionWell.x + 10, potionWell.y + 10, potionWell.width - 20, potionWell.height - 20, 20)
			.fill({ color: 0x090302, alpha: 0.72 })
			.stroke({ color: 0xe3bb73, alpha: 0.1, width: 2 });
		trim.roundRect(potionWell.x + 16, potionWell.y + 14, potionWell.width - 32, 16, 8).fill({ color: 0xf7d7a5, alpha: 0.06 });

		title.anchor.set(0.5, 0);
		title.x = potionWell.centerX;
		title.y = potionWell.y + 6;

		potionContainer.x = potionWell.x;
		potionContainer.y = potionWell.y;
		potionContainer.cursor = 'pointer';
		potionContainer.eventMode = 'static';
		potionContainer.hitArea = new Rectangle(0, 0, potionWell.width, potionWell.height);

		potionAura.circle(76, 86, 48).fill({ color: 0x8b3d08, alpha: 0.12 });

		potion.anchor.set(0.5);
		potion.x = 76;
		potion.y = 86;
		potion.scale.x = potion.scale.y = Math.min(84 / potion.width, 84 / potion.height);

		priceCoin.anchor.set(0.5);
		priceCoin.x = 190;
		priceCoin.y = 80;
		priceCoin.scale.x = priceCoin.scale.y = Math.min(24 / priceCoin.width, 24 / priceCoin.height);

		this.potionPriceText = new Text(this._gameLogicService.POTION_PRICE.toString(), this.hudPriceStyle);
		this.potionPriceText.anchor.set(0, 0.5);
		this.potionPriceText.x = 208;
		this.potionPriceText.y = 80;

		healText.x = 138;
		healText.y = 98;
		this.fitTextToWidth(healText, potionWell.width - 152, 0.8);

		this.app.ticker.add(() => {
			const currentValue = Number.parseInt(this.potionPriceText.text, 10) || this._gameLogicService.POTION_PRICE;
			const lerpValue = this.lerp(this._gameLogicService.POTION_PRICE, currentValue, 0.51);
			this.potionPriceText.text = Math.round(lerpValue).toString();
			this.fitTextToWidth(this.potionPriceText, 82, 0.82);
			potionContainer.alpha = this.char.credits >= this._gameLogicService.POTION_PRICE ? 1 : 0.78;
		});

		potionContainer
			.on('pointerdown', () => {
				if (this.char.credits - this._gameLogicService.POTION_PRICE >= 0) {
					this.char.life += this._gameLogicService.POTION_HEALTH;
					this.char.credits -= this._gameLogicService.POTION_PRICE;
					if (this.char.life > this.char.totalLife) {
						this.char.life = this.char.totalLife;
					}
					this._gameLogicService.POTION_PRICE *= 2;
				}
			})
			.on('pointerover', () => {
				potionAura.alpha = 0.2;
			})
			.on('pointerout', () => {
				potionAura.alpha = 0.12;
			});

		potionContainer.addChild(potionAura);
		potionContainer.addChild(potion);
		potionContainer.addChild(priceCoin);
		potionContainer.addChild(this.potionPriceText);
		potionContainer.addChild(healText);

		this.charRegionGraphics.addChild(panel);
		this.charRegionGraphics.addChild(trim);
		this.charRegionGraphics.addChild(title);
		this.charRegionGraphics.addChild(potionContainer);
	}

	private scaleSpriteToCover(sprite: Sprite, targetWidth: number, targetHeight: number) {
		const textureWidth = sprite.texture.width || sprite.width;
		const textureHeight = sprite.texture.height || sprite.height;
		const scale = Math.max(targetWidth / textureWidth, targetHeight / textureHeight);
		sprite.scale.set(scale);
	}

	private fitTextToWidth(text: Text, maxWidth: number, minScale: number) {
		text.scale.set(1);
		if (text.width > maxWidth) {
			const nextScale = Math.max(minScale, maxWidth / text.width);
			text.scale.set(nextScale);
		}
	}

	public lerp(a1, a2, t) {
		return a1 * (1 - t) + a2 * t;
	}
}
