# Taarapita´s Gamble
RogueLite Slot Machine game with Pixi.JS and Angular

 [You can play it online here!](https://feliperyba.github.io/taarapitas.gamble/)

The Chronicle of Henry of Livonia mentions Tharapita as the superior god of the Oeselians (inhabitants of Saaremaa), also well known to Vironian tribes in northern Estonia. According to the chronicle, when the crusaders invaded Vironia in 1220, there was a beautiful wooded hill in Vironia, where locals believe Tharapita was born and from which he flew to Saaremaa. 

Now since the mighty God has left, is upon to you to complete his task and Gamble new adventures against the Dark Elf lord.
Choose from 4 different characteres, wich one with your own unique abilities and test your mighty ( and luck ) agaist your enemies.

# Installation

```
npm install

npm run start
```

# Game Design and Rules
This is game is based on the main principles of a slot machine game. You take one credit to spin the reels and if you land any combination, you'll earn credits and fill your special bar. If none combination was landed, you´ll take 5 hit points.

The possibles combinatios are:

- 3 DARK ELF symbols on top line 2000 
- 3 DARK ELF symbols on center line 1000 
- 3 DARK ELF symbols on bottom line 4000 
- 3 MINOTAUR symbols on any line 150 
- Any combination of DARK ELF and MINOTAUR on any line 75 
- 3 3xGOBLINS symbols on any line 50 
- 3 2xGOBLINS symbols on any line 20 
- 3 GOBLINS symbols on any line 10 
- Combination of any GOBLINS symbols on any line 5 

If you strike 3 wins, your skill ability will be ready to use. This skill does not cost any credits and if you lose the spin, you´ll not lose any point of life.

Also, there´s a possibility to buy health potions... for the right price. Each time you use this, the price on the potion will double.

The main goal is to survive as much as you can. 
Some characters makes use of the skill into then and other make it to the reel. Take a look and read each description :

For test reasons, I´ve made a debug section where you can test specific land positions on each reel and also add credits to you character

# Credits
- Reel spin animation logic was taken from [PixiJS](https://pixijs.io/examples/#/demos/slots-demo.js)
- The Symbols and Character are from [Justin Nichol](https://www.patreon.com/justinnichol). (Support the guy, he´s good)
- The other Images are all pre owned and edited by me and you do not have the rights to :
  - Use
  - Edit
  - Redistribute