# Space Invaders Flash Stream

A live streaming app that displays Space Invaders flashes with retro-style animations, sound effects, filtering, leaderboards, and an interactive map view. Features intelligent rate limiting and replay buffer system to avoid IP bans.

## Features

- **Live Updates**: Fetches data every 60 seconds to avoid rate limiting
- **Replay Buffer**: New flashes are queued and replayed in real-time with proper timing
- **Anti-Ban Protection**: Automatic rate limiting, jitter, and browser-like headers
- **Retro Animations**: New flashes appear with pixel-art inspired animations
- **Sound Effects**: 8-bit style shoot sound when new flashes appear (can be toggled on/off)
- **City Filtering**: Filter flashes by city using the dropdown menu
- **Leaderboard**: Shows top 10 players with flash counts, click to filter by player
- **Interactive Map**: Toggle map view to see flashes exploding on their city locations
- **Dynamic Stats**: Flash and player counts update with visual animations
- **Responsive Design**: Works on desktop and mobile devices
- **Green Terminal Aesthetic**: Classic retro gaming look with green-on-black color scheme

## Anti-Ban Features

- **Dual Endpoint System**: Primary API with automatic fallback to HTML scraping
- **Reduced Frequency**: API calls every 60 seconds instead of every 5 seconds
- **Replay Buffer**: Simulates real-time updates by replaying cached flashes
- **Smart Rate Limiting**: Automatically increases intervals if rate limited (403/429 errors)
- **Request Jitter**: Adds random delays to avoid predictable patterns
- **Browser Headers**: Uses realistic browser headers to avoid detection
- **Status Notifications**: Shows rate limiting status and current endpoint
- **Graceful Degradation**: Continues working even when rate limited
- **Automatic Recovery**: Switches back to primary API when available

## Endpoint Fallback System

The app uses a sophisticated dual-endpoint system for maximum reliability:

### **Primary Endpoint** 
- `https://api.space-invaders.com/flashinvaders/flashes/`
- Direct JSON API (preferred)
- Faster and more efficient

### **Fallback Endpoint**
- `https://www.space-invaders.com/flashinvaders/`
- HTML page with embedded JSON
- Automatically used when primary fails
- Parses JSON from `var flashData = JSON.parse('...');`

### **Fallback Logic**
1. **Try Primary**: Always attempt primary API first
2. **Handle Errors**: Catch 403, 429, and other errors
3. **Switch to Fallback**: Automatically use HTML scraping
4. **Auto Recovery**: Switch back to primary when available
5. **Visual Feedback**: Status indicator shows current endpoint

## How the Replay System Works

1. **API Fetch**: Every 60 seconds, fetch new flashes from the API
2. **Buffer Storage**: New flashes are stored in a replay buffer with timestamps
3. **Real-time Replay**: Every 2 seconds, check if any buffered flashes should be displayed
4. **Smooth Animation**: Flashes appear with proper animations and sound effects
5. **Time Shift**: Flashes appear ~1 minute after they actually occurred, but feel real-time

## How to Run

### **Option 1: Using CORS Proxy Server (Recommended)**

1. **Start the proxy server:**
   ```bash
   python3 cors-proxy-server.py
   ```

2. **Open your browser:**
   ```
   http://localhost:8080
   ```

The proxy server handles CORS issues and provides both primary and fallback endpoints.

### **Option 2: Simple HTTP Server**

If you want to test without the proxy (fallback only):
```bash
# Using Python 3
python3 -m http.server 8080

# Or using Node.js
npx http-server
```

**Note**: Without the proxy server, you may encounter CORS issues with the primary API.

## Controls

- **Sound Toggle**: Click the speaker icon (🔊/🔇) to turn sound effects on/off
- **Map Toggle**: Click the map icon (🗺️) to open the interactive map view
- **City Filter**: Use the dropdown to filter flashes by city
- **Leaderboard**: Click on any player name to filter flashes by that player
- **Stats Display**: Shows total flash count and player count with animations

## Map Features

- **Interactive Map**: Shows France with all flash locations
- **Explosion Effects**: New flashes appear with explosion animations on their city locations
- **City Markers**: Each flash creates a green marker on the map
- **Popups**: Click markers to see player info and flash images
- **Dark Theme**: Retro-styled dark map tiles

## Technical Details

- Uses the Space Invaders API to fetch flash data
- Displays up to 50 most recent flashes (filtered)
- New flashes appear at the top with a cascade effect
- Images are lazy-loaded for better performance
- Sound effects created using Web Audio API for authentic 8-bit feel
- Interactive map powered by Leaflet.js
- Real-time filtering and leaderboard updates

## Customization

You can modify these settings in `app.js`:
- `maxFlashes`: Maximum number of flashes to display (default: 50)
- Update interval: Change the `setInterval` value (default: 5000ms)
- Sound effects: Modify the Web Audio API parameters in `createShootSound()`
- City coordinates: Add more cities to `initializeCityCoordinates()`