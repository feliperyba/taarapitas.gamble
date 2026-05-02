import { APP_BASE_HREF, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { CHARACTER_STRATEGIES } from './services/character-strategies.token';
import {
	WarriorClassStrategy,
	BerserkerClassStrategy,
	MageClassStrategy,
	ClericClassStrategy
} from './model/char-module/char-strategy/char-strategy';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: APP_BASE_HREF, useValue: '/' },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    {
      provide: CHARACTER_STRATEGIES,
      useFactory: () => [
        new WarriorClassStrategy(),
        new BerserkerClassStrategy(),
        new MageClassStrategy(),
        new ClericClassStrategy()
      ],
      multi: false
    }
  ]
})
  .catch(err => console.error(err));
