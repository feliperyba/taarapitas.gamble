import { NineSliceSprite, Rectangle, Texture, TextStyle, Container, Text } from 'pixi.js';

export class Button {
	public btnContainer = new Container();
	public Btn: NineSliceSprite;
	public btnText: Text;
	private disabled = false;

	constructor(
		private containerHeight: number,
		private containerWidth: number,
		private textureBtn: Texture,
		private textureBtnOver: Texture,
		private textureBtnDown: Texture,
		public text: string,
		private style: TextStyle
	) {
		this.btnContainer.hitArea = new Rectangle(0, 0, containerWidth, containerHeight);

		this.Btn = this.createButtonSprite(textureBtn);

		this.btnContainer
			.on('pointerover', () => {
				this.onButtonOver(this.Btn);
			})
			.on('pointerout', () => {
				this.onButtonOut(this.Btn);
			})
			.on('pointerdown', () => {
				this.onButtonDown(this.Btn);
			})
			.on('pointerup', () => {
				this.onButtonUp(this.Btn);
			})
			.on('pointerupoutside', () => {
				this.onButtonUp(this.Btn);
			});

		this.btnText = new Text(text, style);
		this.btnText.anchor.set(0.5);
		this.btnText.x = this.containerWidth / 2;
		this.btnText.y = this.containerHeight * 0.45;

		this.btnContainer.addChild(this.Btn);
		this.btnContainer.addChild(this.btnText);

		this.btnContainer.eventMode = 'static';
		this.btnContainer.cursor = 'pointer';
	}

	private createButtonSprite(texture: Texture): NineSliceSprite {
		return new NineSliceSprite({
			texture,
			width: this.containerWidth,
			height: this.containerHeight,
			leftWidth: 94,
			topHeight: 42,
			rightWidth: 94,
			bottomHeight: 76
		});
	}

	private onButtonDown(Btn: NineSliceSprite) {
		if (this.disabled) {
			return;
		}
		Btn.texture = this.textureBtnDown;
	}

	private onButtonUp(Btn: NineSliceSprite) {
		if (this.disabled) {
			return;
		}
		Btn.texture = this.textureBtn;
	}

	private onButtonOver(Btn: NineSliceSprite) {
		if (this.disabled) {
			return;
		}
		Btn.texture = this.textureBtnOver;
	}

	private onButtonOut(Btn: NineSliceSprite) {
		if (this.disabled) {
			return;
		}
		Btn.texture = this.textureBtn;
	}

	public setDisabled(disabled: boolean) {
		this.disabled = disabled;
		this.btnContainer.alpha = disabled ? 0.62 : 1;
		this.btnContainer.cursor = disabled ? 'default' : 'pointer';
		this.Btn.texture = disabled ? this.textureBtnDown : this.textureBtn;
		this.btnText.alpha = disabled ? 0.86 : 1;
	}
}
