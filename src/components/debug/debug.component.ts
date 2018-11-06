import { Component, OnInit, ViewChild } from '@angular/core';
import { DebuggerService } from '../../services/debugger.service';

export enum REEL_POSITIONS {
	TOP = 1,
	CENTER = 2,
	BOTTOM = 3
}
export enum REEL_VALUES {
	x3BAR,
	BAR,
	x2BAR,
	SEVEN,
	CHERRY
}

@Component({
	selector: 'app-debug',
	templateUrl: './debug.component.html',
	styleUrls: [ './debug.component.scss' ]
})
export class DebuggerComponent implements OnInit {
	public enableDebug = false;
	public isFixed = false;
	public reel1: any = { value: 0 };
	public reel2: any = { value: 0 };
	public reel3: any = { value: 0 };
	public pos1: any = { value: 1 };
	public pos2: any = { value: 1 };
	public pos3: any = { value: 1 };
	public credits = 100;
	public reelArr = [];
	public posArr = [];
	public debugObj: any = {
		enabledDebug: this.enableDebug,
		isFixed: this.isFixed,
		credits: this.credits,
		reels: [
			Object.assign({}, { symbol: this.reel1, position: this.pos1 }),
			Object.assign({}, { symbol: this.reel2, position: this.pos2 }),
			Object.assign({}, { symbol: this.reel3, position: this.pos3 })
		]
	};
	constructor(private _debugService: DebuggerService) {}

	ngOnInit() {
		this.reelArr = [ this.reel1, this.reel2, this.reel3 ];
		this.posArr = [ this.pos1, this.pos2, this.pos3 ];
	}

	public setReelValue(index: any, event: any) {
		this.reelArr[index].value = event;
	}

	public setPosValue(index: any, event: any) {
		this.posArr[index].value = event;
	}

	public setDebug() {
		this.debugObj.enabledDebug = !this.enableDebug;

		if (this.debugObj.enabledDebug == false) {
			this.debugObj.isFixed = false;
			this.debugObj.credits = 100;
		}

		this._debugService.announceValue(this.debugObj);
	}

	public setDebugConf() {
		this.debugObj = {
			enabledDebug: this.enableDebug,
			isFixed: this.isFixed,
			credits: this.credits,
			reels: [
				Object.assign({}, { symbol: this.reel1, position: this.pos1 }),
				Object.assign({}, { symbol: this.reel2, position: this.pos2 }),
				Object.assign({}, { symbol: this.reel3, position: this.pos3 })
			]
		};
		this._debugService.announceValue(this.debugObj);
	}

	public checkCreditValue(value: any) {
		if (value < 1) {
			this.credits = 1;
		}
		if (value > 5000) {
			this.credits = 5000;
		}
	}
}
