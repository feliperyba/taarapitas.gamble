import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DebuggerService } from '../../services/debugger.service';
import { DebugConfig, DebugSymbolValue, DebugPositionValue } from '../../model/interfaces';
import { REEL_VALUES, REEL_POSITIONS } from '../../model/reel-types';

@Component({
	standalone: true,
	selector: 'app-debug',
	templateUrl: './debug.component.html',
	styleUrls: [ './debug.component.scss' ],
	imports: [CommonModule, FormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DebuggerComponent implements OnInit {
	public enableDebug = false;
	public isFixed = false;
	public readonly reel1: DebugSymbolValue = { value: REEL_VALUES.X3BAR };
	public readonly reel2: DebugSymbolValue = { value: REEL_VALUES.X3BAR };
	public readonly reel3: DebugSymbolValue = { value: REEL_VALUES.X3BAR };
	public readonly pos1: DebugPositionValue = { value: REEL_POSITIONS.TOP };
	public readonly pos2: DebugPositionValue = { value: REEL_POSITIONS.TOP };
	public readonly pos3: DebugPositionValue = { value: REEL_POSITIONS.TOP };
	public credits = 100;
	public readonly reelArr: DebugSymbolValue[] = [];
	public readonly posArr: DebugPositionValue[] = [];
	public debugConfig: DebugConfig = this.buildDebugConfig();
	private readonly _debugService = inject(DebuggerService);

	trackByIndex(index: number): number {
		return index;
	}

	ngOnInit(): void {
		this.reelArr.push(this.reel1, this.reel2, this.reel3);
		this.posArr.push(this.pos1, this.pos2, this.pos3);
	}

	public setReelValue(index: number, event: string): void {
		this.reelArr[index].value = event as `${REEL_VALUES}`;
	}

	public setPosValue(index: number, event: string): void {
		this.posArr[index].value = event as `${REEL_POSITIONS}`;
	}

	public setDebug(): void {
		this.debugConfig.enabledDebug = !this.enableDebug;

		if (this.debugConfig.enabledDebug === false) {
			this.debugConfig.isFixed = false;
			this.debugConfig.credits = 100;
		}

		this._debugService.announceDebugConfig(this.debugConfig);
	}

	public setDebugConf(): void {
		this.debugConfig = this.buildDebugConfig();
		this._debugService.announceDebugConfig(this.debugConfig);
	}

	public checkCreditValue(value: number): void {
		if (value < 1) {
			this.credits = 1;
		} else if (value > 5000) {
			this.credits = 5000;
		}
	}

	private buildDebugConfig(): DebugConfig {
		return {
			enabledDebug: this.enableDebug,
			isFixed: this.isFixed,
			credits: this.credits,
			reels: [
				Object.assign({}, { symbol: this.reel1, position: this.pos1 }),
				Object.assign({}, { symbol: this.reel2, position: this.pos2 }),
				Object.assign({}, { symbol: this.reel3, position: this.pos3 })
			]
		};
	}
}
