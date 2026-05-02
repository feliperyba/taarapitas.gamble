# Taarapita's Gamble

A roguelite slot machine built with Angular 21 and PixiJS 8.

[Play it here](https://feliperyba.github.io/taarapitas.gamble/)

The Chronicle of Henry of Livonia mentions Tharapita as the superior god of the Oeselians, also well known to Vironian tribes in northern Estonia. According to the chronicle, when crusaders invaded Vironia in 1220, there was a beautiful wooded hill where locals believed Tharapita was born and from which he flew to Saaremaa.

Now the mighty god has left. It's up to you to gamble your way through encounters against the Dark Elf lord.

---

## Quick Start

```
npm install
npm start
```

## How to Play

Spin the reels for 1 credit. Land a combination to earn credits and charge your skill bar. Miss everything? Take 5 damage.

### Pay Table

| Combination | Payout |
|---|---|
| 3 Dark Elf on top line | 2000 |
| 3 Dark Elf on center line | 1000 |
| 3 Dark Elf on bottom line | 4000 |
| 3 Minotaur on any line | 150 |
| Dark Elf + Minotaur on any line | 75 |
| 3x Goblins on any line | 50 |
| 2x Goblins on any line | 20 |
| Goblins on any line | 10 |
| Any Goblin combo on any line | 5 |

### Mechanics

- **Skill**: Land 3 wins to charge your skill. Free spin, no damage on loss. Each character uses it differently.
- **Potions**: Buy health potions. Price doubles every time you drink one.
- **Goal**: Survive as long as you can.

A debug panel lets you override reel values and credits for testing.

---

## Project Structure

```
src/
  app/                          Angular entry point & PixiJS canvas
  components/debug/             Debug panel (Angular component)
  services/                     Services & state management
    game-orchestrator.service   Game lifecycle & scene orchestration
    game-logic.service          Rules, payouts, skill & potion logic
    game-state-machine          Finite state machine (idle → spin → results → …)
    game-state.ts               Interface slices for dependency inversion
    game-config                 Tunable constants (potion price, boot timings)
    character-strategies.token  DI token for extensible character roster
    debugger.service            Debug state relay to Angular component
    game-over-overlay           Death screen
    pixi-bootstrapper           PixiJS app factory
  rendering/                    Asset loading, viewport & DPI scaling
  model/
    game-states.ts              Shared state constants
    char-select-handler.ts      Callback interface for character selection
    interfaces.ts               Shared types (SkillTarget, CharContext)
    math-utils.ts               Color mixing, array rotation
    pixi-helpers.ts             Text fitting, panel builder, gradient styles
    pixi-styles.ts              Drop shadow defaults, color re-exports
    reel.ts                     Reel data model & symbol layout
    reel-animator.ts            Spin animation (dynamic ticker, pre-cached layouts)
    reel-types.ts               Symbol & position constants (as const)
    constants/
      animation.ts              Durations, easings, pulse rates
      colors.ts                 Named color palette
      emitter.ts                Particle emitter configs
      gui-style.ts              HUD layout dimensions
      layout.ts                 Panel positions & sizes
      panel.ts                  Panel border & fill colors
      skill.ts                  Skill charge threshold
    char-module/
      char.ts                   Character model (signals: HP, credits, skill, rounds)
      char-strategy/            Per-class strategy pattern (Warrior, Berserker, Mage, Cleric)
      char-gui/
        char-gui.ts             HUD orchestrator (signal-driven, no polling)
        char-select-screen.ts   Character picker (DI-injected strategies)
        life-bar.ts             HP bar with damage trails
        skill-panel.ts          Skill charge display
        potion-panel.ts         Potion purchase button
        credits-display.ts      Credit counter with auto-fit text
        hero-crest.ts           Character portrait with damage flash
        screen-effects.ts       Facade for visual effects
        screen-shake-effects.ts Camera shake on hit
        screen-pulse-effects.ts Heal/skill glow (scoped filters, not full-stage)
        particle-effects.ts     Particle emitters (pre-allocated arrays)
    pay-module/
      pay-table.ts              Win detection & battle resolution
      pay-table-gui/            Pay table visual rows (GSAP-driven highlights)
      pay-table-strategy/       3 factory types (position, any-line, multi-value)
      win-highlighter.ts        Reel tinting on win
      combinations.ts           Pay combination constants
    gui-module/
      gui.ts                    Main game GUI (rails, buttons, state subscriptions)
      button.ts                 Reusable PixiJS button with destroy cleanup
```

---

## Credits

- Reel spin animation logic from the [PixiJS slots demo](https://pixijs.io/examples/#/demos/slots-demo.js)
- Character art by [Justin Nichol](https://www.patreon.com/justinnichol)
- All other images are original and not licensed for use, editing, or redistribution
