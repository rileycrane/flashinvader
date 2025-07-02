# Space Invaders Flash Stream

A live streaming app that displays Space Invaders flashes with retro-style animations, sound effects, filtering, leaderboards, and an interactive map view.

## Features

- **Live Updates**: Automatically fetches new flashes every 5 seconds
- **Retro Animations**: New flashes appear with pixel-art inspired animations
- **Sound Effects**: 8-bit style shoot sound when new flashes appear (can be toggled on/off)
- **City Filtering**: Filter flashes by city using the dropdown menu
- **Leaderboard**: Shows top 10 players with flash counts, click to filter by player
- **Interactive Map**: Toggle map view to see flashes exploding on their city locations
- **Dynamic Stats**: Flash and player counts update with visual animations
- **Responsive Design**: Works on desktop and mobile devices
- **Green Terminal Aesthetic**: Classic retro gaming look with green-on-black color scheme

## How to Run

Simply open `index.html` in your web browser. The app will start fetching live data from the Space Invaders API.

You can also use a local web server if you prefer:
```bash
# Using Python 3
python3 -m http.server 8080

# Or using Node.js
npx http-server
```

Then open http://localhost:8080 in your browser.

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