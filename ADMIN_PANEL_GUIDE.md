# Admin Panel - Complete Guide

## Overview

The Admin Panel is a secure, real-time interface for tournament administrators to control the entire championship flow. Administrators can start/pause/resume tournaments, configure game rules, monitor player registrations, inspect bot code, and track tournament progress—all with live updates across all connected clients.

---

## Quick Access

| Element | Details |
|---------|---------|
| **URL** | `http://localhost:3000/adminAKME` |
| **Default Password** | `100` |
| **Authentication** | SHA256 hashed on server-side |
| **Session** | Persists until logout or disconnect |

---

## Login & Authentication

### How to Log In
1. Navigate to `http://localhost:3000/adminAKME`
2. Enter admin password: `100`
3. Press **Enter** or click **Login**
4. Upon success, the login view closes and admin panel appears

### Authentication Process
- Password is sent via WebSocket to the server
- Server validates using SHA256 hash: `449904569c19c55d7537de6e946ccedbc4e4a4d874bdf3263e2efa7c72aa0d35`
- Authentication succeeds → Admin panel loads with current tournament state
- Authentication fails → Error message appears, can retry

### What Happens on Login
Admin receives:
- ✅ All currently registered players
- ✅ Current game configuration
- ✅ Tournament start time (countdown delta)
- ✅ Game progress (completed/planned games)
- ✅ All future real-time updates

---

## Main Admin Panel Sections

### 1️⃣ Tournament Start Countdown

**Display:** Large timer showing `HH:MM:SS` format

**Behavior:**
- Shows time until automatic tournament start
- Countdown starts when server initializes (typically some seconds)
- Updates every second in real-time
- Changes to "🎉 Tournament Started!" when tournament begins

**Manual Controls:**
| Button | Action |
|--------|--------|
| 🚀 **Start Tournament** | Immediately start tournament (overrides scheduled start) |
| ⏸ **Pause** | Pause all active matches and matches to come |
| ▶ **Resume** | Resume a paused tournament |
| 🔄 **New Tournament** | Reset everything and start fresh (asks for confirmation) |

### 2️⃣ Registered Players

**Display:** Real-time table of all registered players

**Columns:**
- **Email** - Player's registered email address
- **Bot Name** - Bot avatar name (e.g., 🐶,🐼,🐸)
- **Registration Time** - When player registered (local time)
- **Connection Status** - 🟢 Connected or 🔴 Disconnected

**Features:**
- Updates in real-time as players register
- Automatically removes duplicate registrations (same email)
- Shows built-in microbots (🤖, 🤡, ☃️) if educational mode enabled
- Auto-reconnection handling - shows status changes instantly
- Player count displayed at bottom

**Interpretation:**
- 🟢 Connected = Player is currently connected to server
- 🔴 Disconnected = Player disconnected but data is preserved
- Disconnected players can re-register with same email

### 3️⃣ Game Configuration Editor

Configure game rules that apply to ALL matches in the tournament. Changes broadcast immediately to all connected clients.

#### **Piles (Comma-separated integers)**
- **Example:** `3,5,7` = Three piles with 3, 5, and 7 coins
- **Required:** At least one pile
- **Purpose:** Initial game state for all matches
- **Updates:** Takes effect for new matches, not retroactive

#### **Forbidden Moves (Comma-separated integers)**
- **Example:** `3,5` = Players cannot take 3 or 5 coins in a single move (in base Nim it is `0`)
- **Can be empty:** Leave blank for no forbidden moves
- **Purpose:** Restricts valid moves to enhance game difficulty
- **Educational use:** Explore game theory impacts

#### **Max Coins (Integer)**
- **Example:** `10` = Maximum coins in any pile (for random generation)
- **Default:** `10`
- **Purpose:** If using random pile generation instead of manual piles
- **Current use:** Mostly for educational/test scenarios

#### **Base Time (Milliseconds)**
- **Example:** `10` = Each bot gets max 10ms per move
- **Default:** `10` ms
- **Typical range:** 5-10 ms
- **Purpose:** Controls how long bots have to calculate moves
- **Effect:** Too low = bots may has timeouts errors; Too high = tournament takes forever

#### **Educational Mode (Checkbox)**
- **When enabled:**
  - Clients see Grundy numbers for each pile
  - XOR-sum indicators (👍 (winning move) or 👎🏿 (losing move)) 
  - Move history log with player indicators
  - Performance optimizations for Grundy caching
- **When disabled:**
  - Standard tournament mode
  - No game theory analysis shown
  - Slightly faster execution
- **Purpose:** Switch between competitive and classroom modes

#### **Move Delay (Slider, 0-2000ms)**
- **Default:** `100` ms
- **Current value:** Displayed next to label
- **Purpose:** Delay between each individual move
- **Effect:** 
  - Higher = Slower moves, easier to watch
  - Lower = Faster moves, hard to follow
- **Pro tip:** Increase for classroom demonstrations

#### **Match Delay (Slider, 0-2000ms)**
- **Default:** `2000` ms
- **Current value:** Displayed next to label
- **Purpose:** Delay between match start and next match
- **Effect:**
  - Higher = More time between matches
  - Lower = Continuous fast games
- **Pro tip:** Increase for live presentations

#### **Update Process**
1. Modify one or more fields
2. Click **💾 Update Config** button
3. Server validates inputs
4. Configuration broadcasts to all clients
5. Confirmation message appears: "Configuration updated successfully at [time]"
6. Confirmation history shows in pre-formatted box below button

**Validation:**
- ✅ At least one pile required
- ✅ All number fields must be valid integers
- ⚠️ Invalid entries are skipped (non-numeric parts ignored)
- Example: `3, 5x, 7` → Parses as `[3, 5, 7]` (x ignored)

---

### 4️⃣ View Bot Code

**Dropdown:** Select a player from the list

**When Selected:**
- Player's bot code displays with syntax highlighting
- Language detected as JavaScript automatically
- Powered by Highlight.js library

**Features:**
- Code is read-only (for inspection only)
- Syntax highlighting makes code readable
- Shows exactly what the bot code looks like on server
- Helps debug bot issues

**Example:**
If a player's code has infinite loops or syntax errors, you can see them here before execution starts.

---

### 5️⃣ Tournament Status

Real-time display of tournament state:

| Item | Display | Meaning |
|------|---------|---------|
| **Status** | "Waiting to start..." / "Tournament Running" / "Paused" / "Ended" | Current tournament state |
| **Total Players** | `0-N` | Number of registered players (including microbots) |
| **Game Progress** | `3 / 10 (30.00%)` | Completed / Planned games with percentage |
| **Connection** | 🟢 Connected / 🔴 Disconnected / ⚠️ Error | WebSocket connection status |

**Status Colors:**
- 🟢 Green (`#00ffcc`) = Tournament running or ready
- 🟡 Orange (`#ffaa00`) = Tournament paused
- 🔴 Red (`#ff6b6b`) = Tournament ended
- 🔵 Gray (`#999`) = Disconnected

**Progress Calculation:**
- Total games planned = N × (N-1) / 2 (complete round-robin)
- Example: 4 players = 6 total games
- Updates after each match completes

---

## Real-Time Updates

The admin panel automatically receives and displays:

| Event | What Updates |
|-------|--------------|
| Player registers | Player list table, total player count |
| Player connects | Connection status (🟢 Connected) |
| Player disconnects | Connection status (🔴 Disconnected) |
| Tournament starts | Countdown → "🎉 Tournament Started!", status changes |
| Match begins | Game progress updates |
| Match ends | Game progress percentage increases |
| Configuration updated | All config fields update on all admin instances |
| Tournament paused/resumed | Status color and text changes |
| Tournament ends | Status changes to "Tournament Ended" |

---

## Common Workflows

### Scenario 1: Standard Tournament Flow
1. ✅ Server starts - countdown timer appears
2. ✅  Players register - watch them appear in player table
3. ✅   Countdown reaches zero - tournament auto-starts
4. ✅    Watch game progress increase in real-time
5. ✅     Tournament ends - status shows "Ended"

### Scenario 2: Pre-Tournament Configuration
1. Open admin panel before countdown ends
2. Modify piles, forbidden moves, delays
3. Click **💾 Update Config**
4. Players see new configuration on their dashboards
5. Start tournament when ready

### Scenario 3: Educational Mode Demo
1. Enable **Educational Mode** checkbox
2. Adjust move delay to `500` ms (slower for visibility)
3. Adjust match delay to `1000` ms
4. Students see Grundy numbers while watching games
5. Explain game theory concepts based on visual display

### Scenario 4: Emergency Pause
1. Tournament is running normally
2. Issue discovered (bug, unfair bot, etc.)
3. Click **⏸ Pause** immediately
4. All active matches pause
5. Fix issue and click **▶ Resume** to continue

### Scenario 5: Inspect Problem Bot
1. Tournament is running
2. A player's bot keeps timing out
3. In **View Bot Code** dropdown, select the player
4. Read their code
5. Identify infinite loop or inefficient algorithm
6. Communicate feedback to player

---

## Changing the Admin Password

### Step 1: Generate New Password Hash
In Node.js terminal:
```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-new-password').digest('hex'))"
```

Or use an online SHA256 generator.

### Step 2: Update server.js
Edit `server.js` and find this line (~line 48):
```javascript
const ADMIN_PASSWORD_HASH = '449904569c19c55d7537de6e946ccedbc4e4a4d874bdf3263e2efa7c72aa0d35';
```

Replace with your new hash:
```javascript
const ADMIN_PASSWORD_HASH = '8d969eef6ecad3c29a3a873fba8fe436a02f0b44f96a1d0d37e9ae67ad96fed9'; // "newpassword123"
```

### Step 3: Restart Server
```bash
node server.js
```

New password takes effect immediately.

---

## Troubleshooting

### Cannot Access Admin Panel

**Problem:** Getting 404 or page not found

**Solutions:**
- ✅ Verify URL: `http://localhost:3000/adminAKME` (note the route)
- ✅ Check server is running: `ps aux | grep node`
- ✅ Verify port 3000 is correct (check server console)

### Login Fails with Wrong Password Message

**Problem:** "Invalid password" error despite entering correct password

**Solutions:**
- ✅ Confirm default password is `A..E` (check server.js line 48)
- ✅ No spaces around password - don't include spaces
- ✅ Clear browser cache and try again
- ✅ Try different browser (Chrome, Firefox, Safari, etc.)
- ✅ Verify JavaScript is enabled in browser

### Connection Status Shows "Disconnected"

**Problem:** Admin panel shows 🔴 Disconnected

**Causes & Fixes:**
| Cause | Fix |
|-------|-----|
| Server crashed | Restart: `node server.js` |
| Network issue | Check internet connection |
| Browser tab closed server tab | Refresh admin page |
| Server port changed | Update URL to correct port |

**Auto-Reconnect:** Admin automatically attempts to reconnect every 3 seconds

### Player List Not Updating

**Problem:** New players registered but don't appear in table

**Solutions:**
- ✅ Refresh admin page (`Ctrl+R` or `Cmd+R`)
- ✅ Verify connection status shows 🟢 Connected
- ✅ Check browser console (`F12`) for errors
- ✅ Confirm server received registrations (check server logs)

### Configuration Changes Not Applied

**Problem:** Clicked "Update Config" but players don't see new settings

**Solutions:**
- ✅ Verify connection is 🟢 Connected
- ✅ Check "Configuration updated successfully" message appeared
- ✅ Verify input is valid (at least one pile)
- ✅ Ask players to refresh their page
- ✅ Check server logs for errors

### Cannot View Bot Code

**Problem:** Code viewer shows "Loading code..." forever

**Solutions:**
- ✅ Verify player is in the dropdown (they registered)
- ✅ Check connection is 🟢 Connected
- ✅ Try selecting different player first, then retry
- ✅ Restart admin panel and login again

### Tournament Won't Start

**Problem:** Countdown shows but tournament doesn't start after timer ends

**Solutions:**
- ✅ Try clicking **🚀 Start Tournament** button manually
- ✅ Verify connection status is 🟢 Connected
- ✅ Check server console for errors
- ✅ Restart server and try again

### Pause/Resume Not Working

**Problem:** Click button but tournament keeps running

**Solutions:**
- ✅ Verify connection status is 🟢 Connected
- ✅ Wait a moment - action may be processing
- ✅ Check browser console (`F12`) for error messages
- ✅ Try logout and re-login

---

## Socket.IO Messages

### Messages Sent by Admin

```javascript
// Login with password
{ type: "ADMIN_LOGIN", password: "100" }

// Tournament control
{ type: "ADMIN_START" }
{ type: "ADMIN_PAUSE" }
{ type: "ADMIN_RESUME" }
{ type: "ADMIN_NEW_TOURNAMENT" }

// Configuration update
{
  type: "ADMIN_UPDATE_CONFIG",
  config: {
    piles: [3, 5, 7],
    forbidden: [3, 5],
    maxCoins: 10,
    baseTime: 10,
    educational: true,
    moveDelayMs: 100,
    matchDelayMs: 2000
  }
}

// Request bot code
{
  type: "ADMIN_REQUEST_BOT_CODE",
  email: "player@email.com"
}
```

### Messages Received from Server

```javascript
// Authentication success
{
  type: "ADMIN_AUTH_SUCCESS",
  players: { /* all players */ },
  config: { /* current config */ },
  tournamentStartTime: 1234567890
}

// Authentication failure
{
  type: "ADMIN_AUTH_FAILURE",
  message: "Invalid password"
}

// Player events
{ type: "PLAYER_REGISTERED", email: "...", name: "...", registrationTime: 1234567890 }
{ type: "PLAYER_DISCONNECTED", email: "..." }
{ type: "PLAYER_RECONNECTED", email: "..." }

// Tournament events
{ type: "TOURNAMENT_STARTED", players: { /* ... */ }, totalGamesPlanned: 10, totalGamesCompleted: 0 }
{ type: "CONTEST_PAUSED" }
{ type: "CONTEST_RESUMED" }
{ type: "END", totalGamesPlanned: 10, totalGamesCompleted: 10 }
{ type: "NEW_CONTEST_BEGINS" }

// Configuration
{ type: "CONFIG_UPDATED", config: { /* ... */ } }
{ type: "ADMIN_CONFIG_UPDATED" }

// Bot code
{ type: "ADMIN_BOT_CODE_RESPONSE", email: "...", code: "function play() {...}" }
```

---

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 90+ | ✅ Full support | Recommended |
| Firefox 88+ | ✅ Full support | Recommended |
| Safari 14+ | ✅ Full support | Recommended |
| Edge 90+ | ✅ Full support | Recommended |

**Requirements:**
- ✅ Socket.IO support (all modern browsers)
- ✅ JavaScript enabled
- ✅ Web Crypto API (for SHA256 hashing)

---

## Best Practices

### Before Tournament
1. ✅ Review game configuration (piles, forbidden moves, delays)
2. ✅ Verify at least one microbot is registered
3. ✅ Adjust delays for visibility if needed
4. ✅ Enable Educational Mode if teaching

### During Tournament
1. ✅ Monitor game progress percentage
2. ✅ Watch for connection issues (🔴 Disconnected status)
3. ✅ Keep browser tab visible (background tabs may throttle)
4. ✅ Don't close admin tab unless intentional

### On Issues
1. ✅ Use bot code viewer to inspect problematic bots
2. ✅ Use pause button to stop tournament if needed
3. ✅ Always confirm before clicking "New Tournament"
4. ✅ Check server console for detailed error messages

---

## Security Considerations

### Current Implementation
- ✅ Password sent via WebSocket (use HTTPS in production!)
- ✅ Server validates SHA256 hash, not plaintext
- ✅ Session-based authentication (logout ends access)
- ✅ Admin-only commands rejected if not authenticated

### Production Deployment
For production use, recommend:
1. **HTTPS/WSS** - Encrypt all communication
2. **Stronger password** - Change from default `100`
3. **Rate limiting** - Prevent brute force attacks
4. **Audit logging** - Log all admin actions
5. **Session timeout** - Auto-logout after inactivity

---

## Advanced Configuration

### Adjusting for Live Demonstrations
**Goal:** Slow down action for classroom visibility

Recommended settings:
```
Move Delay: 500 ms     (was 100 ms)
Match Delay: 2000 ms   (was 2000 ms)
Educational Mode: ON
Base Time: 50 ms       (was 10 ms)
```

### Performance Tuning
**Goal:** Run fast automated tournaments

Recommended settings:
```
Move Delay: 10 ms
Match Delay: 100 ms
Educational Mode: OFF
Base Time: 5 ms
Max players: 50+
```

### Game Theory Exploration
**Goal:** Study Grundy numbers and winning/losing positions

Recommended settings:
```
Educational Mode: ON
Piles: 1,3,5,7
Forbidden: (empty)
Move Delay: 500 ms
Base Time: 100 ms
```

---

## Support

For issues or questions:
1. Check browser console (`F12` → Console tab) for errors
2. Check server terminal for error messages
3. Verify connection status is 🟢 Connected
4. Try logout and re-login
5. Restart server if needed: `node server.js`
