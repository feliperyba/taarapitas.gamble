import { Injectable } from '@angular/core';
import { GameStates } from './game-logic.service';

@Injectable()
export class GameStateMachine {
	private currentState: GameStates = GameStates.WAITING;
	private readonly listeners: Map<GameStates, Set<() => void>> = new Map();

	public getState(): GameStates {
		return this.currentState;
	}

	public transition(newState: GameStates): void {
		if (this.currentState === newState) return;

		this.currentState = newState;
		const listeners = this.listeners.get(newState);

		if (listeners) {
			listeners.forEach(fn => fn());
		}
	}

	public onEnter(state: GameStates, callback: () => void): () => void {
		if (!this.listeners.has(state)) {
			this.listeners.set(state, new Set());
		}

		const set = this.listeners.get(state)!;
		set.add(callback);
		
		return () => set.delete(callback);
	}
}
