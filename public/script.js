let ws=null; // used for WebSocket connection to the server for real-time updates
const logo             = document.getElementById('logo');
const deadlineText     = document.getElementById('deadline-timer');
const regView          = document.getElementById('registration-view');
const dashView         = document.getElementById('dashboard-view');
const currentFightText = document.getElementById('current-fight');
const matchMatrixTable = document.getElementById('match-matrix');

let playerList = [];
let matchMatrix = [];
let playerCount = 0;
let myBotName = null; // Store this client's bot name after registration
let myBotCode = null; // Store this client's bot code after registration
let currentOpponentName = null; // Store current opponent's name
let currentOpponentCode = null; // Store current opponent's bot code
let playerBotCodes = {}; // Store all players' bot codes for reference

    ///  Establish WebSocket connection to the server . Called when this page loaded  to be ready to receive real-time updates about the tournament and game state
    function connect() {
                        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
                         ws = new WebSocket(`${protocol}://${window.location.host}`);

                                         //// -------- Listen for messages from the server ----
                          ws.onmessage = (event) => {
                                                     const data = JSON.parse(event.data);
                                                      handleServerEvent(data); // Main dispatcher for all incoming events from the server
                                         };

                                         //// -------- Display connection status ------------------------------------
                          ws.onopen    = () => {
                                              document.getElementById('status-text').innerText = "Connected to Arena";
                                         };
                          
    }

let tournamentState = "not_started"; // States: not_started, running, paused, ended         

        ////------------called when user clicks "Register" button, sends registration data to server via WebSocket and shows dashboard on success ----------------------
        function register() {
                                    const payload = {
                                                     type: 'REGISTER_PLAYER',
                                                     email: document.getElementById('email').value,
                                                     name:  document.getElementById('avatar-name').value,
                                                     code:  document.getElementById('bot-code').value
                                                    };
                                     if (ws && ws.readyState === WebSocket.OPEN) {
                                         ws.send(JSON.stringify(payload));
                                     }
                                     else {
                                           alert('WebSocket connection is not established');
                                     }
                                           
        }

var currenConfig = null;
let deadlineStartTime = null; // Will be calculated from delta when received from server
let clientRegistrationTime = null; // Client's local time when delta was received from server

        // Handle incoming messages from Game server  (events by web socket protocol ), called as callback from WebSocket.onmessage handle in connect() function -----------------------------------------
        function handleServerEvent(data) {
                                          if (data.type === "START_TIME_DELTA") {
                                                                           setDeadlineFromDelta(data.delta);
                                                                            return;
                                          }
                                                                      if (data.type === 'CONFIG' || data.type === 'CONFIG_UPDATED') {
                                                                          currenConfig = data.config;
                                                                          // Rebuild bot selector when config changes
                                                                          try { initializeBotCodeDropdown(); } catch (e) {}
                                                                          return;
                                                                      }
                                                                      if (data.type === 'PLAYERS_LIST') {
                                                                          playerList = data.players || {};
                                                                          // Update stored bot codes
                                                                          Object.values(playerList).forEach(p => {
                                                                             if (p && p.code) playerBotCodes[p.name] = p.code;
                                                                          });
                                                                          try { initializeBotCodeDropdown(); } catch (e) {}
                                                                          // Update leaderboard immediately when players list is received
                                                                          try { updateLeaderboard({ players: playerList, matchMatrix: matchMatrix }); } catch (e) {}
                                                                          return;
                                                                      }
                                          
                                          if (data.type === "REGISTRATION_SUCCESS") {
                                                                                myBotName = document.getElementById('avatar-name').value;
                                                                                myBotCode = document.getElementById('bot-code').value;
                                                                                playerBotCodes[myBotName] = myBotCode;
                                                                                logEvent(`✅ ${data.message}`);
                                                                                regView.classList.add('hidden');
                                                                                dashView.classList.remove('hidden');
                                                                                initializeBotCodeDropdown();
                                                                                 return;
                                          }
                                          
                                          if (data.type === "REGISTRATION_ERROR") {
                                                                                     alert(`Registration failed. ${data.message}`);
                                                                                      return;
                                          }
        
                                              if (data.type === "TOURNAMENT_STARTED") {
                                                                                        playerList = data.players;
                                                                                         playerCount = playerList.length;
                                                                                         //console.log("Tournament started! Players:", playerList);
                                                                                        matchMatrix = data.matchMatrix;
                                                                                         //console.log("Initial matrix:", matchMatrix);
                                                                                         
                                                                                         // Store all players' bot codes if provided
                                                                                         Object.values(playerList).forEach(p => {
                                                                                             if (p.code) {
                                                                                                 playerBotCodes[p.name] = p.code;
                                                                                             }
                                                                                         });
                                                                                         
                                                                                         renderMatchMatrix(matchMatrix, playerList);
                                                                                          if (deadlineText) 
                                                                                              deadlineText.innerText = "Contest starting now!";
                                                                                          
                                                                                          data.config && logEvent(`Tournament configuration: ${JSON.stringify(data.config)}`);
                                                                                           currenConfig = data.config;
                                                                                           tournamentState = "running";
    
                                                                                           beginContestLayouts();
                                              }

                                              if (data.type === "NEW_PLAYER") {
                                                                                logEvent(`New Challenger: ${data.name} has joined!`);
                                              }
                                              
                                              if (data.type === "CONTEST_PAUSED") {
                                                                                  tournamentState = "paused";
                                                                                  if (deadlineText) 
                                                                                      deadlineText.innerText = "Current Contest paused";
                                                                                  logEvent("⏸️  CONTEST PAUSED");
                                              }
                                              
                                              if (data.type === "CONTEST_RESUMED") {
                                                                                  tournamentState = "running";
                                                                                  if (deadlineText) 
                                                                                      deadlineText.innerText = "Current Contest resumed";
                                                                                  logEvent("▶️  CONTEST RESUMED");
                                              }
                                              
                                              if (data.type === "END") {
                                                                         tournamentState = "ended";
                                                                         updateLeaderboard(data);
                                                                         if (deadlineText) 
                                                                             deadlineText.innerText = "Current Contest ended now";
                                                                         logEvent("🏆 TOURNAMENT OVER!");
                                              }
                                              
                                              if (data.type === "NEW_CONTEST_BEGINS") {
                                                                                  tournamentState = "not_started";
                                                                                  if (deadlineText) 
                                                                                      deadlineText.innerText = "New Contest begins";
                                                                                  playerList = data.players;
                                                                                  playerCount = playerList.length;
                                                                                  matchMatrix = data.matchMatrix;
                                                                                  renderMatchMatrix(matchMatrix, playerList);
                                                                                  currenConfig = data.config;
                                                                                  logEvent("🎊 NEW CONTEST STARTS!");
                                              }
                                              
                                              if (data.type === "CURRENT_FIGHT") {
                                                                                  const fight = data.fight;
                                                                                   currentFightText.innerHTML = `⚔️ <strong>${fight.playerA}</strong> vs <strong>${fight.playerB}</strong> (Game ${fight.game}/${fight.totalGames})`;
                                                                                   
                                                                                   // Determine opponent name
                                                                                   currentOpponentName = (fight.playerA === myBotName) ? fight.playerB : fight.playerA;
                                                                                   currentOpponentCode = playerBotCodes[currentOpponentName] || null;
                                                                              }
                                              
                                              if (data.type === "MOVE") {
                                                                        updatePiles(data);
                                                                         logEvent(`${data.player} took ${data.count} coins, now state is ${data.piles}, (bonus: +${data.bonus}ms)`);
                                              }
                                              
                                              if (data.type === "MATCH_UPDATE") {
                                                                         updateLeaderboard(data);
                                                                         logEvent(`✅ Winner is ${data.winnerName}`);
                                              }
                                              
                                              if (data.type === "DISQUALIFIED_FOR_ERROR") {
                                                                                        logEvent(`❌ ${data.player} DISQUALIFIED for error: ${data.error}`);
                                              }
                                              
                                              if (data.type === "DISQUALIFIED_FOR_INVALID_MOVE") {
                                                                                             logEvent(`❌ ${data.player} DISQUALIFIED for invalid move: ${JSON.stringify(data.invalidMove)}`);
                                              }

                                              if (data.type === "HEARTBEAT_REQUEST") {
                                                  // Respond to server heartbeat to confirm connection
                                                  if (ws && ws.readyState === WebSocket.OPEN) {
                                                      ws.send(JSON.stringify({ type: "HEARTBEAT_RESPONSE" }));
                                                  }
                                                  let hljs = window.hljs;
                                                       hljs.highlightAll(); // Highlight any new code snippets in the log
                                                  return;
                                              }

        }

// Countdown timer for tournament start
var countdownInterval=null;
            // Function to set the tournament start deadline from time delta (milliseconds until tournament starts)
            function setDeadlineFromDelta(delta) {
                                                  clientRegistrationTime = Date.now(); // Record client's local time when delta was received
                                                  deadlineStartTime = clientRegistrationTime + delta; // Calculate tournament start time based on delta
                                                   if (countdownInterval)clearInterval(countdownInterval);
                                                   
                                                    updateDeadlineTimer();
                                                     countdownInterval = setInterval(updateDeadlineTimer, 1000);
            }
            
            // Legacy function for backwards compatibility (if needed)
            function setDeadline(startTimeValue) {
                                                  deadlineStartTime = new Date(startTimeValue);
                                                   if (countdownInterval)clearInterval(countdownInterval);
                                                   
                                                    updateDeadlineTimer();
                                                     countdownInterval = setInterval(updateDeadlineTimer, 1000);
            }
                // Function to update the countdown timer display and handle the transition to the tournament dashboard when the deadline is reached
                function updateDeadlineTimer() {
                                                if (!deadlineStartTime) return;
                                            
                                                    const msLeft = deadlineStartTime - Date.now();
                                                     if (msLeft <= 0) {
                                                         if (deadlineText) {
                                                             deadlineText.innerText = "Contest starting now!";
                                                         }
                                                          clearInterval(countdownInterval);
                                                           countdownInterval = null;
                                                            beginContestLayouts();
                                                             return;
                                                     }
                                            
                                                          const minutes = String(Math.floor(msLeft / 60000)).padStart(2, '0');
                                                          const seconds = String(Math.floor((msLeft % 60000) / 1000)).padStart(2, '0');
                                                           if (deadlineText) 
                                                               deadlineText.innerText = `Tournament starts in ${minutes}:${seconds}`;
                                                           
                }
                    // Function to transition the UI from the registration view to the tournament dashboard when the contest begins
                    function beginContestLayouts() {
                        if (countdownInterval) {
                                                clearInterval(countdownInterval);
                                                 countdownInterval = null;
                        } 
                        if (regView && dashView) {
                                                   regView.classList.add('hidden');
                                                   dashView.classList.remove('hidden');
                        }
                        if (deadlineText) {
                                           deadlineText.innerText = "Contest starting now!";
                        }
                        // Update "Live Battle" header with client's bot name
                        const liveBattleHeader = document.querySelector('.arena h2');
                        if (liveBattleHeader && myBotName) {
                            liveBattleHeader.innerHTML = `Live Battle - You are <strong>${myBotName}</strong>`;
                        }
                        logEvent("🏁 Contest begins!");
                    }



            // Function to update the piles display based on the current game state
            function updatePiles(data) {
                let forb = currenConfig.forbidden ;
                let piles = data.piles;
                let player = data.player.trim();
                let pilesString = "";
                 piles.forEach((count, index) => {
                                                  let pile = "🪙".repeat(count); 
                                                   let P = [...pile];
                                                    for(let k = 0; k < forb.length; k++){ 
                                                        let i=count-forb[k];
                                                         if(i>=0) P[i] = `💥`; //'❌';
                                                    }    
                                                    //console.log(P)  
                                                     pile = P.join('');     
                                                      if(index === data.movedFrom) {
                                                         pile +=  player;
                                                      }
                                                       pilesString +=  String(count).padStart(2) + ": " + pile + "\n";  
                                                 }
                              );
                const display = document.getElementById('piles-display');
                  display.innerHTML = pilesString;    
            }


            // Function to update the leaderboard and match matrix based on the latest tournament state
            function updateLeaderboard(data) {
                                              let players = data.players;
                                              let matrix  = data.matchMatrix;
                                                   updatePlayersList(data.players)
                                                   renderMatchMatrix(data.matchMatrix, data.players);
            }
                // Function to update the players list in the leaderboard table
                function updatePlayersList(players) {
                                                     const body = document.getElementById('leaderboard-body');
                                                      body.innerHTML = '';
                                                       Object.values(players)
                                                           .sort((a, b) => {
                                                               // Primary: score (desc)
                                                               if (b.score !== a.score) return b.score - a.score;
                                                               // Secondary: timeBank (desc). Ensure numeric comparison with fallback 0
                                                               const tbA = Number(a.timeBank) || 0;
                                                               const tbB = Number(b.timeBank) || 0;
                                                               return tbB - tbA;
                                                           })
                                                           .forEach(p => {
                                                               const relIR = p.nMoves ? ((Number(p.iRate) || 0) / Number(p.nMoves) * 100).toFixed(2) : '0.00';
                                                               body.innerHTML += `<tr><td>${p.name}</td><td>${p.score}</td><td>${p.timeBank}ms</td><td>${p.iRate || 0}</td><td>${relIR}%</td></tr>`;
                                                           });
                }
                // Function to render the match matrix table showing wins between players 
                function renderMatchMatrix(matrixEntries, players) {
                                                                    if (matchMatrixTable.innerHTML.trim() == "") generateMatchMatrixTable(players);
        
                                                                       const playersData = Object.values(players); 
                                                                        const M = playersData.length;
                                                                         for (let i = 0; i < M; i++) 
                                                                              for (let j = 0; j < M; j++) {    
                                                                                   let id = `${i}*${j}`
                                                                                    let cell = document.getElementById(id);
                                                                                    let winsA = matrixEntries[i][j].winsA;
                                                                                      cell.innerHTML = `${winsA}`;
                                                                              }        
                }
                    // Function to generate the initial empty match matrix table with given player names as headers               
                    function generateMatchMatrixTable(players) {
                                                                if (matchMatrixTable.innerHTML.trim() !== "") {
                                                                     console.log("Match Matrix Table exists already :", matchMatrixTable);
                                                                      return;           
                                                                 }
            
                                                                     const M = Object.keys(players).length;
                                                                     const playersData = Object.values(players); 
                                                                      const names = playersData    .map(p => p.name);
                                                                     let cells = '<center><table id="match-matrix-table">';
        
                                                                      cells += '<thead>';
                                                                       cells+= `<th> ⚡️ </th>`;
                                                                       for (let i = 0; i < M; i++) 
                                                                             cells+= `<th>${names[i]}</th>`;
                                                                        cells += '</thead>';
        
                                                                         cells += '<tbody>';
                                                                          for (let i = 0; i < M; i++) {    
                                                                               cells += '<tr>';
                                                                                cells += `<th>${names[i]}</th>`;
                                                                                 for (let j = 0; j < M; j++) {    
                                                                                      let id = `${i}*${j}`
                                                                                       cells += `<td><span id=${id}>?</span></td>`;
                                                                                 }
                                                                                  cells += '</tr>';
                                                                          }
                                                                           cells += '</tbody>';
        
                                                                            cells += '</table></center>';  
        
                                                                             matchMatrixTable.innerHTML = cells;
            
                    }
        

            // Utility function to log events in the game log  
            function logEvent(msg) {
                                    const log = document.getElementById('game-log');
                                     log.innerHTML = `<div>> ${msg}</div>` + log.innerHTML;
            }


// Example bot code for the coin game

let CodeExample = [
`
// piles:     array of integers  (coins) representing the current state of the game
// forbidden: array of forbidden moves
// context:   { mode: CONFIG.mode, timeRemaining: player.timeBank } 
//                    CONFIG.mode can be "NORMAL" or "GIVEAWAY" (see rules for details)
//OUTPUTS: Return an object { pileIndex: target, count: N };
//For example { pileIndex: 0, count: 1 } represents Bot's  want to take 1 coin from pile 0 
 
 function play(piles, forbidden, context) {
               let target =0, N=0; 
                target = piles.findIndex(p => p > 0);
                 if(piles[target]== 1) N = 1;
                 else                  N = 2;
                  return { pileIndex: target, count: N }; 
 }`,
 `
// piles:     array of integers  (coins) representing the current state of the game
// forbidden: array of forbidden moves
// context:   { mode: CONFIG.mode, timeRemaining: player.timeBank } 
//                    CONFIG.mode can be "NORMAL" or "GIVEAWAY" (see rules for details)
//OUTPUTS: Return an object { pileIndex: target, count: N };
//For example { pileIndex: 0, count: 1 } represents Bot's  want to take 1 coin from pile 0 
 
 function play(piles, forbidden, context) {
               // TO DO 
               let i=0, c=0;
                for(i; i<piles.length; i++)
                    if(piles[i]>0) break;
                
                if(piles[i]== 1) c = 1;
                else             c = 1;
                 return { pileIndex: i, count: c }; 
 }`,
 `
function play(piles, forbidden, context) {
             // TO DO 
             const target = piles.findIndex(p => p > 0); // find the first non-empty pile
             let NumberOfCoins = 0;
              if(piles[target]==1) NumberOfCoins=1;
              else                 NumberOfCoins=2;
               if (forbidden.includes(NumberOfCoins)) NumberOfCoins=1;   // if for example 2 is forbidden we take 1 coin
                return { pileIndex: target, count: NumberOfCoins }; 
}
//function play() INPUT: (piles, forbidden, context)
// piles:     array of integers  (coins) representing the current state of the game
// forbidden: array of forbidden moves
// context:   { mode: CONFIG.mode, timeRemaining: player.timeBank } 
//                    CONFIG.mode can be "NORMAL" or "GIVEAWAY" (see rules for details)
//function play() OUTPUT: Return an object { pileIndex: target, count: NumberOfCoins };
//For example { pileIndex: 0, count: 1 } represents Bot's  want to take 1 coin from pile with Index 0 
 `
]
 let NumOfCodeExamples= CodeExample.length;

// Initialize ws connection when page loads
// Initialize code syntax highlighting for bot code textarea
function initializeCodeHighlighting() {
    const botCodeInput = document.getElementById('bot-code');
    const pre          = document.getElementById('bot-code-highlight');
    const code         = document.getElementById('bot-code-highlight-content');
     if (!botCodeInput || !pre || !code) return;
        let exampleIndex = Math.random()*NumOfCodeExamples |0;
        botCodeInput.value = CodeExample[exampleIndex];
        code.textContent   = CodeExample[exampleIndex];

            // Update highlighting function
            function updateHighlighting() {
                let text = botCodeInput.value;
                
                // Highlight.js and overlay layout need a space at the end if the text ends in newline,
                // otherwise heights won't match and scrolling will be offset.
                if (text.endsWith('\n')) {
                    text += ' ';
                }
                
                code.textContent = text;
                
                // Apply highlight.js if available
                if (window.hljs) {
                    delete code.dataset.highlighted;
                    window.hljs.highlightElement(code);
                }
        
                // Align scrolling after content change
                pre.scrollTop = botCodeInput.scrollTop;
                pre.scrollLeft = botCodeInput.scrollLeft;
            }
            
            //----------- Synchronize scrolling
            botCodeInput.addEventListener('scroll', () => {
                pre.scrollTop = botCodeInput.scrollTop;
                pre.scrollLeft = botCodeInput.scrollLeft;
            });

            //------------ Support tab insertion
            botCodeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = botCodeInput.selectionStart;
                    const end = botCodeInput.selectionEnd;
                    const value = botCodeInput.value;
                    
                    // Insert 4 spaces at cursor position
                    botCodeInput.value = value.substring(0, start) + '    ' + value.substring(end);
                    
                    // Put caret at right position
                    botCodeInput.selectionStart = botCodeInput.selectionEnd = start + 4;
                    
                    updateHighlighting();
                }
            });

            //------------------------ Listen for input changes
            botCodeInput.addEventListener('input', updateHighlighting);
            botCodeInput.addEventListener('change', updateHighlighting);

        // Initial highlighting
        updateHighlighting();
}

// Initialize bot code dropdown selector
function initializeBotCodeDropdown() {
    const selector = document.getElementById('bot-code-selector');
    const viewer = document.getElementById('bot-code-viewer');
    const displayCode = document.getElementById('displayed-bot-code');
    const dropdownContainer = document.querySelector('.bot-code-dropdown');

    if (!selector || !dropdownContainer) return;

    function rebuildOptions() {
        selector.innerHTML = '';

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = '-- Open/Close Code --';
        selector.appendChild(defaultOpt);

        if (currenConfig && currenConfig.educational && playerList) {
            Object.values(playerList)
                .filter(p => p && p.name)
                .forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.name;
                    opt.textContent = p.name;
                    selector.appendChild(opt);
                });
        }
    }

    function updateVisibility() {
        const educationalMode = currenConfig && currenConfig.educational;
        if (educationalMode) {
            dropdownContainer.style.display = '';
           viewer.classList.remove("hidden");
        } else {
            dropdownContainer.style.display = 'none';
            viewer.classList.add('hidden');
            selector.value = '';
        }
    }

    rebuildOptions();
    updateVisibility();

    selector.onchange = (e) => {
                                const value = e.target.value;
                                viewer.classList.add('hidden');
                                 if (value) {
                                    const code = playerBotCodes[value];
                                     displayCode.textContent = code;
                                     viewer.classList.remove('hidden');
                                      delete displayCode.dataset.highlighted;
                                       window.hljs && window.hljs.highlightElement(displayCode);
                                 }
                                 else {
                                        //viewer.classList.add('hidden');
                                        displayCode.textContent = '';
                                      }
                               };
}

// Call initialization when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeCodeHighlighting();
});

connect();

