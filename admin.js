// Admin Panel JavaScript
let ws = null;
let isAuthenticated = false;
let players = {};
let playerEmails = []; // Track player emails for dropdown
let tournamentStatus = "not_started";
let countdownInterval = null;
let countdownTime = 0;
let currentTotalGamesPlanned = 0;
let currentTotalGamesCompleted = 0;

        
        // --------------------Authenticate the admin with password------<button onclick="authenticateAdmin()">Login</button>
        async function authenticateAdmin() {
            const passwordInput = document.getElementById('admin-password');
            const password = passwordInput.value.trim();
            const errorMsg = document.getElementById('login-error');

                if (!password) {
                    errorMsg.textContent = 'Please enter a password';
                    return;
                }

                    connectWebSocket(password);
        }

            /**
             * Connect to WebSocket server for real-time updates
             */
            function connectWebSocket(password) {
                                        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
                                         ws = new WebSocket(`${protocol}://${window.location.host}`);
                                                        //------------------------------------------------ 
                                            ws.onopen = () => {
                                                                console.log('Admin connected to WebSocket');
                                                                updateConnectionStatus('Connected', '#00ffcc');
                                                                ws.send(JSON.stringify({ type: 'ADMIN_LOGIN', password }));
                                                              };
                                                        //------------------------------------------------
                                            ws.onmessage = (event) => {
                                                                        const data = JSON.parse(event.data);
                                                                        if (data.type === 'ADMIN_AUTH_FAILURE') {
                                                                            const errorMsg = document.getElementById('login-error');
                                                                             errorMsg.textContent = data.message || 'Invalid password';
                                                                              ws.close();
                                                                               ws = null;
                                                                                return;
                                                                        }

                                                                            handleServerEvent(data);
                                                                    };
                                                         //------------------------------------------------
                                            ws.onerror = (error) => {
                                                                     console.error('WebSocket error:', error);
                                                                     updateConnectionStatus('Error', '#e94560');
                                                                    };
                                                         //------------------------------------------------
                                            ws.onclose = () => {
                                                                console.log('Admin disconnected from WebSocket');
                                                                updateConnectionStatus('undefined', '#999');
                                                                const timerEl = document.getElementById('countdown-timer');
                                                                    if (timerEl) {
                                                                        timerEl.textContent = 'Admin disconnected from Server';
                                                                    }
                                                                // Attempt to reconnect after 3 seconds
                                                                setTimeout(connectWebSocket, 3000);
                                                               };
                }

/**
 * Handle events from the server
 */
function handleServerEvent(data) {
    switch (data.type) {
        case 'START_TIME_DELTA':
            countdownTime = data.delta;
            startCountdown();
            break;
        
        case 'PLAYER_REGISTERED':
            // When a new player registers, receive their full info
            console.log('Player registered:', data.email, data.name);
            players[data.email] = {
                name: data.name,
                registrationTime: data.registrationTime,
                status: data.status || 'connected'
            };
            updatePlayerTable();
            break;
        
        case 'PLAYER_DISCONNECTED':
            // When a player disconnects, update their status
            console.log('Player disconnected:', data.email);
            if (players[data.email]) {
                players[data.email].status = 'disconnected';
                updatePlayerTable();
            }
            break;
        
        case 'PLAYER_RECONNECTED':
            // When a player reconnects
            console.log('Player reconnected:', data.email);
            if (players[data.email]) {
                players[data.email].status = 'connected';
                updatePlayerTable();
            }
            break;
        
        case 'NEW_PLAYER':
            // When a new player registers, the server broadcasts their name
            // We should request updated player list from the admin connection
            // console.log('New player registered:', data.name);
            // For admin, we'll update the list when we get tournament updates
            break;

        case 'PLAYERS_LIST':
            if (data.players) {
                players = data.players;
                updatePlayerTable();
            }
            if (typeof data.totalGamesPlanned === 'number' || typeof data.totalGamesCompleted === 'number') {
                updateGameProgress(data.totalGamesCompleted || currentTotalGamesCompleted, data.totalGamesPlanned || currentTotalGamesPlanned);
            }
            break;
        
        case 'TOURNAMENT_STARTED':
            tournamentStatus = 'running';
            if (countdownInterval) clearInterval(countdownInterval);
            document.getElementById('countdown-timer').textContent = '🎉 Tournament Started!';
            if (data.players) {
                Object.assign(players, data.players);
                updatePlayerTable();
            }
            if (typeof data.totalGamesPlanned === 'number' || typeof data.totalGamesCompleted === 'number') {
                updateGameProgress(data.totalGamesCompleted || currentTotalGamesCompleted, data.totalGamesPlanned || currentTotalGamesPlanned);
            }
            updateStatus('Tournament Running', '#00ffcc');
            break;
        
        case 'CONTEST_PAUSED':
            tournamentStatus = 'paused';
            updateStatus('Tournament Paused', '#ffaa00');
            break;
        
        case 'CONTEST_RESUMED':
            tournamentStatus = 'running';
            updateStatus('Tournament Running', '#00ffcc');
            break;
        
        case 'END':
            tournamentStatus = 'ended';
            if (typeof data.totalGamesPlanned === 'number' || typeof data.totalGamesCompleted === 'number') {
                updateGameProgress(data.totalGamesCompleted || currentTotalGamesCompleted, data.totalGamesPlanned || currentTotalGamesPlanned);
            }
            updateStatus('Tournament Ended', '#ff6b6b');
            break;
        
        case 'NEW_CONTEST_BEGINS':
            players = {};
            updatePlayerTable();
            if (typeof data.totalGamesPlanned === 'number' || typeof data.totalGamesCompleted === 'number') {
                updateGameProgress(data.totalGamesCompleted || currentTotalGamesCompleted, data.totalGamesPlanned || currentTotalGamesPlanned);
            }
            updateStatus('New Tournament Ready', '#00ffcc');
            countdownTime = 15 * 60 * 1000; // Reset to 15 minutes
            startCountdown();
            break;
        
        case 'ADMIN_AUTH_SUCCESS':
            // When authenticated, receive current player list and config
            isAuthenticated = true;
            document.getElementById('admin-login-view').classList.add('hidden');
            document.getElementById('admin-panel-view').classList.remove('hidden');
            document.getElementById('login-error').textContent = '';
            console.log('Admin authenticated successfully');
            console.log(`before  if (data.players)...  data.players:`,data.players);
            if (data.players) {
                players = data.players;
                console.log(`players =`,players);
                updatePlayerTable();
            }
            console.log(`before  if (data.config)...  data.config:`,data.config);
            if (data.config) {
                document.getElementById('config-piles')    .value = data.config.piles.join(',');
                document.getElementById('config-forbidden').value = data.config.forbidden.join(',');
                document.getElementById('config-baseTime') .value = data.config.baseTime;
                document.getElementById('config-educational').checked = data.config.educational;
            }
            if (typeof data.totalGamesPlanned === 'number' || typeof data.totalGamesCompleted === 'number') {
                updateGameProgress(data.totalGamesCompleted || currentTotalGamesCompleted, data.totalGamesPlanned || currentTotalGamesPlanned);
            }
            console.log(`before  if (data.tournamentStartTime)...  data.tournamentStartTime:`,data.tournamentStartTime);
            if (data.tournamentStartTime) {
                countdownTime = data.tournamentStartTime - Date.now();
                startCountdown();
            }
            break;
        
        case 'CONFIG_UPDATED':
            if (data.config) {
                document.getElementById('config-piles').value = data.config.piles.join(',');
                document.getElementById('config-forbidden').value = data.config.forbidden.join(',');
                document.getElementById('config-baseTime').value = data.config.baseTime;
                if (typeof data.config.educational === 'boolean') {
                    document.getElementById('config-educational').checked = data.config.educational;
                }
            }
            break;
        
        case 'ADMIN_CONFIG_UPDATED':
            //alert('Configuration updated successfully!');
            let message = 'Configuration updated successfully at ' + new Date().toLocaleString() + '!\n';
             console.log(message);
             const configUpdateDisplay = document.getElementById('config-update-display');
              let configUpdateContent = message+ configUpdateDisplay.textContent ;
               configUpdateDisplay.textContent = configUpdateContent;
            break;
        
        case 'ADMIN_BOT_CODE_RESPONSE':
            if (data.code) {
                players[data.email].code = data.code;
                const codeElement = document.getElementById('bot-code-display').querySelector('code');
                codeElement.textContent = data.code;
                codeElement.className = 'language-javascript';
                document.getElementById('bot-code-display').style.display = 'block';
                // Highlight the code using Highlight.js
                if (window.hljs) {
                    hljs.highlightElement(codeElement);
                }
            } else if (data.error) {
                alert(`Error loading code: ${data.error}`);
            }
            break;
        
        case 'CONNECTION_STATUS_UPDATE':
            // Update connection status for all players
            if (data.connectionStatus) {
                Object.entries(data.connectionStatus).forEach(([email, status]) => {
                    if (players[email]) {
                        players[email].status = status;
                    }
                });
                updatePlayerTable();
            }
            break;
    }
}

/**
 * Start countdown timer
 */
function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        countdownTime -= 1000;
        
        if (countdownTime <= 0) {
            clearInterval(countdownInterval);
            updateCountdownDisplay('Tournament Starting!');
            return;
        }
        
        updateCountdownDisplay();
    }, 1000);
    
    updateCountdownDisplay();
}

/**
 * Update countdown timer display
 */
function updateCountdownDisplay(text = null) {
    const timerEl = document.getElementById('countdown-timer');
    
    if (text) {
        timerEl.textContent = text;
        return;
    }
    
    const seconds = Math.floor((countdownTime % 60000) / 1000);
    const minutes = Math.floor((countdownTime % 3600000) / 60000);
    const hours = Math.floor(countdownTime / 3600000);
    
    timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Update tournament status
 */
function updateStatus(status, color = '#00ffcc') {
    const statusEl = document.getElementById('tournament-status');
    statusEl.textContent = status;
    statusEl.style.color = color;
}

/**
 * Update connection status
 */
function updateConnectionStatus(status, color = '#00ffcc') {
    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = status;
    statusEl.style.color = color;
}

function updateGameProgress(completed, planned) {
    currentTotalGamesCompleted = Number(completed) || 0;
    currentTotalGamesPlanned = Number(planned) || 0;
    const percent = currentTotalGamesPlanned > 0 ? ((currentTotalGamesCompleted / currentTotalGamesPlanned) * 100).toFixed(2) : '0.00';
    const progressEl = document.getElementById('game-progress');
    if (progressEl) {
        progressEl.textContent = `${currentTotalGamesCompleted} / ${currentTotalGamesPlanned} (${percent}%)`;
    }
}

/**
 * Update player list in table format
 */
function updatePlayerTable() {
    const tableBody = document.getElementById('players-table-body');
    const select = document.getElementById('player-code-select');
    
    if (!players || Object.keys(players).length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">No players registered yet</td></tr>';
        select.innerHTML = '<option value="">Select a player to view code...</option>';
        document.getElementById('player-count').textContent = '0';
        return;
    }
    
    // Clear table body
    tableBody.innerHTML = '';
    
    // Clear and rebuild select dropdown
    select.innerHTML = '<option value="">Select a player to view code...</option>';
    
    playerEmails = [];
    
    // Add each player to table
    Object.entries(players).forEach(([email, player]) => {
        playerEmails.push(email);
        
        const row = document.createElement('tr');
        
        const regTime = player.registrationTime ? 
            new Date(player.registrationTime).toLocaleTimeString() : 'N/A';
        
        const statusBadge = player.status === 'connected' ? 
            '<span style="color: #00ff00; font-weight: bold;">🟢 Connected</span>' :
            '<span style="color: #ff0000; font-weight: bold;">🔴 Disconnected</span>';
        
        row.innerHTML = `
            <td>${email}</td>
            <td>${player.name || 'N/A'}</td>
            <td>${regTime}</td>
            <td>${statusBadge}</td>
        `;
        
        tableBody.appendChild(row);
        
        // Add to dropdown
        const option = document.createElement('option');
        option.value = email;
        option.textContent = player.name || email;
        select.appendChild(option);
    });
    
    // Update player count
    document.getElementById('player-count').textContent = Object.keys(players).length;
}

/**
 * Update player list (legacy function, now calls updatePlayerTable)
 */
function updatePlayerList() {
    updatePlayerTable();
}

/**
 * Update player list from object (legacy function, now calls updatePlayerTable)
 */
function updatePlayerListFromObject() {
    updatePlayerTable();
}

/**
 * Show bot code for selected player
 */
function showBotCode() {
    const select = document.getElementById('player-code-select');
    const codeDisplay = document.getElementById('bot-code-display');
    const codeElement = codeDisplay.querySelector('code');
    const email = select.value;
    
    if (!email || !players[email]) {
        codeDisplay.style.display = 'none';
        return;
    }
    
    const player = players[email];
    
    if (!player.code) {
        // Request code from server if not available
        codeElement.textContent = 'Loading code...';
        codeDisplay.style.display = 'block';
        ws.send(JSON.stringify({
            type: 'ADMIN_REQUEST_BOT_CODE',
            email: email
        }));
    } else {
        // Display already loaded code with syntax highlighting
        codeElement.textContent = player.code;
        codeElement.className = 'language-javascript';
        codeDisplay.style.display = 'block';
        // Highlight the code using Highlight.js
        let hljs = window.hljs;
        delete codeElement.dataset.highlighted;
         if (hljs) {
             hljs.highlightElement(codeElement);
         }
    }
}

/**
 * Send tournament start command to server
 */
function manualStartTournament() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Not connected to server');
        return;
    }
    
    ws.send(JSON.stringify({ type: 'ADMIN_START' }));
    console.log('Sent tournament start command');
}

/**
 * Send pause command to server
 */
function pauseTournament() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Not connected to server');
        return;
    }
    
    ws.send(JSON.stringify({ type: 'ADMIN_PAUSE' }));
    console.log('Sent pause command');
}

/**
 * Send resume command to server
 */
function resumeTournament() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Not connected to server');
        return;
    }
    
    ws.send(JSON.stringify({ type: 'ADMIN_RESUME' }));
    console.log('Sent resume command');
}

/**
 * Send new tournament command to server
 */
function newTournament() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Not connected to server');
        return;
    }
    
    if (confirm('Are you sure you want to start a new tournament? This will reset all data.')) {
        ws.send(JSON.stringify({ type: 'ADMIN_NEW_TOURNAMENT' }));
        console.log('Sent new tournament command');
    }
}

/**
 * Update game configuration
 */
function updateConfiguration() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Not connected to server - refresh the page and login again');
         return;
    }
    
    const pilesInput = document.getElementById('config-piles').value;
    const forbiddenInput = document.getElementById('config-forbidden').value;
    const baseTimeInput = document.getElementById('config-baseTime').value;
    const moveDelayInput = +(document.getElementById('config-moveDelay').value) /*|| 100*/;
    const matchDelayInput = +(document.getElementById('config-matchDelay').value)/* || 2000*/;
    
    // Parse inputs
    const piles = pilesInput.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    const forbidden = forbiddenInput.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    const baseTime = parseInt(baseTimeInput) || 10;
    const educational = !!document.getElementById('config-educational').checked;
    
    if (piles.length === 0) {
        alert('Please enter at least one pile size');
         return;
    }
    
    ws.send(JSON.stringify({
                            type  : 'ADMIN_UPDATE_CONFIG',
                            config: {
                                     piles,
                                     forbidden,
                                     baseTime,
                                     educational,
                                     moveDelayMs: moveDelayInput,
                                     matchDelayMs: matchDelayInput
                                   }
                           }));
    
    console.log('Sent config update:', { piles, forbidden, baseTime, moveDelayMs: moveDelayInput, matchDelayMs: matchDelayInput });
}

/**
 * Logout from admin panel
 */
function logout() {
    isAuthenticated = false;
    if (ws) {
        ws.close();
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    document.getElementById('admin-panel-view').classList.add('hidden');
    document.getElementById('admin-login-view').classList.remove('hidden');
    document.getElementById('admin-password').value = '';
}

/**
 * Allow Enter key to login
 */
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('admin-password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                authenticateAdmin();
            }
        });
    }
    
    // Initialize config fields with default values
    document.getElementById('config-piles').value = '3,5,7';
    document.getElementById('config-forbidden').value = '3,5';
    document.getElementById('config-baseTime').value = '10';
    
    // Add real-time listeners for delay sliders
    const moveDelaySlider = document.getElementById('config-moveDelay');
    const matchDelaySlider = document.getElementById('config-matchDelay');
    
    if (moveDelaySlider) {
        moveDelaySlider.addEventListener('input', (e) => {
            document.getElementById('move-delay-value').textContent = e.target.value;
        });
    }
    
    if (matchDelaySlider) {
        matchDelaySlider.addEventListener('input', (e) => {
            document.getElementById('match-delay-value').textContent = e.target.value;
        });
    }
});
