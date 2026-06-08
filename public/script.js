let socket = null; // used for Socket.IO connection to the server for real-time updates
const logo             = document.getElementById('logo');
const deadlineText     = document.getElementById('deadline-timer');
const regView          = document.getElementById('registration-view');
const dashView         = document.getElementById('dashboard-view');
const currentFightText = document.getElementById('current-fight');
const matchMatrixTable = document.getElementById('match-matrix');

//console.log('at start of script.js logo element rect:', logo ? logo.getBoundingClientRect() : ' #logo element not found');

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

// Store Grundy cache and previous move state for displaying game analysis
let currentGrundyCache = []; // Array of Grundy values for each pile size
let previousPlayer = { name: "?", pileIndex: null, position: null }; // Track previous player's position
let lastXorSum = null; // Track last XOR-sum for indicator

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
                                                                          // Update Grundy cache if provided (Educational mode)
                                                                          if (data.grundyCache) {
                                                                              currentGrundyCache = data.grundyCache;
                                                                          }
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
                                                                                         
                                                                                         // Store Grundy cache if provided (Educational mode)
                                                                                         if (data.grundyValues) {
                                                                                             currentGrundyCache = data.grundyValues;
                                                                                         }
                                                                                         
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
                                                                                  // Store Grundy cache if provided (Educational mode)
                                                                                  if (data.grundyValues) {
                                                                                      currentGrundyCache = data.grundyValues;
                                                                                  }
                                                                                  // Reset previous player state for new game
                                                                                  previousPlayer = { name: "?", pileIndex: null, position: null };
                                                                                  lastXorSum = null;
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
                let winner = "";  
                 if(!data.winnerName)winner = ""; 
                 else                winner = data.winnerName.trim();
                let pilesString = "";
                
                // Generate XOR indicator
                const xorIndicator = (data.xorsum === 0) ? '👍' : '👎🏿'; //👍👎🏿 
                const playerDisplay = `${player}${xorIndicator}`;
                
                // Store current player for next iteration
                const currentPlayer = { name: player, pileIndex: data.movedFrom, position: piles[data.movedFrom] };
                
                 piles.forEach((count, index) => {
                                                  // Create a visual representation of the pile with coins and forbidden move indicators
                                                  let count0 = piles_[index];
                                                   let P = Array(count0).fill("⚫️");
                                                    for(let i=0; i<count0; i++)
                                                        if(i<count){
                                                          if(forb.includes(count-i))P[i] = "🚷"; // 👣🌵🚷⚠️🔚🟤"<span class='forbidden'>🪙</span>" // "⚫️"; // ; // Mark coins that would be taken by a forbidden move with strikethrough  // '❌'; //; '💥'
                                                          else                      P[i] = "🪙"; //"<span class='valid'>🪙</span>";
                                                        }     
                                                   // Show previous player if they were in a different pile or if this is a different move
                                                   if(index === previousPlayer.pileIndex)
                                                      if(index !== data.movedFrom) P[previousPlayer.position  ] = previousPlayer.name ;
                                                      else                         P[previousPlayer.position-1] = previousPlayer.name ; //dumb hack
                                                        
                                                   // If this pile was the one just changed by player, write player name or mark the player that take looser move with strikethrough to indicate he is looser
                                                   if(index === data.movedFrom)
                                                      if(data.xorsum >=0 ) P[count] =  playerDisplay; //`<span class='valid'>${player}</span>`;
                                                      else                 {P[count-1] =   `💥`, P[count] =  playerDisplay ;}//`<span class='forbidden'>${player}</span>` ;
                                                   
                                                   

                                                    //console.log(P)  
                                                    let  pile = P.join('');
                                                    
                                                    // Add Grundy value display for Educational mode
                                                    let grundyDisplay = '(G=..)';
                                                    if(currentGrundyCache && currentGrundyCache.length > count) {
                                                        let gValue = String(currentGrundyCache[count]).padStart(2, ' ');
                                                         grundyDisplay = `(G=${gValue})`;
                                                    }
                                                    
                                                     pilesString +=  String(count).padStart(2) + grundyDisplay.padStart(6) + ": " + pile + "\n";  
                                                 }
                             );
                               let winnerMessage =`✅ Winner is `;
                                if(data.winnerName) winnerMessage += data.winnerName;
                                else                winnerMessage = "";

                                 pilesString += winnerMessage;    
                const display = document.getElementById('piles-display');
                                  display.innerHTML = pilesString;
                                  
                                  // Update previous player state for next iteration
                                  previousPlayer = currentPlayer;
                                  lastXorSum = data.xorsum;
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
                                                                                         if(matrixEntries?.[i]?.[j]?.winsA){
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
     //console.log('logo element :', logo);
    // Function to calculate precise logo position for scaling
    function calculateLogoTransform() {
    
        const logoRect = logo.getBoundingClientRect();
        //console.log('Logo element rect:', logo.getBoundingClientRect());
          
        // If logo has no dimensions, it hasn't loaded yet
       // if (logoRect.width === 0 || logoRect.height === 0) {
            //console.warn('Logo element has zero dimensions - image may not be loaded yet, logoRect.width =', logoRect.width, 'logoRect.height =', logoRect.height);
         //   return { x: 0, y: 0, scale: 0.1 };
       // }

        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;

        const translateX = logoCenterX - viewportCenterX;
        const translateY = logoCenterY - viewportCenterY;

        const scaleX = logoRect.width / window.innerWidth;
        const scaleY = logoRect.height / window.innerHeight;
        const scale = Math.max(0.08, Math.min(scaleX, scaleY));

        //console.log(`Logo center: (${logoCenterX.toFixed(2)}, ${logoCenterY.toFixed(2)}), Viewport center: (${viewportCenterX.toFixed(2)}, ${viewportCenterY.toFixed(2)}), Translate: (${translateX.toFixed(2)}, ${translateY.toFixed(2)})`);
        //console.log(`Calculated logo transform: translate(${translateX}px, ${translateY}px) scale(${scale})`);

        return { x: translateX, y: translateY, scale };
    }

    function finishIntroWithLogoTransition() {
        const transform = calculateLogoTransform();
        const tx = transform.x;
        const ty = transform.y;
        const scale = transform.scale;

        videoContainer.style.transition = 'transform 1.5s ease-in-out, opacity 1.5s ease-in-out';
        videoContainer.style.transformOrigin = 'center center';
        videoContainer.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        videoContainer.style.opacity = '0';
        //console.log('Starting logo transition: transform=', videoContainer.style.transform, 'videoContainer.style.opacity=', videoContainer.style.opacity);

        const onTransitionEnd = (event) => {
            //console.log('Logo transition onTransitionEnd event.propertyName =', event.propertyName);
            if (event.propertyName !== 'opacity') return;
            //console.log('onTransitionEnd  logo element rect:', logo.getBoundingClientRect());  
            videoContainer.removeEventListener('transitionend', onTransitionEnd);
            videoContainer.classList.add('hidden');
            regView.classList.remove('hidden');
        };
        videoContainer.addEventListener('transitionend', onTransitionEnd);
    }

    // Handle video end (normal forward playback)
    introVideo.addEventListener('ended', () => {
        //console.log('Intro video ended');
        finishIntroWithLogoTransition();
    });

    // Handle video errors
    introVideo.addEventListener('error', () => {
        console.error('Video error: failed to load? Skipping intro.');
        videoContainer.classList.add('hidden');
        regView.classList.remove('hidden');
    });

    // Start playing the video normally
    introVideo.play().catch(err => {
        console.error('Error while playing video:', err);
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
 //                                                    console.log('at DOMContentLoaded logo element rect:', logo ? logo.getBoundingClientRect() : ' #logo element not found');
                                                    });

 connect();

