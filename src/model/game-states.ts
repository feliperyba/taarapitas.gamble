export const GameStates = {
	WAITING: 'WAITING',
	START: 'START',
	ROLL: 'ROLL',
	RESULTS: 'RESULTS',
	WIN: 'WIN',
	LOSE: 'LOSE',
} as const;

export type GameStates = (typeof GameStates)[keyof typeof GameStates];
