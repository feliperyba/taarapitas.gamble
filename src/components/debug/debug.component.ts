import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DebuggerService } from '../../services/debugger.service';
import { DebugConfig, DebugReelValue } from '../../model/interfaces';

@Component({
	standalone: true,
	selector: 'app-debug',
	templateUrl: './debug.component.html',
	styleUrls: [ './debug.component.scss' ],
	imports: [FormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DebuggerComponent implements OnInit {
	public enableDebug = false;
	public isFixed = false;
	public readonly reel1: DebugReelValue = { value: 'X3BAR' };
	public readonly reel2: DebugReelValue = { value: 'X3BAR' };
	public readonly reel3: DebugReelValue = { value: 'X3BAR' };
	public readonly pos1: DebugReelValue = { value: 'TOP' };
	public readonly pos2: DebugReelValue = { value: 'TOP' };
	public readonly pos3: DebugReelValue = { value: 'TOP' };
	public credits = 100;
	public readonly reelArr: DebugReelValue[] = [];
	public readonly posArr: DebugReelValue[] = [];
	public debugConfig: DebugConfig = {
		enabledDebug: this.enableDebug,
		isFixed: this.isFixed,
		credits: this.credits,
		reels: [
			Object.assign({}, { symbol: this.reel1, position: this.pos1 }),
			Object.assign({}, { symbol: this.reel2, position: this.pos2 }),
			Object.assign({}, { symbol: this.reel3, position: this.pos3 })
		]
	};
	private readonly _debugService = inject(DebuggerService);

	ngOnInit() {
		this.reelArr.push(this.reel1, this.reel2, this.reel3);
		this.posArr.push(this.pos1, this.pos2, this.pos3);
	}

	public setReelValue(index: number, event: string) {
		this.reelArr[index].value = event;
	}

	public setPosValue(index: number, event: string) {
		this.posArr[index].value = event;
	}

	public setDebug() {
		this.debugConfig.enabledDebug = !this.enableDebug;

		if (this.debugConfig.enabledDebug === false) {
			this.debugConfig.isFixed = false;
			this.debugConfig.credits = 100;
		}

		this._debugService.announceValue(this.debugConfig);
	}

	public setDebugConf() {
		this.debugConfig = {
			enabledDebug: this.enableDebug,
			isFixed: this.isFixed,
			credits: this.credits,
			reels: [
				Object.assign({}, { symbol: this.reel1, position: this.pos1 }),
				Object.assign({}, { symbol: this.reel2, position: this.pos2 }),
				Object.assign({}, { symbol: this.reel3, position: this.pos3 })
			]
		};
		this._debugService.announceValue(this.debugConfig);
	}

	public checkCreditValue(value: number) {
		if (value < 1) {
			this.credits = 1;
		}
		if (value > 5000) {
			this.credits = 5000;
		}
	}
}
