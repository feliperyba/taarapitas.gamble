import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { GameStates } from '../model/game-states';

export class GameStateMachine {
	private readonly stateSubject = new BehaviorSubject<GameStates>(GameStates.WAITING);
	public readonly state$ = this.stateSubject.asObservable().pipe(distinctUntilChanged());

	public getState(): GameStates {
		return this.stateSubject.value;
	}

	public transition(newState: GameStates): void {
		this.stateSubject.next(newState);
	}

	public onEnter(state: GameStates, callback: () => void): () => void {
		const subscription = this.state$.subscribe((current) => {
			if (current === state) {
				callback();
			}
		});
		return () => subscription.unsubscribe();
	}
}
