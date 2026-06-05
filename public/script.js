let socket = null; // used for Socket.IO connection to the server for real-time updates
const logo             = document.getElementById('logo');
const deadlineText     = document.getElementById('deadline-timer');
const regView          = document.getElementById('registration-view');
const dashView         = document.getElementById('dashboard-view');
const currentFightText = document.getElementById('current-fight');
const matchMatrixTable = document.getElementById('match-matrix');

let playerList = [];
let matchMatrix = [];
let playerCount = 0;
let totalGamesPlanned = 0;
let totalGamesCompleted = 0;
let myBotName = null; // Store this client's bot name after registration
let myBotCode = null; // Store this client's bot code after registration
let currentOpponentName = null; // Store current opponent's name
let currentOpponentCode = null; // Store current opponent's bot code
let playerBotCodes = {}; // Store all players' bot codes for reference
let selectedAvatar = null;
var MATCH_CONFIG = null; // Current game configuration for the active match

const AVATAR_GRID_SIZE = 8;
const BOT_AVATARS = [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼',
    '🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔',
    '🐧','🦆','🦅','🦉','🦇','🐺','🐗','🐴',
    '🦄','🐝','🐌','🐙','🦕','🦖','🐳','🐬',
    '🐟','🐠','🐡','🐢','🦋','🐞','🐜','🦗',
    '🦚','🦜','🦢','🕊️','🦩','🦓','🦌','🦔',
    '🦦','🦥','🦨','🦡','🦘','🦃','🪲','🐚',
    '🐲','🐉','🦈','🦑','🦐','🦀','🧸','🦝'
];

    ///  Establish Socket.IO connection to the server. Called when this page loads to receive real-time tournament updates.
    function connect() {
                        socket = io();

                        socket.on('connect', () => {
                            document.getElementById('status-text').innerText = "Connected to Arena";
                            try {
                                if (socket && socket.connected) {
                                    socket.send({ type: 'VISIBILITY', state: document.visibilityState });
                                }
                            } catch (e) {}
                        });

                        socket.on('disconnect', () => {
                            document.getElementById('status-text').innerText = "Disconnected from Arena";
                        });

                        socket.on('message', (payload) => {
                            const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
                            handleServerEvent(data);
                        });

                        socket.on('connect_error', (err) => {
                            document.getElementById('status-text').innerText = `Connection error: ${err.message}`;
                        });
    }

// Notify server when tab visibility changes (helps explain background throttling)
document.addEventListener('visibilitychange', () => {
    try {
        if (socket && socket.connected) {
            socket.send({ type: 'VISIBILITY', state: document.visibilityState });
        }
    } catch (e) {}
});

let tournamentState = "not_started"; // States: not_started, running, paused, ended         

        ////------------called when user clicks "Register" button, sends registration data to server via WebSocket and shows dashboard on success ----------------------
        function register() {
                                    const email = document.getElementById('email').value.trim();
                                    const avatarName = document.getElementById('avatar-name').value.trim();
                                    const code = document.getElementById('bot-code').value;

                                    if (!email) {
                                        alert('Please enter your email to register.');
                                        return;
                                    }
                                    if (!avatarName) {
                                        alert('Please choose a bot avatar before entering the championship.');
                                        return;
                                    }
                                    if (!code || !code.trim()) {
                                        alert('Please enter your bot code before registering.');
                                        return;
                                    }

                                    const payload = {
                                                     type: 'REGISTER_PLAYER',
                                                     email,
                                                     name: avatarName,
                                                     code
                                    };
                                    if (socket && socket.connected) {
                                         socket.send(payload);
                                     }
                                     else {
                                           alert('Socket.IO connection is not established');
                                     }
                                           
        }

/*var MATCH_CONFIG = null;*/
let deadlineStartTime = null; // Will be calculated from delta when received from server
let clientRegistrationTime = null; // Client's local time when delta was received from server

        // Handle incoming messages from Game server  (events by web socket protocol ), called as callback from WebSocket.onmessage handle in connect() function -----------------------------------------
        function handleServerEvent(data) {
                                          if (data.type === "START_TIME_DELTA") {
                                                                           setDeadlineFromDelta(data.delta);
                                                                            return;
                                          }
                                                                      if (data.type === 'CONFIG' || data.type === 'CONFIG_UPDATED') {
                                                                          MATCH_CONFIG = data.config;
                                                                          // Rebuild bot selector when config changes
                                                                          try { initializeBotCodeDropdown(); } catch (e) {}
                                                                          return;
                                                                      }
                                                                      if (data.type === 'PLAYERS_LIST') {
                                                                          playerList = data.players || {};
                                                                          if (typeof data.totalGamesPlanned === 'number') {
                                                                              totalGamesPlanned = data.totalGamesPlanned;
                                                                          }
                                                                          if (typeof data.totalGamesCompleted === 'number') {
                                                                              totalGamesCompleted = data.totalGamesCompleted;
                                                                          }
                                                                          // Update stored bot codes
                                                                          Object.values(playerList).forEach(p => {
                                                                             if (p && p.code) playerBotCodes[p.name] = p.code;
                                                                          });
                                                                          try { initializeBotCodeDropdown(); } catch (e) {}
                                                                          try { updateAvatarPicker(); } catch (e) {}
                                                                          // Update leaderboard immediately when players list is received
                                                                          try { updateLeaderboard({ players: playerList, matchMatrix: matchMatrix }); } catch (e) {}
                                                                          updateProgressDisplay(totalGamesCompleted, totalGamesPlanned);
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
                                                                                         if (typeof data.totalGamesPlanned === 'number') {
                                                                                             totalGamesPlanned = data.totalGamesPlanned;
                                                                                         }
                                                                                         if (typeof data.totalGamesCompleted === 'number') {
                                                                                             totalGamesCompleted = data.totalGamesCompleted;
                                                                                         }
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
                                                                                          
                                                                                          updateProgressDisplay(totalGamesCompleted, totalGamesPlanned);
                                                                                          data.config && logEvent(`Tournament configuration: ${JSON.stringify(data.config)}`);
                                                                                           MATCH_CONFIG = data.config;
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
                                                                         if (typeof data.totalGamesPlanned === 'number') {
                                                                             totalGamesPlanned = data.totalGamesPlanned;
                                                                         }
                                                                         if (typeof data.totalGamesCompleted === 'number') {
                                                                             totalGamesCompleted = data.totalGamesCompleted;
                                                                         }
                                                                         updateLeaderboard(data);
                                                                         updateProgressDisplay(totalGamesCompleted, totalGamesPlanned);
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
                                                                                  if (typeof data.totalGamesPlanned === 'number') {
                                                                                      totalGamesPlanned = data.totalGamesPlanned;
                                                                                  }
                                                                                  if (typeof data.totalGamesCompleted === 'number') {
                                                                                      totalGamesCompleted = data.totalGamesCompleted;
                                                                                  }
                                                                                  matchMatrix = data.matchMatrix;
                                                                                  renderMatchMatrix(matchMatrix, playerList);
                                                                                  MATCH_CONFIG = data.config;
                                                                                  updateProgressDisplay(totalGamesCompleted, totalGamesPlanned);
                                                                                  logEvent("🎊 NEW CONTEST STARTS!");
                                              }
                                              
                                              if (data.type === "CURRENT_FIGHT") {
                                                                                  const fight = data.fight;
                                                                                  if (data.config) {
                                                                                      MATCH_CONFIG = data.config;
                                                                                  }
                                                                                   currentFightText.innerHTML = `⚔️ <strong>${fight.playerA}</strong> vs <strong>${fight.playerB}</strong> (Game ${fight.game}/${fight.totalGames})`;
                                                                                   if (typeof data.totalGamesPlanned === 'number') {
                                                                                       totalGamesPlanned = data.totalGamesPlanned;
                                                                                   }
                                                                                   if (typeof data.totalGamesCompleted === 'number') {
                                                                                       totalGamesCompleted = data.totalGamesCompleted;
                                                                                   }
                                                                                   updateProgressDisplay(totalGamesCompleted, totalGamesPlanned);
                                                                                   // Determine opponent name
                                                                                   currentOpponentName = (fight.playerA === myBotName) ? fight.playerB : fight.playerA;
                                                                                   currentOpponentCode = playerBotCodes[currentOpponentName] || null;
                                                                              }
                                              
                                              if (data.type === "MOVE") {
                                                                        drawUpdatePiles(data);
                                                                         logEvent(`${data.player} took ${data.count} coins, now state is ${data.piles}, (time: +${data.bonus}ms)`);
                                              }
                                              if (data.type === "SURRENDERED") {
                                                                        drawUpdatePiles(data);
                                                                         logEvent(`${data.player} surrendered in position: ${data.piles}, (time: +${data.bonus}ms)`);
                                              }
                                              
                                              if (data.type === "MATCH_UPDATE") {
                                                                                  updateLeaderboard(data);
                                                                                  totalGamesPlanned   = +data.totalGamesPlanned;
                                                                                  totalGamesCompleted = +data.totalGamesCompleted;
                                                                                   updateProgressDisplay(totalGamesCompleted, totalGamesPlanned);
                                                                                  let winnerMessage =`✅ Winner is ${data.winnerName}`
                                                                                   addWinnerToPiles(winnerMessage)
                                                                                    logEvent(winnerMessage);
                                              }
                                              
                                              if (data.type === "DISQUALIFIED_FOR_ERROR") {
                                                                                        logEvent(`❌ ${data.player} DISQUALIFIED for error: ${data.error} details: ${data.details}`);
                                                                                         drawUpdatePiles(data);
                                              }
                                              
                                              if (data.type === "DISQUALIFIED_FOR_INVALID_MOVE") {
                                                                                             logEvent(`❌ ${data.player} DISQUALIFIED for invalid move: ${JSON.stringify(data.invalidMove)}`);
                                                                                             drawUpdatePiles(data);
                                              }

                                              if (data.type === "HEARTBEAT_REQUEST") {
                                                  // Respond to server heartbeat to confirm connection
                                                  if (socket && socket.connected) {
                                                      socket.send({ type: "HEARTBEAT_RESPONSE" });
                                                  }
                                                  //let hljs = window.hljs;
                                                      // hljs.highlightAll(); // Highlight any new code snippets in the log

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

            function updateProgressDisplay(completed, planned) {
                        const progressEl = document.getElementById('game-progress');

                        const gamesCompleted = Number(completed) || 0;
                        const gamesPlanned = Number(planned) || 0;
                        const  percent = gamesPlanned > 0 ? ((gamesCompleted / gamesPlanned) * 100).toFixed(1) : ' 0.0';
                        const   displayText = `Games completed: ${gamesCompleted} / ${gamesPlanned} (${percent}%)`;
                                if (progressEl) {
                                    progressEl.innerText = displayText;
                                }
                                 //logEvent(`📊 Progress: ${displayText}`);
            }

            // Function to update the piles display based on the current game state
            function drawUpdatePiles(data) {
                let forb = MATCH_CONFIG.forbidden ;
                let move   = data.count;
                let piles  = data.piles;
                let piles_ = MATCH_CONFIG.piles;
                let player = data.player.trim();
                let pilesString = "";
                 piles.forEach((count, index) => {
                                                  let pile = "🪙".repeat(count); 
                                                  let emptySlots = piles_[index] - count;
                                                      if(emptySlots > 0) 
                                                          pile += "⚫️".repeat(emptySlots); // Add empty slot symbols to represent remaining capacity of the pile
                                                        
                                                       let P = [...pile];
                                                         if(index === data.movedFrom) {
                                                             P[count] = player;
                                                              if(forb.includes(move)){
                                                                P[count] = '💥';
                                                                P[count+1] = player;
                                                              }  
                                                              /*                                                            
                                                              for(let k = 0; k < forb.length; k++){ 
                                                                  let i=count-forb[k];
                                                                   if(i>=0) ; '❌'; //;
                                                               }
                                                              */    
                                                          }    
                                                     
                                                        //console.log(P)  
                                                          pile = P.join('');     
                                                           pilesString +=  String(count).padStart(2) + ": " + pile + "\n";  
                                                 }
                              );
                               let winnerMessage =`✅ Winner is `;
                               if(data.winnerName) 
                                    winnerMessage += data.winnerName;
                               else winnerMessage = "";

                                pilesString += winnerMessage;    
                const display = document.getElementById('piles-display');
                  display.innerHTML = pilesString;    
            }
            function addWinnerToPiles(winnerMessage){
                                                     const display = document.getElementById('piles-display');
                                                       display.innerHTML  += winnerMessage;    

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
                                                                                 // Secondary: timeBank (asc). Ensure numeric comparison with fallback 0
                                                                                 const tbA = Number(a.timeBank) || 0;
                                                                                 const tbB = Number(b.timeBank) || 0;
                                                                                  return tbA - tbB;
                                                           })
                                                           .forEach(p => {
                                                               const relIR = p.nMoves ? ((Number(p.iRate) || 0) / Number(p.nMoves) * 100).toFixed(1) : '0.0';
                                                               body.innerHTML += `<tr><td>${p.name}</td><td>${p.score}</td><td>${p.timeBank}ms</td><td>${relIR}%</td></tr>`;
                                                           });
                }

                function getPlayersArray(players) {
                    return Object.values(players)
                        .slice()
                        .sort((a, b) => (Number(a.idx) || 0) - (Number(b.idx) || 0));
                }

                // Function to render the match matrix table showing wins between players 
                function renderMatchMatrix(matrixEntries, players) {
                                                                       const playersData = getPlayersArray(players);
                                                                       const  M = playersData.length;
                                                                       const  tableExists = matchMatrixTable.querySelector('table');
                                                                       const   rowCount = tableExists ? matchMatrixTable.querySelectorAll('tbody tr').length     : 0;
                                                                       const   colCount = tableExists ? matchMatrixTable.querySelectorAll('thead th').length - 1 : 0;
                                                                        if (!tableExists || rowCount !== M /*|| colCount !== M*/) {
                                                                           generateMatchMatrixTable(players);
                                                                        }

                                                                         for (let i = 0; i < M; i++) {
                                                                             for (let j = 0; j < M; j++) {
                                                                                  if (i === j) continue; // Skip diagonal
                                                                                 let id = `${i}*${j}`;
                                                                                  let cell = document.getElementById(id);
                                                                                   let  winsA = "."
                                                                                         if(matrixEntries /*&& matrixEntries[i] && matrixEntries[i][j] */){
                                                                                            winsA = matrixEntries[i][j].winsA;
                                                                                             if (cell) 
                                                                                                 cell.innerHTML = `${winsA}`;
                                                                                         }       
                                                                                  
                                                                             }
                                                                         }
                }
                    // Function to generate the initial empty match matrix table with given player names as headers               
                    function generateMatchMatrixTable(players) {
                                                                     const playersData = getPlayersArray(players);
                                                                     const M = playersData.length;
                                                                     let cells = '<center><table id="match-matrix-table">';

                                                                      cells += '<thead>';
                                                                       cells += `<th> ⚡️ </th>`;
                                                                        for (let i = 0; i < M; i++) 
                                                                              cells += `<th>${playersData[i].name}</th>`;
                                                                         cells += '</thead>';
 
                                                                          cells += '<tbody>';
                                                                           for (let i = 0; i < M; i++) {    
                                                                                cells += '<tr>';
                                                                                 cells += `<th>${playersData[i].name}</th>`;
                                                                                  for (let j = 0; j < M; j++) {    
                                                                                       let id = `${i}*${j}`;
                                                                                        let cellContent = (i === j) ? '—' : '0'; 
                                                                                         cells += `<td><span id="${id}">${cellContent}</span></td>`;
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
`function play(piles, forbidden, context) {
    let target = piles.findIndex(p => p > 0);
     let count = target >= 0 && !forbidden.includes(1) ? 1 : 1;
      return { pileIndex: target, count: count };
}`,
`function play(piles, forbidden, context) {
    let target = piles.findIndex(p => p > 0);
    let count = 1;
     if (target >= 0 && piles[target] > 1 && !forbidden.includes(2)) {
        count = 2;
     }
      return { pileIndex: target, count: count };
}`,
`function play(piles, forbidden, context) {
    let target = piles.findIndex(p => p > 0);
    let count = 1;
     if (target >= 0 && piles[target] > 2 && !forbidden.includes(3)) {
        count = 3;
     }
    return { pileIndex: target, count: count };
}`
];
 let NumOfCodeExamples= CodeExample.length;

// Initialize ws connection when page loads
// Initialize code syntax highlighting for bot code textarea
function initializeCodeHighlighting() {
    const botCodeInput = document.getElementById('bot-code');
    const pre          = document.getElementById('bot-code-highlight');
    const code         = document.getElementById('bot-code-highlight-content');
     if (!botCodeInput || !pre || !code) return;

        let exampleIndex = Math.random()*NumOfCodeExamples |0;
         let codeText = CodeExample[exampleIndex];
          botCodeInput.value = codeText;
          code.textContent   = codeText;

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

        if (MATCH_CONFIG && MATCH_CONFIG.educational && playerList) {
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
        const educationalMode = MATCH_CONFIG && MATCH_CONFIG.educational;
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

// Avatar picker support functions
function getUsedAvatars() {
    return new Set(Object.values(playerList)
        .filter(p => p && p.name)
        .map(p => p.name.trim())
        .filter(Boolean)
    );
}

function buildAvatarPicker() {
    const picker = document.getElementById('avatar-picker');
     if (!picker) return;

         picker.innerHTML = '';
     
         const usedAvatars = getUsedAvatars();
         const table = document.createElement('table');
          table.className = 'avatar-grid';
     
          for (let row = 0; row < AVATAR_GRID_SIZE; row++) {
              const tr = document.createElement('tr');
              for (let col = 0; col < AVATAR_GRID_SIZE; col++) {
                  const index = row * AVATAR_GRID_SIZE + col;
                  const avatar = BOT_AVATARS[index] || '';
                  const td = document.createElement('td');
                   td.className = 'avatar-cell';
                  const button = document.createElement('button');
                   button.type = 'button';
                   button.className = 'avatar-option';
                   button.innerText = avatar;
                   button.title = avatar ? `Select ${avatar} as your bot avatar` : '';
                   button.dataset.avatar = avatar;
                    if (!avatar || usedAvatars.has(avatar)) {
                        button.disabled = true;
                        button.classList.add('avatar-unavailable');
                    }
                    if (selectedAvatar === avatar) {
                        button.classList.add('avatar-selected');
                    }
                                     //------------------------------ Handle avatar selection  
                    button.onclick = () => selectAvatar(avatar);
                     td.appendChild(button);
                      tr.appendChild(td);
              }
              table.appendChild(tr);
          }
           picker.appendChild(table);
}

function selectAvatar(avatar) {
    const usedAvatars = getUsedAvatars();
    if (usedAvatars.has(avatar)) {
        alert('This avatar is already taken in the current tournament. Please choose another one.');
        return;
    }
    selectedAvatar = avatar;
    document.getElementById('avatar-name').value = avatar;
    //document.getElementById('avatar-picker-help').innerText = `Selected: ${avatar}. This symbol will be your bot name.`;
    updateAvatarPicker();
}

function updateAvatarPicker() {
    buildAvatarPicker();
    //const help = document.getElementById('avatar-picker-help');
    //const usedCount = getUsedAvatars().size;
    //if (help) {
    //    help.innerText = selectedAvatar
    //        ? `Selected: ${selectedAvatar}. This symbol will be your bot name.`
    //        : `Choose one cheerful symbol. ${usedCount} avatars are already taken in this tournament.`;
    //}
}

// Call initialization when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeCodeHighlighting();
    initializeAvatarPicker();
    initializeGameLogToggle();
});

function initializeAvatarPicker() {
    selectedAvatar = null;
    buildAvatarPicker();
}

function initializeGameLogToggle() {
    const toggle = document.getElementById('toggle-game-log');
    const gameLog = document.getElementById('game-log');
    const label = document.getElementById('toggle-game-log-label');
    if (!toggle || !gameLog || !label) return;

    gameLog.classList.add('collapsed');
    toggle.checked = false;
    label.textContent = 'Show Game Log';

    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            gameLog.classList.remove('collapsed');
            label.textContent = 'Hide Game Log';
        } else {
            gameLog.classList.add('collapsed');
            label.textContent = 'Show Game Log';
        }
    });
}

// Initialize Video Intro
function initializeVideoIntro() {
    const videoContainer = document.getElementById('video-intro-container');
    const introVideo = document.getElementById('intro-video');
    const logoElement = document.getElementById('logo');
    
    if (!videoContainer || !introVideo) return;
    
    let playCount = 0; // Track how many times the video has played
    const maxPlays = 2; // Video should play twice
    let isPlayingReverse = false; // Track if we're playing in reverse
    let reverseAnimationId = null; // Store animation frame ID
    
    // Function to calculate precise logo position for scaling
    function calculateLogoTransform() {
        if (!logoElement) return { x: 0, y: 0 };
        
        const logoRect = logoElement.getBoundingClientRect();
        
        // Center of viewport (where video starts)
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;
        
        // Center of logo element
        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;
        
        // Calculate translation from viewport center to logo center
        const translateX = logoCenterX - viewportCenterX;
        const translateY = logoCenterY - viewportCenterY;
        
        return { x: translateX, y: translateY };
    }
    
    // Function to play video in reverse with optimized performance
    function playReverse() {
        isPlayingReverse = true;
        introVideo.pause();
        
        if (!introVideo.duration || !isFinite(introVideo.duration)) {
            // Video duration not ready, try again
            setTimeout(playReverse, 100);
            return;
        }
        
        const videoDuration = introVideo.duration;
        const reverseDuration = 2000; // 2 seconds for reverse playback
        const startTime = performance.now();
        let lastUpdate = startTime;
        
        function reverseFrame(currentTime) {
            // Only update every 40ms to reduce CPU usage (still smooth at ~25fps)
            if (currentTime - lastUpdate < 40) {
                reverseAnimationId = requestAnimationFrame(reverseFrame);
                return;
            }
            lastUpdate = currentTime;
            
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / reverseDuration, 1);
            
            // Calculate new playback position (going backward from end to start)
            const newTime = Math.max(0, videoDuration - (progress * videoDuration));
            introVideo.currentTime = newTime;
            
            if (progress < 1) {
                reverseAnimationId = requestAnimationFrame(reverseFrame);
            } else {
                // Reverse playback finished, start dissolve animation
                playCount++;
                
                // Calculate logo position and set CSS variables
                const logoTransform = calculateLogoTransform();
                document.documentElement.style.setProperty('--logo-translate-x', `${logoTransform.x}px`);
                document.documentElement.style.setProperty('--logo-translate-y', `${logoTransform.y}px`);
                
                // Apply dissolve animation
                introVideo.classList.add('dissolve');
                
                // Hide after animation completes
                setTimeout(() => {
                    videoContainer.classList.add('hidden');
                    regView.classList.remove('hidden');
                }, 1500); // Match the CSS transition duration
            }
        }
        
        reverseAnimationId = requestAnimationFrame(reverseFrame);
    }
    
    // Handle video end (normal forward playback)
    introVideo.addEventListener('ended', () => {
        if (!isPlayingReverse) {
            playCount++;
            
            if (playCount < maxPlays) {
                // Play the video in reverse on second playback
                playReverse();
            } else {
                // This shouldn't happen with our logic, but just in case
                videoContainer.classList.add('hidden');
                regView.classList.remove('hidden');
            }
        }
    });
    
    // Handle video errors
    introVideo.addEventListener('error', () => {
        console.error('Video failed to load. Skipping intro.');
        if (reverseAnimationId) cancelAnimationFrame(reverseAnimationId);
        videoContainer.classList.add('hidden');
        regView.classList.remove('hidden');
    });
    
    // Start playing the video normally
    introVideo.play().catch(err => {
        console.error('Error playing video:', err);
        if (reverseAnimationId) cancelAnimationFrame(reverseAnimationId);
        videoContainer.classList.add('hidden');
        regView.classList.remove('hidden');
    });
}

// Call video intro when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeCodeHighlighting();
    initializeAvatarPicker();
    initializeGameLogToggle();
    initializeVideoIntro();
});

connect();

