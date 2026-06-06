# Nim like Games Platform for Testing Gamer-Bots

<img src="public/logonew.png">

## Game Server  is the "Brain" of our project. 


We have written this `server.js` to be as readable as possible. 

It uses **Express** for the web server, **socket.io** for communications to  live dashboards, and the **vm** js virtual machine module to run student's Bots codes safely.

### 1. Prerequisites

If express not isntalled then in GitHub Codespace terminal run:
`npm install express ws`

---

###  Registration in Game Platform on start page

After Game platform started we may obtain address of working server and open index.html 

On Registration by  e-mail and writing Bot-Avatar Name  Gamer must copypast (or write) text of main  Bot function play() by pattern:
```javascript
// piles:     array of integers  (coins) representing the current state of the game
// forbidden: array of forbidden moves
// context:   { mode: CONFIG.mode, timeRemaining: player.timeBank } 
//                    CONFIG.mode can be "NORMAL" or "GIVEAWAY" (see rules for details)
//OUTPUTS: Return an object { pileIndex: target, count: N };
//For example { pileIndex: 0, count: 1 } represents Bot's  want to take 1 coin from pile 0 

function play(piles, forbidden, context) {
                                         // TO DO 
                                         // const target = piles.findIndex(p => p > 0);
                                         //  if(piles[target]== 1) N = 1;
                                         //  ....
                                         //   return { pileIndex: target, count: N }; 
}
```
---

### 2. Key Explanations about Game Server 

* **`vm.Script`**: This is like a "protective bubble." It runs the student's code, but if their code has an infinite loop (`while(true)`), the `timeout` setting pops the bubble and stops it before the server crashes.
* **`players` Object**: This is our database. It stays in the server's memory. If you restart the server, the "database" wipes clean (simplest way).
* **`broadcast`**: This sends a message to everyone who has the website open. This is how the "Live Dashboard" works.
* **`await new Promise(...)`**: This creates a "pause." Without this, the server would finish 1000 games in one second, and the pupils wouldn't see the emojis moving on the dashboard!

---

## Single Page Application (SPA) for client part of Game.

 This means we have one `index.html` file that uses simple JavaScript to "switch" between the **Registration** view and the **Dashboard** view.

### 1. The Stage: `public/index.html`

This file contains both the form for the bots and the "Arena" where the game happens.

### 2. The Style: `public/style.css`

We will use a clean "Dark Mode" game aesthetic that looks professional but uses very few lines of code.

### 3. The Logic: `public/script.js`

This script handles the connection to the server and updates the screen when a "MOVE" happens.

---

## Tips

For any contender their bot code is just a **string** being sent over the internet. On the server, we use `vm.Script` to turn that string back into "living" code. This is a  way  how servers obtains bot codes from gamers.

**To run this in your Codespace** just place files index.html, style.css, script.js in a `/public` folder and server.js in the root!

---

## Troubleshooting: the port is busy

If you see an error like `EADDRINUSE: address already in use :::3000` when running `node server.js`, it means that the port is in use by another process. Quick commands for finding and killing such a process:

- Show the process listening on port 3000:

```bash
lsof -i :3000 -sTCP:LISTEN -Pn
```

- Kill a process by PID (replace <PID> with the number found):

```bash
kill -9 <PID>
```

- Alternatively (convenient):

```bash
fuser -k 3000/tcp
```

- If you want to run the server on a different port temporarily:

```bash
PORT=3001 node server.js
```


