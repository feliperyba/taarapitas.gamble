import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DebuggerService } from '../../services/debugger.service';
import { DebugConfig, DebugSymbolValue, DebugPositionValue } from '../../model/interfaces';
import { REEL_VALUES, REEL_POSITIONS } from '../../model/reel-types';
import { DEBUG } from '../../services/game-config';

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
	public readonly reel1: DebugSymbolValue = { value: REEL_VALUES.X3BAR };
	public readonly reel2: DebugSymbolValue = { value: REEL_VALUES.X3BAR };
	public readonly reel3: DebugSymbolValue = { value: REEL_VALUES.X3BAR };
	public readonly pos1: DebugPositionValue = { value: REEL_POSITIONS.TOP };
	public readonly pos2: DebugPositionValue = { value: REEL_POSITIONS.TOP };
	public readonly pos3: DebugPositionValue = { value: REEL_POSITIONS.TOP };
	public credits: number = DEBUG.DEFAULT_CREDITS;
	public readonly reelArr: DebugSymbolValue[] = [];
	public readonly posArr: DebugPositionValue[] = [];
	public debugConfig: DebugConfig = this.buildDebugConfig();
	private readonly _debugService = inject(DebuggerService);

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
			this.debugConfig.credits = DEBUG.DEFAULT_CREDITS;
		}

		this._debugService.announceDebugConfig(this.debugConfig);
	}

	public setDebugConf(): void {
		this.debugConfig = this.buildDebugConfig();
		this._debugService.announceDebugConfig(this.debugConfig);
	}

	public checkCreditValue(value: number): void {
		if (value < DEBUG.MIN_CREDITS) {
			this.credits = DEBUG.MIN_CREDITS;
		} else if (value > DEBUG.MAX_CREDITS) {
			this.credits = DEBUG.MAX_CREDITS;
		}
	}

	private buildDebugConfig(): DebugConfig {
		return {
			enabledDebug: this.enableDebug,
			isFixed: this.isFixed,
			credits: this.credits,
			reels: [
				{ symbol: this.reel1, position: this.pos1 },
				{ symbol: this.reel2, position: this.pos2 },
				{ symbol: this.reel3, position: this.pos3 }
			]
		};
	}
}
