const version = "0.3.0" 
const crypto              = require('crypto'); // Node crypto for server-side SHA256 password hashing
const express             = require('express'); // Express framework for handling HTTP requests and serving the dashboard
const http                = require('http'); // Node's built-in HTTP module to create a server that can handle both Express and Socket.IO connections on the same port
const { Server }          = require('socket.io'); // Socket.IO for reliable real-time communication
const vm                  = require('vm'); // Node's built-in virtual machine module for safely executing untrusted Bot code in a sandboxed environment with timeouts to prevent abuse
const fs                  = require('fs').promises; // newest File system module for reading/writing tournament data, if needed for persistence or logging
const path                = require('path');  // Node's built-in path module for handling file paths, such as where to store tournament data or logs 
 const DATA_DIR = path.join(__dirname, 'data'); // Directory to store tournament data, logs, or player registrations if needed. This keeps the project organized and allows for future features like saving tournament history or player stats. Make sure this directory exists or add code to create it if it doesn't. 
  const TOURNAMENTS_FILE = path.join(DATA_DIR, 'tournaments.json'); // File to store tournament data in JSON format. This allows for persistence of tournament results and player registrations across server restarts, and can be used for analytics or displaying past tournaments on the dashboard. Make sure to handle file read/write operations with care to avoid data corruption, especially if multiple tournaments are run in quick succession. Consider implementing a simple locking mechanism if needed to prevent concurrent writes.

const  app = express(); // Express application for handling HTTP requests and serving the dashboard
        app.use(express.json()); // Middleware to parse JSON bodies in HTTP requests 
        app.use(express.static('public')); // Serves your index.html in /public directory    
const    server = http.createServer(app); // Create an HTTP server to attach both Express and Socket.IO to the same port
const     io = new Server(server, {
                                    cors: {
                                        origin: '*',
                                        methods: ['GET', 'POST']
                                    }
                                  }); // Socket.IO server for real-time communication with the dashboard











const ADMIN_PASSWORD_HASH = '449904569c19c55d7537de6e946ccedbc4e4a4d874bdf3263e2efa7c72aa0d35';
            function isAdminPasswordValid(password) {
                                                      //console.log("Admin login attempt with password:", password);
                                                      let hash = crypto.createHash('sha256').update(password, 'utf8').digest('hex');
                                                       //console.log("Computed password hash:", hash);
                                                       //console.log("Expected password hash:", ADMIN_PASSWORD_HASH);
                                                        return hash === ADMIN_PASSWORD_HASH;
            }
            
        
         // ==== ROUTES =========================================================================
         // Admin panel route from project root
         app.get('/adminAKME',
                          //--------------------------------------------------------------------- 
                         (req, res) => {
                                        console.log("/admin get request received!");
                                        res.sendFile(path.join(__dirname, 'admin.html'));
                         });

         // Serve admin client script from project root
         app.get('/admin.js',
                          //--------------------------------------------------------------------- 
                         (req, res) => {
                                        console.log("/admin.js request received!");
                                        res.sendFile(path.join(__dirname, 'admin.js'));
                         });
         
         // Authentication postback route for tunnel/forwarding services (GitHub Codespaces, etc.)
         app.post('/auth/postback/tunnel',
                            //--------------------------------------------------------------------- 
                            (req, res) => {
                                           console.log("Tunnel postback received:", req.query);
                                           const redirectPath = req.query.rd || '/admin';
                                            res.redirect(redirectPath);
                                         });
         
         // Player registration is now handled via WebSocket messages (type: "REGISTER_PLAYER")
         // See the WebSocket message handler below for the registration logic
         
         
         
// Start the server
const PORT = 3000;
         server.listen(PORT, 
                            //---------------------------------------------------------------------
                            () => {
                                    console.log(`server.js (version ${version}) running   at http://localhost:${PORT}`);
                                    // Ensure microbots are registered before clients connect
                                    try { ensureMicrobotsRegistered(); } catch (e) { console.error('Error registering microbots', e); }

                                     tournamentStartTime = Date.now() + DEFAULT_START_DELAY_MS;
                                      console.log(`Tournament scheduled to start at ${new Date(tournamentStartTime).toLocaleString()}`);
                                     startTimeout = setTimeout(startChampionship, DEFAULT_START_DELAY_MS);
                                      broadcast({ type: "START_TIME_DELTA", delta: DEFAULT_START_DELAY_MS });
                                      // Broadcast current players list (includes microbots)
                                      broadcast({ type: 'PLAYERS_LIST', players, totalGamesPlanned, totalGamesCompleted });
                                     
                                  }
                     );        

var playersNumber = 0;
var players = {};
// Microbots that must always be present in the tournament
var MICROBOTS = [
    { email: 'bot@internet.edu', name: '🤖' },
    { email: 'clown@circus.com', name: '🤡' },
    { email: 'snowman@pole.org', name: '☃️' }
];

// Default example codes (kept in sync with client CodeExample snippets)
var CODE_EXAMPLES = [
`\n function play(piles, forbidden, context) {\n               let target =0, N=0; \n                target = piles.findIndex(p => p > 0);\n                 if(piles[target]== 1) N = 1;\n                 else                  N = 2;\n                  return { pileIndex: target, count: N }; \n }`,
`\n function play(piles, forbidden, context) {\n               let i=0, c=0;\n                for(i; i<piles.length; i++)\n                    if(piles[i]>0) break;\n                \n                if(piles[i]== 1) c = 1;\n                else             c = 1;\n                 return { pileIndex: i, count: c }; \n }`,
`\n function play(piles, forbidden, context) {\n               let target = piles.findIndex(p => p > 0); // find the first non-empty pile\n             let NumberOfCoins = 0;\n              if(piles[target]==1) NumberOfCoins=1;\n              else                 NumberOfCoins=2;\n               if (forbidden.includes(NumberOfCoins)) NumberOfCoins=1;   // if for example 2 is forbidden we take 1 coin\n                return { pileIndex: target, count: NumberOfCoins }; \n}\n`
];
                // Ensure microbots are registered in the players map
                function ensureMicrobotsRegistered() {
                                                      MICROBOTS
                                                          .forEach((mb, i) => {
                                                                               if (!players[mb.email]) {
                                                                                   const idx = playersNumber++;
                                                                                    players[mb.email] = {
                                                                                                         idx,
                                                                                                         name: mb.name,
                                                                                                         code: CODE_EXAMPLES[i % CODE_EXAMPLES.length],
                                                                                                         timeBank: 0 /*CONFIG.baseTime*/,
                                                                                                         score: 0,
                                                                                                         iRate: 0,
                                                                                                         nMoves: 0,
                                                                                                         status: 'connected',
                                                                                                         registrationTime: Date.now()
                                                                                                        };
                                                                               }
                                                                              });
                                                                                 totalGamesPlanned = calculateTotalGamesToPlay();
                }
var adminClient = null; // Single authenticated admin Socket.IO connection
var clientEmailMap = new Map(); // Map from Socket.IO client to player email
var emailToClientMap = new Map(); // Map from player email to Socket.IO client


var tournamentStarted   = false;// Flag to prevent multiple tournament starts
var tournamentStartTime = null; // Timestamp for when the tournament is scheduled to start, sent to clients for countdown display
var startTimeout        = null; // To allow manual start before the scheduled time if needed
var matchMatrix         = {}; // Stores results of matches for the matrix display
// matchMatrix structure: { "emailA|emailB": { playerA, playerB, winsA, winsB, bonusA, bonusB } }
var totalGamesPlanned   = 0;  // Calculated when players register and when a tournament starts
var totalGamesCompleted = 0;  // Incremented after each finished game

var DEFAULT_START_DELAY_MS = 15 * 60 * 1000; // 15 minutes after server start
var MATCH_TIME_LIMIT = 100; // Time limit for each match in milliseconds (can be adjusted as needed)
var COMPILE_TIME_LIMIT = 100; // Time limit for each match in milliseconds (can be adjusted as needed)
var MAX_CODE_SIZE = 4096; // Maximum size for each bot's code in characters
var NUMBER_OF_GAMES_PER_MATCH = 10; // Number of games to play per match
var MOVE_DELAY_MS = 100; // Delay between moves in milliseconds to slow down the tournament for better visualization on the dashboard
var MATCH_DELAY_MS = 2000; // Delay between matches in milliseconds to slow down the tournament for better visualization on the dashboard




          io.on('connection', 
             //---------------------------------------------------------------------            
            // When a new client connects, send them the tournament start time delta if ready
            socket => {
                       if (tournamentStartTime) {
                           let timeDelta = tournamentStartTime - Date.now(); // Time interval from now until tournament starts (in milliseconds)
                           let startTimeMessage = { type: "START_TIME_DELTA", delta: timeDelta };
                               socket.send(startTimeMessage);
                               // Also send current config and players so clients can populate UI immediately
                               try { socket.send({ type: 'CONFIG', config: CONFIG }); } catch(e){}
                               try { socket.send({ type: 'PLAYERS_LIST', players, totalGamesPlanned, totalGamesCompleted }); } catch(e){}
                            }

                        // Working with messages from clients, such as a request to start the tournament early           
                   socket.on('message', 
                          //-------------------------------------------------------------------- 
                          async message => {
                                      try {
                                           let data = typeof message === 'string' ? JSON.parse(message) : message;
                                          

                                           // Handle visibility state from client (background/tab visibility)
                                           if (data.type === 'VISIBILITY') {
                                               const state = data.state;
                                               const email = clientEmailMap.get(socket);
                                                if (email && players[email]) {
                                                    players[email].visibility = state;
                                                }
                                                if (adminClient && adminClient.connected) {
                                                    try { adminClient.send({ type: 'PLAYER_VISIBILITY', email: clientEmailMap.get(socket) || null, visibility: state, timestamp: Date.now() }); } catch (e) {}
                                                }
                                                 return;
                                           }

                                          // Handle admin login request
                                          if (data.type === "ADMIN_LOGIN") {
                                              const { password } = data;

                                               if (typeof password !== 'string' || !password.trim()) {
                                                   socket.send({ type: 'ADMIN_AUTH_FAILURE', message: 'Password required' });
                                                   return;
                                               }

                                               if (!isAdminPasswordValid(password)) {
                                                   socket.send({ type: 'ADMIN_AUTH_FAILURE', message: 'Invalid password' });
                                                   return;
                                               }

                                               if (adminClient && adminClient.connected && adminClient !== socket) {
                                                   socket.send({ type: 'ADMIN_AUTH_FAILURE', message: 'Another admin session is already active' });
                                                   return;
                                               }

                                                socket.isAdminAuthenticated = true;
                                                 adminClient = socket;
                                                console.log(" Admin client authenticated (ADMIN_LOGIN)");
                                                 socket.send({ 
                                                              type: "ADMIN_AUTH_SUCCESS",
                                                              players,
                                                              tournamentStarted,
                                                              tournamentStartTime,
                                                              totalGamesPlanned,
                                                              totalGamesCompleted,
                                                              config: CONFIG
                                                           });
                                                  return;
                                          }

                                          // Handle admin authentication marker if provided without login
                                          if (data.type === "ADMIN_AUTH") {
                                              if (!socket.isAdminAuthenticated) {
                                                  socket.send({ type: 'ADMIN_AUTH_FAILURE', message: 'Authentication required' });
                                                   return;
                                              }

                                              if (adminClient && adminClient.connected) {
                                                  socket.send({ type: 'ADMIN_AUTH_FAILURE', message: 'Another admin session is already active' });
                                                   return;
                                              }

                                              adminClient = socket;
                                              console.log("(234) Admin client authenticated (ADMIN_AUTH)");
                                               socket.send({ 
                                                             type: "ADMIN_AUTH_SUCCESS",
                                                             players,
                                                             tournamentStarted,
                                                             tournamentStartTime,
                                                             totalGamesPlanned,
                                                             totalGamesCompleted,
                                                             config: CONFIG
                                                          });
                                                return;
                                          }

                                          // Handle admin commands
                                          if (adminClient === socket) {

                                              if (data.type === "ADMIN_START") {
                                                 console.log("Admin requested tournament start");
                                                  if (!tournamentStarted) {
                                                      if (startTimeout) {
                                                          clearTimeout(startTimeout);
                                                           startTimeout = null;
                                                      }
                                                       ///////////////////////////////////////////////
                                                       startChampionship();//////////////////////////
                                                     ///////////////////////////////////////////////
                                                  }
                                                   return;
                                              }

                                              if (data.type === "ADMIN_PAUSE") {
                                                       console.log("Admin requested tournament pause");
                                                        if (tournamentStarted && !isPaused) {
                                                            isPaused = true;
                                                            broadcast({ type: "CONTEST_PAUSED" });
                                                        }
                                                         return;
                                              }

                                              if (data.type === "ADMIN_RESUME") {
                                                 console.log("Admin requested tournament resume");
                                                  if (tournamentStarted && isPaused) {
                                                      isPaused = false;
                                                      broadcast({ type: "CONTEST_RESUMED" });
                                                  }
                                                   return;
                                              }

                                              if (data.type === "ADMIN_NEW_TOURNAMENT") {
                                                 console.log("Admin requested new tournament");
                                                  if (!tournamentStarted) {
                                                                             playersNumber = 0;
                                                                             players = {};
                                                                             matchMatrix = {};
                                                                             Matrix = [];
                                                                             clientEmailMap.clear();
                                                                             emailToClientMap.clear();
                                                                             if (startTimeout) {
                                                                                 clearTimeout(startTimeout);
                                                                             }
                                                                             tournamentStartTime = Date.now() + DEFAULT_START_DELAY_MS;
                                                                              console.log(`New tournament scheduled to start at ${new Date(tournamentStartTime).toLocaleString()}`);
                                                                              startTimeout = setTimeout(startChampionship, DEFAULT_START_DELAY_MS);
                                                                             // Re-register microbots and notify clients
                                                                             ensureMicrobotsRegistered();
                                                                              broadcast({ type: "START_TIME_DELTA", delta: DEFAULT_START_DELAY_MS });
                                                                              broadcast({ type: "NEW_CONTEST_BEGINS", players: players, matchMatrix: {}, config: CONFIG });
                                                                              broadcast({ type: 'PLAYERS_LIST', players });
                                                                         }
                                                   return;
                                              }

                                              if (data.type === "ADMIN_UPDATE_CONFIG") {
                                                  console.log("Admin updating configuration:", data.config);
                                                  if (data.config.piles)     CONFIG.piles     = data.config.piles;
                                                  if (data.config.forbidden) CONFIG.forbidden = data.config.forbidden;
                                                  if (data.config.maxCoins)  CONFIG.maxCoins  = data.config.maxCoins;
                                                  if (data.config.baseTime)  CONFIG.baseTime  = data.config.baseTime;
                                                  if (typeof data.config.educational === 'boolean') {
                                                      CONFIG.educational = data.config.educational;
                                                      CONFIG.mode = CONFIG.educational ? 'EDUCATIONAL' : 'NORMAL';
                                                  }
                                                  if (typeof data.config.moveDelayMs === 'number') {
                                                      MOVE_DELAY_MS = Math.max(0, Math.min(2000, data.config.moveDelayMs));
                                                       console.log(`Move delay updated to ${MOVE_DELAY_MS}ms`);
                                                  }
                                                  if (typeof data.config.matchDelayMs === 'number') {
                                                      MATCH_DELAY_MS = Math.max(0, Math.min(2000, data.config.matchDelayMs));
                                                       console.log(`Match delay updated to ${MATCH_DELAY_MS}ms`);
                                                  }
                                                   broadcast({ type: "CONFIG_UPDATED", config: CONFIG });
                                                   socket.send({ type: "ADMIN_CONFIG_UPDATED" });
                                                    return;
                                              }

                                              if (data.type === "ADMIN_REQUEST_BOT_CODE") {
                                                 const { email } = data;
                                                  if (players[email]) {
                                                      socket.send({
                                                                                type: "ADMIN_BOT_CODE_RESPONSE",
                                                                                email: email,
                                                                                name: players[email].name,
                                                                                code: players[email].code
                                                                            });
                                                  }
                                                  else {
                                                         socket.send({
                                                                                  type: "ADMIN_BOT_CODE_RESPONSE",
                                                                                  email: email,
                                                                                  error: "Player not found"
                                                                                });
                                                  }
                                                    return;
                                              }
                                          }



                                                if (data.type === "REGISTER_PLAYER") {
                                                   const { email, name, code } = data;
                                                    console.log(`beginning Registering player: ${name} (${email}) ...`);

                                                    // Check for duplicate email registration (allow reconnection before tournament starts)
                                                    if (players[email]) {
                                                        const oldSocket = emailToClientMap.get(email);
                                                         const alreadyConnected = oldSocket && oldSocket.connected && oldSocket !== socket;
                                                          if (tournamentStarted || alreadyConnected) {
                                                              let errmessage = `Player with email ${email} is already registered`;
                                                              console.log(errmessage);
                                                              socket.send({ type: "REGISTRATION_ERROR", message: errmessage });
                                                               return;
                                                          }
                                                           //else
                                                            {
                                                             // Allow reconnection if the previous websocket is no longer active
                                                             console.log(`Player ${email} is reconnecting...`);
                                                             if (oldSocket) {
                                                                 clientEmailMap.delete(oldSocket);
                                                             }
                                                              clientEmailMap.set(socket, email);
                                                              emailToClientMap.set(email, socket);
                                                 
                                                             socket.send({ type: "REGISTRATION_SUCCESS", message: "Reconnected!" });
                                                            
                                                             // Notify admin about reconnection
                                                             if (adminClient && adminClient.connected) {
                                                                 adminClient.send({
                                                                                                     type: "PLAYER_RECONNECTED",
                                                                                                     email: email
                                                                                                 });
                                                             }
                                                              return;
                                                            }
                                                    }
                                               
                                                       // Basic validation for name and email
                                                       if (!email || !email.trim()) {
                                                           let errmessage = `Registration failed: email is required`;
                                                            console.log(errmessage);
                                                            socket.send({ type: "REGISTRATION_ERROR", message: errmessage });
                                                             return;
                                                       }
                                                       if (!name || !name.trim()) {
                                                           let errmessage = `Registration failed: bot name is required`;
                                                            console.log(errmessage);
                                                            socket.send({ type: "REGISTRATION_ERROR", message: errmessage });
                                                             return;
                                                       }
                                                       // Ensure unique display names (no conflicting bot names)
                                                       const nameConflict = Object.values(players).some(p => p.name && p.name.trim() === name.trim());
                                                        if (nameConflict) {
                                                           let errmessage = `Registration failed: bot name "${name}" is already taken`;
                                                            console.log(errmessage);
                                                            socket.send({ type: "REGISTRATION_ERROR", message: errmessage });
                                                             return;
                                                        }

                                                    // Validate code size
                                                    if (code.length > CONFIG.maxCodeSize) {
                                                        let errmessage = `Bot Code too big (must be <= ${CONFIG.maxCodeSize} characters) for player: ${name} (${email})`;
                                                         console.log(errmessage);
                                                         socket.send({ type: "REGISTRATION_ERROR", message: errmessage });
                                                          return;
                                                    }
                                                        // Try to compile the Bot code in virtual machine to catch syntax errors before registration
                                                       const botCodeString = code;
                                                        try {
                                                            console.log(`Compiling Bot code for player: ${name} (${email}) to check for syntax errors...`);
                                                             const botScript = new vm.Script(botCodeString);
                                                              console.log(`Creating {} context`);
                                                               const context = vm.createContext({});
                                                                console.log(`Running Bot code in {} context with timeout ${COMPILE_TIME_LIMIT} ms to check for syntax errors and validate play() function...`);
                                                                let compileStartTime = Date.now();
                                                                 botScript.runInContext(context, { timeout: COMPILE_TIME_LIMIT });
                                                                  let compileTime = Date.now() - compileStartTime;
                                                                   console.log(`Bot code compiling executed successfully in ${compileTime} ms. Validating play() function...`);
                                                                   const playFunction = context.play;
                                                                    // --- VALIDATION TESTS ---
                                                                    // Test 1: Check that the type is a function
                                                                    if (typeof playFunction !== 'function') 
                                                                        throw new Error('Bot code must define a function named "play"');
                                                                    
                                                                    // Test 2: Check that the function name is exactly 'play'
                                                                    if (playFunction.name !== 'play') 
                                                                        throw new Error(`Expected function name to be "play", but got "${playFunction.name}"`);
                                                                    
                                                                    // Test 3: Check that the function is not asynchronous
                                                                    const isAsync = Object.prototype.toString.call(playFunction) === '[object AsyncFunction]';
                                                                     if (isAsync) 
                                                                         throw new Error('The "play" function must be synchronous (no async/await allowed)');
                                                                     
                                                                    // else Register the player
                                                                     let idx = playersNumber;
                                                                      playersNumber++;
                                                                      const registrationTime = Date.now();
                                                                        players[email] = {
                                                                            idx,
                                                                            name,
                                                                            code,
                                                                            timeBank: 0 /*CONFIG.baseTime*/,
                                                                            score: 0,
                                                                            iRate: 0,
                                                                            nMoves: 0,
                                                                            status: "READY",
                                                                            registrationTime: registrationTime
                                                                        };
                                                                      
                                                                          // Recalculate planned games after registration
                                                     totalGamesPlanned = calculateTotalGamesToPlay();
                                                     // Broadcast updated players list to all clients (so frontends can populate selectors)
                                                                          broadcast({ type: 'PLAYERS_LIST', players, totalGamesPlanned, totalGamesCompleted });
                                                                          // Also notify the admin client about the updated players list
                                                                          if (adminClient && adminClient.connected) {
                                                                              try { adminClient.send({ type: 'PLAYERS_LIST', players, totalGamesPlanned, totalGamesCompleted }); } catch(e){}
                                                                          }
                                                                      // Track the client-to-email mapping for disconnection detection
                                                                      clientEmailMap.set(socket, email);
                                                                      emailToClientMap.set(email, socket);
                                                                      
                                                                      // Broadcast the new player to all connected clients
                                                                       console.log(`... Registered!  Total players: ${playersNumber}`);
                                                                       socket.send({ type: "REGISTRATION_SUCCESS", message: "Registered!" });
                                                                        broadcast({ type: "NEW_PLAYER", name });
                                                                        
                                                                        // Send detailed registration info to the admin client
                                                                        if (adminClient && adminClient.connected) {
                                                                            adminClient.send({
                                                                                                                type: "PLAYER_REGISTERED",
                                                                                                                email: email,
                                                                                                                name: name,
                                                                                                                registrationTime: registrationTime,
                                                                                                                status: "connected"
                                                                                                            });
                                                                        }
                                                        }
                                                        catch (err) {
                                                            let errmessage = `Error in Bot code for player: ${name} (${email}): ${err.message}`;
                                                            console.log(errmessage);
                                                             delete players[email];
                                                             socket.send({ type: "REGISTRATION_ERROR", message: errmessage });
                                                        }
                                                }
                                         }
                                      catch (err) {
                                                   console.warn("Received invalid WebSocket message:", err.message);
                                                  }
                                    }
                       );

                   // Handle client disconnect
                   socket.on('disconnect', () => {
                       if (adminClient === socket) {
                           adminClient = null;
                           console.log("Admin client disconnected");
                       }
                       
                       // Check if this was a registered player
                       const email = clientEmailMap.get(socket);
                       if (email) {
                           console.log(`Player ${email} disconnected`);
                           clientEmailMap.delete(socket);
                           emailToClientMap.delete(email);
                           
                           // Notify the admin client about the disconnection
                           if (adminClient && adminClient.connected) {
                               adminClient.send({
                                   type: "PLAYER_DISCONNECTED",
                                   email: email
                               });
                           }
                       }
                   });
                  }
          );

 ////////////////////////////////////////////////////////////////////////////////////////////////////
// --- GAME CONFIGURATION ---
var CONFIG = {
               mode: "NORMAL", // "" or "GIVEAWAY"
               educational: true, // when true: Educational Mode (no persistence, clients can view other bots' code)
               piles: [3, 5, 7], // Initial piles
               forbidden: [3, 5], // Example: can't take 3 or 5 from any pile
               maxCoins: 10, // Maximum coins in any pile for random generation
               baseTime: MATCH_TIME_LIMIT,   // ms
               maxCodeSize: MAX_CODE_SIZE, // bytes
               numberOfGamesPerMatch: NUMBER_OF_GAMES_PER_MATCH // Number of games each pair of Bots will play against each other
             };

                   function makeRandGenFromSeed(seed) { //mulberry32 is a simple fast PRNG with good enough randomness for our purposes, and it allows us to have reproducible random sequences by using a fixed seed. This is useful for generating the initial piles and forbidden moves in a consistent way across tournaments, which can be important for fairness and for testing purposes. By using a seeded PRNG, we can ensure that the same sequence of "random" configurations is generated each time we start the server with the same seed. 
                                               return function () {
                                                                   let t = seed += 0x6D2B79F5;
                                                                    t = Math.imul(t ^ (t >>> 15), t | 1);
                                                                     t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                                                                      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
                                               };
                   }
var startSeed = 12345; // Fixed seed for reproducibility of pile configurations and forbidden moves across tournaments
            let rand = makeRandGenFromSeed(startSeed);// Seeded random number generator for reproducibility of pile configurations and forbidden moves across tournaments

    function resetConfigPiles(accountsNumber) {
                                  //let accountsNumber = Math.floor(rand() * 5) + 3; // Random number of accounts between 3 and 7
                                   let piles = []; 
                                      for (let i = 0; i < accountsNumber; i++) {
                                           let k = (1 + rand()*CONFIG.maxCoins)|0; // Random number of coins between 1 and maxCoins
                                            piles.push(k); // Random number of coins between 1 and maxCoins
                                      }
                                       CONFIG.piles  = piles ;   
    }

    function resetConfigForbiddenMoves() {
         let maxTake = Math.max(...CONFIG.piles); // The maximum number of coins that can be taken in one move is the size of the largest pile
          let forbiddenMovesCount = rand(maxTake/4)|0; // 
           for(let i=0; i<forbiddenMovesCount; i++){
               let move = Math.floor(rand() * maxTake) + 1; // Random forbidden move between 1 and maxTake
                if(!CONFIG.forbidden.includes(move)){
                    CONFIG.forbidden.push(move);
                }
           }
    }


// Store players data: { email: { idx, name, code, timeBank, score } }
// idx  is a unique index assigned to each player for matrix display purposes in order of registration,
// email is used as a unique identifier for players, and also to track match results in the matchMatrix:
// name  is the display name for the player Avatar-Bot, 
// code  is their Bot js code (function play()),
// timeBank tracks their remaining time, 
// score tracks their points in the tournament.


// --- TOURNAMENT LOGIC ---
        async function 
        saveTournamentData(data) {
                                  await fs.appendFile(TOURNAMENTS_FILE, JSON.stringify(data, null, 2));
         }
let currentTournamentId = null;
let isPaused = false;
   async function 
    startChampionship(manual=false) { // Main function to start the tournament, run matches, and broadcast results. The manual parameter indicates whether the tournament was started manually by a client request or automatically by the scheduled timeout. This allows for different handling if needed, such as resetting piles and forbidden moves only for automatic starts to allow for consistent conditions across scheduled tournaments, while manual starts could be used for testing with specific configurations.
                         if (tournamentStarted) return { success: false, reason: "Tournament Already running" };;
                         //else start the tournament
                             tournamentStarted = true; // Set the tournamentStarted flag to prevent multiple starts
                             isPaused = false;
                             currentTournamentId = `t_${Date.now()}`;
                              if (startTimeout) {// If the tournament was started early by a client request, clear the scheduled start timeout to prevent it from firing later
                                  clearTimeout(startTimeout);
                                   startTimeout = null;
                              }

                               try {
                                    // Reset Intellectual Rate and move count for all players at tournament start
                                    Object.values(players).forEach(p => { p.iRate = 0; p.nMoves = 0; });
                                    totalGamesPlanned   = calculateTotalGamesToPlay();
                                    totalGamesCompleted = 0;
                                     broadcast({ type: 'PLAYERS_LIST', players, totalGamesPlanned, totalGamesCompleted });
                                       //***************************************************************************************************************************************
                                      //***************************************************************************************************************************************
                                     await runRounRobinMatches(); // Main function to run the round-robin matches between all registered players, with the current configuration of piles, forbidden moves, and time limits. This function handles the entire flow of the tournament, including broadcasting updates to the dashboard and saving tournament data for record-keeping. It iterates through all pairs of players, runs matches between them using the runMatch function, and updates the matchMatrix with results for display on the dashboard. After all matches are completed, it broadcasts the final results and resets the tournament state for potential future tournaments.
                                    //****************************************************************************************************************************************
                                   //****************************************************************************************************************************************
                               }
                                finally {
                                         tournamentStarted = false;
                                          // Persist tournament only in Real Mode
                                          if (!CONFIG.educational) {
                                              await saveTournamentData({ players, currentTournamentId, Matrix, CONFIG });
                                          }
                                }
    }

                        function mod(x,M) {return ((x%M)+M)%M;} // Modulo function that handles negative numbers correctly, used in the round-robin scheduling algorithm to calculate player pairings based on their indices while ensuring the indices wrap around correctly when they exceed the number of players.
        async function 
         runRounRobinMatches() { // Run a round-robin tournament where each Bot plays against every other Bot. This function can be used for future enhancements, such as allowing for different tournament formats (e.g., double elimination, Swiss system) or for running multiple rounds of the tournament with different configurations. Currently, it simply iterates through all pairs of players and runs matches between them using the runMatch function.    
                                           // Create player list with indices
                               console.log("🤡🏆🤖 Championship Started!");            
                               const emails = Object.keys(players);
                               const playerList = [];
                                for (let i = 0; i < emails.length; i++) 
                                     playerList.push({
                                                      idx: players[emails[i]].idx,
                                                      name: players[emails[i]].name,
                                                      email: emails[i]
                                                    });
                                
                                // Save a snapshot of the current new tournament state, including player information and registration time, to a file for record-keeping and potential future features like displaying past tournaments or analytics. This snapshot can be used to track the history of tournaments and player participation over time.
                                const snapshot = { id: currentTournamentId, date: new Date().toISOString(), players: {...players} };
                                 if (!CONFIG.educational) await saveTournamentData(snapshot);
                               
                               // Generate and send initial tournament Matrix
                               generateInitialMatrix();
                                broadcast({ type: "TOURNAMENT_STARTED", players: players, matchMatrix: Matrix, config: CONFIG, totalGamesPlanned, totalGamesCompleted });
                               
                                // Run a round-robin tournament where each Bot plays against every other Bot
                                startSeed++; // Change the seed for each tournament to generate different pile configurations and forbidden moves for each tournament, while still maintaining reproducibility if needed by using the same seed. This allows for variety in the game conditions across tournaments, which can make the competition more interesting and challenging for the players, while still allowing for consistent conditions if desired by using a fixed seed.
/*                                
                                for (let i = 0; i < playersNumber; i++) {
                                    for (let j = i + 1; j < playersNumber; j++) {
                                        // If the tournament is paused, wait until it's resumed
                                        while(isPaused) {
                                            await delay(1000); // Check pause status every second
                                        }

                                         await runMatch(emails[i], emails[j]);
                                    }
                               }
*/

/**
    Round-robin scheduling algorithm to ensure that each player plays against every other player, while also allowing for pausing and resuming the tournament. If the number of players is odd, we add a dummy player to create an even number of players, which allows for a complete round-robin schedule without any player being left out in each round. The algorithm iterates through rounds and pairs players based on their indices, ensuring that each pair of players faces each other exactly once. During the tournament, it checks if the tournament is paused before starting each match, and if so, it waits until the tournament is resumed before proceeding with the matches. This allows for flexibility in managing the tournament flow while ensuring that all matches are completed as scheduled. 
    Example with 5 players (0,1,2,3,4) + 1 dummy X player (5) for bye rounds:
     012 123 234 340 401   
     ||| ||| ||| ||| ||| 
     543 504 510 521 532  
     X   X   X   X   X   
 */
                               let N= playersNumber;
                                if(N%2==1)N++; // If odd number of players, add a dummy player for bye rounds in the round-robin scheduling algorithm
                                 let N_ = N-1;

                                 for(let r=0; r<N-1; r++) {
                                     for(let k=0; k<N/2; k++) {
                                         while(isPaused) await delay(1000); // Check pause status every second
                                        
                                          let A = mod(r + k, N_); 
                                          let B = mod(r - k, N_); 
                                           if(k === 0) B = N_;
                                        
                                            if(A<playersNumber && B<playersNumber)
                                              await runMatch(emails[A], emails[B]);     

    }
}
                                
                                console.log("🤖🌟🤡 Championship Ended! ");
                                getMatchMatrixDisplay()
                                 console.log("Results:", Matrix);
                                 broadcast({ type: "END", players, matchMatrix: Matrix, totalGamesPlanned, totalGamesCompleted });// After all matches are done, broadcast the final results to the dashboard
                                  tournamentStarted = false;
         }   
           
        async function 
        runMatch(emailA, emailB) { // Run a match of numberOfGamesPerMatch (default: 10) games between two Bots, alternating who goes first, and applying the time carry-over logic based on the tournament mode
                                      function opponentEmail(PlayerEmail){ return  (PlayerEmail === emailA) ? emailB : emailA;}
                                 rand = makeRandGenFromSeed(startSeed);
                                 const N = CONFIG.numberOfGamesPerMatch;
                                                function resetConfigForNewMatch(game) {
                                                                                       if(game%2===0){
                                                                                                      resetConfigPiles(game);
                                                                                                      if(!CONFIG.educational)
                                                                                                         resetConfigForbiddenMoves();
                                                                                                          // Notify admin panel about config changes during tournament
                                                                                                          if (adminClient && adminClient.connected) 
                                                                                                              adminClient.send({ type: "CONFIG_UPDATED", config: CONFIG });
                                                                                                     }
                                                  
                                                                                      }
                                  setOfMatches:
                                   for (let game = 1; game <= N;resetConfigForNewMatch(game), game++) {
                                        
                                        let currentFirstPlayerEmail = (game % 2 === 1) ? emailA : emailB; // Alternate who goes first each game
                                         let botA = players[currentFirstPlayerEmail];
                                         let currentPlayerEmail = currentFirstPlayerEmail
                                         let opponentPlayerEmail = opponentEmail(currentPlayerEmail);
                                          let botB = players[opponentPlayerEmail];
                                           console.log(`Match ${game}/${N} between ${currentFirstPlayerEmail} and ${opponentPlayerEmail}`); 

                                         let state = { piles: [...CONFIG.piles], turn: currentFirstPlayerEmail};
                                           broadcast({ type: "CURRENT_FIGHT", fight: { playerA: botA.name, playerB: botB.name, game, totalGames: N }, totalGamesPlanned, totalGamesCompleted, config: CONFIG });
        
                                          // Main game loop for steps of a single game between two Bots while there are still valid moves to be made (not Game Over)
                                              let currentPlayer = botA; 
                                              let  opponentPlayer = botB;
                                               while (!isGameOver(state.piles)) {
                                                    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
                                                   //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                                                   let report = runBotSafe(currentPlayer, state.piles); //!!!!
                                                 //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                                                //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                                                   let move = report.result;
                                                    if (report.error==="BotError") {
                                                         console.log(`${currentPlayer.name} (${currentPlayerEmail}) Error:`,report.error, ', details: ', report.detail);
                                                         currentPlayer.timeBank += CONFIG.baseTime; // Penalize the player 
                                                         broadcast({ type: "DISQUALIFIED_FOR_ERROR", error: report.error,  details:report.detail,  player: currentPlayer.name, piles: state.piles, movedFrom: 0, count: 0, bonus: currentPlayer.timeBank, xorsum: -1  });
                                                          await delay(MATCH_DELAY_MS); // Slow down match for dashboard viewers
                                                         currentPlayer.score  -= 2;
                                                         opponentPlayer.score += 1;
                                                          recordMatchResult(emailA, emailB, opponentPlayerEmail, 0);
                                                           getMatchMatrixDisplay();
                                                            totalGamesCompleted += 1;
                                                            currentPlayer.iRate = (currentPlayer.iRate || 0) - 1;
                                                            currentPlayer.nMoves = (currentPlayer.nMoves || 0) + 1;   
                                                            broadcast({ type: "MATCH_UPDATE", players, matchMatrix: Matrix, winnerName: opponentPlayer.name, totalGamesPlanned, totalGamesCompleted });

                                                             continue setOfMatches; 
                                                     }
                                                          // Validate currentPlayer Move 
                                                          if (!isValidMove(move, state.piles)) {
                                                              console.log(`${currentPlayer.name} (${currentPlayerEmail}) try to do invalid move:`,move, " -forbidden moves: ", CONFIG.forbidden);
                                                              currentPlayer.timeBank += CONFIG.baseTime; // Penalize the player 
                                                              broadcast({ type: "DISQUALIFIED_FOR_INVALID_MOVE", invalidMove: move, piles: state.piles, player: currentPlayer.name, movedFrom: move.pileIndex, count: move.count, bonus: currentPlayer.timeBank, xorsum: -1  });
                                                              await delay(MATCH_DELAY_MS); // Slow down match for dashboard viewers
                                                               currentPlayer.score  -= 1;
                                                               opponentPlayer.score += 1; 
                                                               recordMatchResult(emailA, emailB, opponentPlayerEmail);
                                                                getMatchMatrixDisplay();
                                                                totalGamesCompleted += 1;
                                                                currentPlayer.iRate = (currentPlayer.iRate || 0) - 1;
                                                                currentPlayer.nMoves = (currentPlayer.nMoves || 0) + 1;   
                                                                 broadcast({ type: "MATCH_UPDATE", players, matchMatrix: Matrix, winnerName: opponentPlayer.name });

                                                                  continue setOfMatches; 
                                                          }

                                                          let xorSum = 0|0;

                                                              if(move.count == 0){ //Surrender
                                                                 currentPlayer.nMoves = (currentPlayer.nMoves || 0) + 1;                                                                                    
                                                                  console.log(`${currentPlayer.name}(${currentPlayerEmail}) surrender in position:`, state.piles);
                                                                 //currentPlayer.timeBank += CONFIG.baseTime; // Penalize the player 
                                                                  broadcast({ type: "SURRENDERED", player: currentPlayer.name, piles: state.piles, movedFrom: move.pileIndex, count: move.count, bonus: currentPlayer.timeBank, xorsum: xorSum });
                                                                   opponentPlayer.score += 1; 
                                                                   recordMatchResult(emailA, emailB, opponentPlayerEmail);
                                                                    getMatchMatrixDisplay();
                                                                     broadcast({ type: "MATCH_UPDATE", players, matchMatrix: Matrix, winnerName: opponentPlayer.name });

                                                                      continue setOfMatches; 
                                                              }

                                                                // Apply Valid Move
                                                                state.piles[move.pileIndex] -= move.count;
                                                                currentPlayer.nMoves = (currentPlayer.nMoves || 0) + 1;
                                                                    

                                                                 
                                                                 
                                                                // Compute xor-sum after the move and update Intellectual Rate (iRate) if xor==0
                                                                //xorSum = evaluateXORState(state.piles);
                                                                xorSum = evaluateMEXState(state.piles);

                                                                 if (xorSum === 0) {
                                                                    currentPlayer.iRate = (currentPlayer.iRate || 0) + 1;
                                                                    //console.log(`${currentPlayer.name} achieved xor-sum 0 — iRate now ${currentPlayer.iRate}`);
                                                                 }

                                                                // Broadcast updated players list so leaderboard updates immediately after every correct move
                                                                //try { broadcast({ type: 'PLAYERS_LIST', players, totalGamesPlanned, totalGamesCompleted,  }); } catch (e) { }

                                                                 broadcast({ type: "MOVE", player: currentPlayer.name, piles: state.piles, movedFrom: move.pileIndex, count: move.count, bonus: currentPlayer.timeBank, xorsum: xorSum });

                                                                  await delay(MOVE_DELAY_MS); // Slow down move for dashboard viewers
                                                                  
                                                                  if(isGameOver(state.piles))break; // If the game is over after the current player's move, exit the loop before switching players to determine the winner correctly
                                                                  // Determine current player and opponent based on the turn
                                                                    currentPlayer = opponentPlayer; 
                                                                    currentPlayerEmail = opponentPlayerEmail
                                                                     opponentPlayerEmail = opponentEmail(currentPlayerEmail);
                                                                      opponentPlayer = players[opponentPlayerEmail];
                    

                                                   }
                                            // Determine Winner & Time Carry-over logic
                                            //if(CONFIG.mode === "NORMAL")                             
                                            let  winnerEmail =   currentPlayerEmail
                                             //console.log(`Winner email : ${winnerEmail} `);                                                                                                                         
                                              console.log(`Winner of match : ${currentPlayer.name} `);                                                                                                                         
                                             currentPlayer.score += 1;
                                              recordMatchResult(emailA, emailB, winnerEmail);
                                               getMatchMatrixDisplay();
                                                totalGamesCompleted += 1;
                                                 broadcast({ type: "MATCH_UPDATE", players, matchMatrix: Matrix, winnerName: players[winnerEmail].name, totalGamesPlanned, totalGamesCompleted });

                                                  await delay(MATCH_DELAY_MS); // Slow down match for dashboard viewers
                                   }
            }
            // Bots (player) Code EXECUTION on current state (currentPiles) by the "Referee logics" 
            function runBotSafe(player, currentPiles) {
            
                     const sandbox = { // Provide the Bot with a safe, read-only view of the game state
                                      piles: [...currentPiles], // Provide a copy of the piles to prevent cheating
                                      forbidden: CONFIG.forbidden,// Provide forbidden moves for bot's logic
                                      context: { mode: CONFIG.mode, timeRemaining: player.timeBank }, // Additional context for bots to make informed decisions
                                      result: null // This will hold the Bot's move after executing their play() function
                                     };
            
                     // Construct the code to execute the player's Bot play() function and capture its result 
                     const botCodeString=`result = (${player.code})(piles, forbidden, context)`
                     // Compile the Bot code in virtual machine 
                      const  botScript = new vm.Script(botCodeString);
                       try {
                            vm.createContext(sandbox);// Create a new context for each execution to prevent state sharing
                           
                           // Run with time limit
                            let timeLimit = CONFIG.baseTime; // Add baseTime to ensure Bots have at least some time to make a move even if their timeBank is low
                             //start time 
                             const startTime = Date.now();  
                             // Run the Bot code with a timeout to prevent infinite loops or long execution times. The timeout is set to the player's remaining time bank. 
                              botScript.runInContext(sandbox, { timeout: timeLimit }); // Add baseTime to ensure Bots have at least some time to make a move even if their timeBank is low
                               //end time
                               const endTime = Date.now();
                                const duration = endTime - startTime;
                                // player.timeBank = timeLimit - duration; // Subtract the time spent from the player's time bank
                                 player.timeBank +=  duration; // Subtract the time spent from the player's time bank
                                 let report = { result: sandbox.result, timeSpent: duration, error: "No Error", detail: "" }
                                  return report; // contains the move = sandbox.result from the Bot's play() function
                         }
                        catch (err) {// If there's an error (syntax error, runtime error, timeout), we consider it an invalid move and disqualify the player for that match
                                   let report = {result: sandbox.result, timeSpent:CONFIG.baseTime,error: "BotError", detail: err.message }
                                    return report; // move={} and error is "ABUSER" to indicate the Bot code is not compliant with the rules (syntax error, runtime error, or timeout)
                                 }
            }

            function recordMatchResult(emailA, emailB, winnerEmail, bonus=0) {
                                       const key = [emailA, emailB].sort().join('|');
                                       // matchMatrix structure: { "emailA|emailB": { playerA, playerB, winsA, winsB, bonusA, bonusB } }
                                        if (!matchMatrix[key]) 
                                             matchMatrix[key] = {
                                                                 playerA: emailA,
                                                                 playerB: emailB,
                                                                 winsA: 0,
                                                                 winsB: 0,
                                                                 bonusA: 0,
                                                                 bonusB: 0
                                                                };
                                         
                                   
                                         let row = matchMatrix[key]; // find the correct row for the match of emailA against emailB, regardless of player order
                                          if (winnerEmail === emailA) {
                                                                       row.winsA += 1;
                                                                       row.bonusA += bonus;
                                                                      }
                                           else {// winner is emailB
                                                                       row.winsB += 1;
                                                                       row.bonusB += bonus;
                                                }
            }     

// tournament matrix to store and display the results of matches in a structured way for the dashboard. The matrix is indexed by player indices and contains the number of wins and bonus points for each player against every other player. This allows the dashboard to easily display a comprehensive view of the tournament results.                              
var Matrix = [];
            // Generate initial tournament matrix
            function generateInitialMatrix() {
                                              for (let i = 0; i < playersNumber; i++) {
                                                Matrix[i] = [];
                                                for (let j = 0; j < playersNumber; j++) 
                                                    Matrix[i][j] = { winsA: 0, winsB: 0, bonusA: 0, bonusB: 0 };
                                             }
            }
            function getMatchMatrixDisplay() {
                                              // Fill matrix with match results using player indices
                                              for (let key in matchMatrix) {
                                                   let row = matchMatrix[key];
                                                   let idxA = players[row.playerA].idx;
                                                   let idxB = players[row.playerB].idx;
                                                  
                                                    Matrix[idxA][idxB] = {
                                                                          winsA: row.winsA,
                                                                          winsB: row.winsB,
                                                                          bonusA: row.bonusA,
                                                                          bonusB: row.bonusB
                                                                        };
                                             
                                                   Matrix[idxB][idxA] = {
                                                                         winsA: row.winsB,
                                                                         winsB: row.winsA,
                                                                         bonusA: row.bonusB,
                                                                         bonusB: row.bonusA
                                                                        };
                                              }
                                               return Matrix;
                                              
            }



// *** HELPER FUNCTIONS ************************************************************************************************************

                function calculateTotalGamesToPlay() {
                                                       const N = Object.keys(players).length;
                                                        return NUMBER_OF_GAMES_PER_MATCH * N * (N - 1) / 2;
                }

                function evaluateXORState(piles) {return piles.reduce((acc, v) => acc ^ v, 0);}
/*
     let forbidden = [2,5] 
      

*/
                function evaluateMEXState(piles) {
                    const mode      = CONFIG.mode;
                    const forbidden = CONFIG.forbidden || [];
                    const maxPile   = Math.max(...piles);
                    const  forbiddenSet = new Set(forbidden);

                    // Compute Grundy values for all pile sizes up to the largest pile.
                    const  grundy = Array(maxPile + 1).fill(0);
                     for (let n = 1; n <= maxPile; n++) {
                         const reachable = new Set();
                          // 
                          for (let k = 1; k <= n; k++) {
                              if (forbiddenSet.has(k)) continue;

                               reachable.add(grundy[n - k]);
                          }
                           let mex = 0;
                            while (reachable.has(mex)) mex++;
                            
                             grundy[n] = mex;
                     }

                      const x = piles.reduce((acc, p) => acc ^ grundy[p], 0);
                    const isMisere = mode === 'GIVEAWAY';

                           if (isMisere) {
                               let ones = 0;
                               let big = 0;
                               for (const p of piles) {
                                   if (p === 1) ones++;
                                   else if (p > 1) big++;
                               }
       
                               if (big <= 1) {
                                   for (let i = 0; i < piles.length; i++) {
                                       if (piles[i] > 0) {
                                           const take = big ? piles[i] - ((ones % 2) ? 1 : 0) : 1;
                                           if (take >= 1 && !forbiddenSet.has(take) && take <= piles[i]) {
                                               return x;
                                           }
                                       }
                                   }
                                    return 0;
                               }
                           }
                           // else normal play, just 
                                 return x;

                }

                function isValidMove(move, piles) {
                                                    if (!move || move.pileIndex === undefined) return false; // move must exists and specify a existing pile index
                                                    if (CONFIG.forbidden.includes(move.count)) return false; // Check if the move count is in the forbidden list
                                                    // negative moves forbidden and gamer must take at least 1 from a pile, and cannot take more than what's available in the chosen pile
                                                    if (move.count < 0 || move.count > piles[move.pileIndex]) return false;
                
                                                    // else move is valid if it passes all checks
                                                       return true;
                }
                
                function isGameOver(piles) {
                                            // Game is over if all piles are empty (a player took the last item) or if there are no valid moves left for the next player (all remaining moves are forbidden)
                                            return piles.every(p => p === 0) || getAvailableMoves(piles).length === 0;
                }
                
                function getAvailableMoves(piles) {
                                                    // Used by the "Ideal Opponent" or to check if a bot is stuck
                                                   let moves = [];
                                                   for (let idx = 0; idx < piles.length; idx++) {
                                                       for (let i = 1; i <= piles[idx]; i++) {
                                                           if (!CONFIG.forbidden.includes(i)) {
                                                               moves.push({pileIndex: idx, count: i});
                                                           }
                                                       }
                                                   }
                                                     return moves;
                }
                
                function broadcast(data) {
                                          io.send(data);
                }
                async function delay(time) {
                                            await new Promise(delayresolve => setTimeout(delayresolve, time /*ms*/)); // Slow down for dashboard viewers
                } 



