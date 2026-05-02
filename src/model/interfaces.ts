export type PayResult = number | null;

export type CharTargetType = 'Char' | 'Reel';

export interface DebugReelValue {
	value: string;
}

export interface DebugReel {
	symbol: DebugReelValue;
	position: DebugReelValue;
}

export interface DebugConfig {
	enabledDebug: boolean;
	isFixed: boolean;
	credits: number;
	reels: DebugReel[];
}
