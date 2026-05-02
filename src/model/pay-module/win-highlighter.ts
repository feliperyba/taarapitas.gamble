import { Reel } from '../reel';
import { COMBINATIONS } from './combinations';
import { COLOR_WHITE, COLOR_WIN_HIGHLIGHT } from '../constants/colors';

export interface WinResult {
	combination: COMBINATIONS;
	positionIndex: number;
}

export function applyWinHighlight(reel: Reel, positionIndex: number): void {
	for (const r of reel.reelArr) {
		r.container.children[positionIndex].tint = COLOR_WIN_HIGHLIGHT;
	}
	reel.reelWinSlotPos = positionIndex;
}

export function clearWinHighlight(reel: Reel, positionIndex: number): void {
	for (const r of reel.reelArr) {
		r.container.children[positionIndex].tint = COLOR_WHITE;
	}
	reel.reelWinSlotPos = undefined;
}
