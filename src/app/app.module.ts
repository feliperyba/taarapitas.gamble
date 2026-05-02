import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { APP_BASE_HREF, LocationStrategy, HashLocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { GameLogicService } from '../services/game-logic.service';
import { GameStateMachine } from '../services/game-state-machine';
import { GameOverOverlay } from '../services/game-over-overlay';
import { DebuggerService } from '../services/debugger.service';
@NgModule({
	imports: [BrowserModule, AppComponent],
	providers: [
		GameStateMachine,
		GameOverOverlay,
		GameLogicService,
		DebuggerService,
		{ provide: APP_BASE_HREF, useValue: '/' },
		{ provide: LocationStrategy, useClass: HashLocationStrategy }
	],
	bootstrap: [AppComponent]
})
export class AppModule {}
