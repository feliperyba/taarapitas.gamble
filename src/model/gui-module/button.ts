import { Component, OnInit, ViewChild } from '@angular/core';
import { Sprite, Application, Rectangle, Texture, TextStyle, Graphics, Container, DisplayObject, Text } from 'pixi.js';

declare var PIXI: any;

export class Button {
	public btnContainer = new Container();
	public Btn: Sprite;
	public btnText: Text;

	constructor(
		private containerHeight: number,
		private containerWidth: number,
		private textureBtn: Texture,
		private textureBtnOver: Texture,
		private textureBtnDown: Texture,
		public text: string,
		private style: TextStyle
	) {
		this.btnContainer.width = containerWidth;
		this.btnContainer.height = containerHeight;

		this.Btn = new Sprite(textureBtn);
		this.Btn.scale.x = this.Btn.scale.y = Math.min(
			containerWidth / this.Btn.width,
			containerHeight / this.Btn.height
		);
		this.Btn.x = this.btnContainer.width / 2 - this.Btn.width / 4 - 8;
		this.Btn.y = this.btnContainer.height / 2 - this.Btn.height / 4;

		this.btnContainer
			.on('mouseover', () => {
				this.onButtonOver(this.Btn);
			})
			.on('mouseout', () => {
				this.onButtonOut(this.Btn);
			})
			.on('mousedown', () => {
				this.onButtonDown(this.Btn);
			})
			.on('mouseup', () => {
				this.onButtonUp(this.Btn);
			});

		this.btnText = new Text(text, style);
		this.btnText.x = this.btnContainer.width / 2;
		this.btnText.y = this.btnContainer.height / 2;

		this.btnContainer.addChild(this.Btn);
		this.btnContainer.addChild(this.btnText);

		this.btnContainer.interactive = true;
		this.btnContainer.buttonMode = true;
	}

	private onButtonDown(Btn: Sprite) {
		Btn.texture = this.textureBtnDown;
	}

	private onButtonUp(Btn: Sprite) {
		Btn.texture = this.textureBtn;
	}

	private onButtonOver(Btn: Sprite) {
		Btn.texture = this.textureBtnOver;
	}

	private onButtonOut(Btn: Sprite) {
		Btn.texture = this.textureBtn;
	}
}
