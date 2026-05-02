import { APP_BASE_HREF, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { DebuggerService } from './services/debugger.service';
import { GameLogicService } from './services/game-logic.service';
import { GameOverOverlay } from './services/game-over-overlay';
import { GameStateMachine } from './services/game-state-machine';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    GameStateMachine,
    GameOverOverlay,
    GameLogicService,
    DebuggerService,
    { provide: APP_BASE_HREF, useValue: '/' },
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ]
})
  .catch(err => console.error(err));
