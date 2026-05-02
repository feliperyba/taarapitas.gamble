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
  app/                          Angular entry point & bootstrapping
  components/debug/             Debug panel (Angular component)
  services/                     Game logic, state machine, config
  rendering/                    Asset loading, viewport, DPI scaling
  model/
    game-states.ts              Shared state enum (no circular deps)
    char-select-handler.ts      Callback interface for char selection
    interfaces.ts               Shared TypeScript types
    math-utils.ts               mixColor, arrayRotateOne
    pixi-helpers.ts             fitTextToWidth, buildPanelGraphics, gradient text styles
    pixi-styles.ts              Drop shadow defaults, color constants re-exports
    reel.ts / reel-animator.ts  Reel data & spin animation
    reel-types.ts               REEL_VALUES, REEL_POSITIONS enums
    constants/
      animation.ts              Durations, easings, pulse rates
      colors.ts                 COLOR_WHITE, COLOR_DAMAGE_FLASH, etc.
      emitter.ts                Particle emitter configs
      layout.ts                 Positions, sizes, offsets for all panels
      panel.ts                  Panel border/fill colors
      skill.ts                  SKILL_CHARGE_MAX
    char-module/
      char.ts                   Character model (HP, credits, battle resolution)
      char-strategy/            Generic CharStrategy<T> per character class
      char-gui/
        char-gui.ts             HUD orchestrator (life bar, skill, potion, credits)
        char-select-screen.ts   Character picker
        life-bar.ts             HP bar with damage trails
        skill-panel.ts          Skill charge display
        potion-panel.ts         Potion purchase button
        credits-display.ts      Credit counter
        hero-crest.ts           Character portrait
        screen-effects.ts       Facade for visual effects
        screen-shake-effects.ts Camera shake on hit
        screen-pulse-effects.ts Heal/skill glow pulses
        particle-effects.ts     Particle emitters
    pay-module/
      pay-table.ts              Win detection & battle resolution
      pay-table-gui/            Pay table visual rows
      pay-table-strategy/       3 factory functions (position, any-line, multi-value)
      win-highlighter.ts        Reel tinting on win
      combinations.ts          Pay combination enum
    gui-module/
      gui.ts                    Main game GUI layout (rails, pay table, buttons)
      button.ts                 PixiJS button component
```


## Credits

- Reel spin animation logic from the [PixiJS slots demo](https://pixijs.io/examples/#/demos/slots-demo.js)
- Character art by [Justin Nichol](https://www.patreon.com/justinnichol)
- All other images are original and not licensed for use, editing, or redistribution