class SpaceInvadersFlashApp {
    constructor() {
        // Check if we're running locally or on Railway with our proxy server
        this.isLocal = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('railway.app'); // Add Railway detection
        
        if (this.isLocal) {
            // Use local proxy endpoints (works for both localhost and Railway)
            this.apiUrl = '/api/primary';
            this.fallbackUrl = '/api/fallback';
        } else {
            // Use direct endpoints (for other production deployments)
            this.apiUrl = 'https://api.space-invaders.com/flashinvaders/flashes/';
            this.fallbackUrl = 'https://www.space-invaders.com/flashinvaders/';
        }
        
        this.baseImageUrl = 'https://api.space-invaders.com';
        
        // Debug logging for deployment
        console.log(`🔍 Hostname: ${window.location.hostname}`);
        console.log(`🔍 Using proxy: ${this.isLocal}`);
        console.log(`🔍 API URL: ${this.apiUrl}`);
        console.log(`🔍 Fallback URL: ${this.fallbackUrl}`);
        this.flashContainer = document.getElementById('flashContainer');
        this.flashCountElement = document.getElementById('flashCount');
        this.playerCountElement = document.getElementById('playerCount');
        this.bufferStatusElement = document.getElementById('bufferStatus');
        this.endpointStatusElement = document.getElementById('endpointStatus');
        this.soundToggle = document.getElementById('soundToggle');
        this.mapToggle = document.getElementById('mapToggle');
        this.cityFilter = document.getElementById('cityFilter');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.mapView = document.getElementById('mapView');
        this.filtersToggle = document.getElementById('filtersToggle');
        this.filtersContent = document.getElementById('filtersContent');
        this.shootSound = document.getElementById('shootSound');
        
        this.soundEnabled = true;
        this.mapVisible = false;
        this.filtersCollapsed = true; // Start collapsed by default
        this.seenFlashes = new Set();
        this.maxFlashes = 50;
        this.allFlashes = [];
        this.filteredFlashes = [];
        this.selectedPlayer = null;
        this.cities = new Set();
        this.playerStats = new Map();
        this.map = null;
        this.cityCoordinates = new Map();
        this.currentFlashCount = 0;
        this.currentPlayerCount = 0;
        
        // Replay buffer system to reduce API calls
        this.replayBuffer = [];
        this.lastFetchTime = 0;
        this.fetchInterval = 60000; // 1 minute between API calls
        this.replayInterval = 2000; // 2 seconds between replaying buffered flashes
        this.isReplaying = false;
        this.usingFallback = false; // Track which endpoint we're using
        
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        this.mapToggle.addEventListener('click', () => this.toggleMap());
        this.cityFilter.addEventListener('change', () => this.applyFilters());
        this.filtersToggle.addEventListener('click', () => this.toggleFilters());
        
        // Initialize city coordinates (you can expand this list)
        this.initializeCityCoordinates();
        
        // Initialize filters as collapsed
        this.initializeFiltersState();
        
        // Create a simple shoot sound using Web Audio API as fallback
        this.createShootSound();
        
        // Start fetching data
        this.fetchFlashes();
        
        // Set up periodic API fetches (much less frequent)
        setInterval(() => this.fetchFlashes(), this.fetchInterval);
        
        // Set up replay system for smooth updates (check every 500ms for precise timing)
        setInterval(() => this.processReplayBuffer(), 500);
    }
    
    initializeCityCoordinates() {
        // Add coordinates for major cities (you can expand this)
        this.cityCoordinates.set('Paris', [48.8566, 2.3522]);
        this.cityCoordinates.set('Marseille', [43.2965, 5.3698]);
        this.cityCoordinates.set('Lyon', [45.7640, 4.8357]);
        this.cityCoordinates.set('Toulouse', [43.6047, 1.4442]);
        this.cityCoordinates.set('Nice', [43.7102, 7.2620]);
        this.cityCoordinates.set('Nantes', [47.2184, -1.5536]);
        this.cityCoordinates.set('Strasbourg', [48.5734, 7.7521]);
        this.cityCoordinates.set('Montpellier', [43.6110, 3.8767]);
        this.cityCoordinates.set('Bordeaux', [44.8378, -0.5792]);
        this.cityCoordinates.set('Lille', [50.6292, 3.0573]);
        // Add more cities as needed
    }
    
    initializeFiltersState() {
        if (this.filtersCollapsed) {
            this.filtersContent.classList.add('collapsed');
            this.filtersToggle.classList.add('collapsed');
        }
    }
    
    createShootSound() {
        // Create a simple 8-bit shoot sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.playShootSound = () => {
            if (!this.soundEnabled) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Create a descending frequency sweep for laser sound
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
            
            // Quick fade out
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.type = 'square'; // 8-bit style sound
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        };
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundOn = this.soundToggle.querySelector('.sound-on');
        const soundOff = this.soundToggle.querySelector('.sound-off');
        
        if (this.soundEnabled) {
            soundOn.style.display = 'inline';
            soundOff.style.display = 'none';
        } else {
            soundOn.style.display = 'none';
            soundOff.style.display = 'inline';
        }
    }
    
    toggleFilters() {
        this.filtersCollapsed = !this.filtersCollapsed;
        
        if (this.filtersCollapsed) {
            this.filtersContent.classList.add('collapsed');
            this.filtersToggle.classList.add('collapsed');
        } else {
            this.filtersContent.classList.remove('collapsed');
            this.filtersToggle.classList.remove('collapsed');
        }
    }
    
    toggleMap() {
        this.mapVisible = !this.mapVisible;
        
        if (this.mapVisible) {
            this.mapView.style.display = 'block';
            this.initializeMap();
        } else {
            this.mapView.style.display = 'none';
        }
    }
    
    initializeMap() {
        if (!this.map) {
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.className = 'map-close';
            closeButton.innerHTML = '✕ Close Map';
            closeButton.onclick = () => this.toggleMap();
            this.mapView.appendChild(closeButton);
            
            // Initialize Leaflet map
            this.map = L.map('map').setView([46.2276, 2.2137], 6); // Center on France
            
            // Add dark tile layer for retro look
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(this.map);
            
            // Add existing flashes to map
            this.allFlashes.forEach(flash => this.addFlashToMap(flash, false));
        }
    }
    
    addFlashToMap(flash, isNew = false) {
        if (!this.map || !this.mapVisible) return;
        
        const coords = this.cityCoordinates.get(flash.city);
        if (!coords) return;
        
        // Add some random offset to avoid overlapping markers
        const lat = coords[0] + (Math.random() - 0.5) * 0.1;
        const lng = coords[1] + (Math.random() - 0.5) * 0.1;
        
        if (isNew) {
            // Create explosion effect
            this.createMapExplosion(lat, lng, flash);
        }
        
        // Add marker
        const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#0f0',
            color: '#0f0',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.6
        }).addTo(this.map);
        
        // Add popup
        marker.bindPopup(`
            <div style="color: #0f0; background: #000; font-family: 'Courier New', monospace;">
                <strong>${flash.player}</strong><br>
                ${flash.city}<br>
                <img src="${this.baseImageUrl}${flash.img}" style="width: 100px; height: 100px; object-fit: cover; margin-top: 5px;">
            </div>
        `);
    }
    
    createMapExplosion(lat, lng, flash) {
        const point = this.map.latLngToContainerPoint([lat, lng]);
        
        const explosion = document.createElement('div');
        explosion.className = 'map-explosion';
        explosion.style.left = (point.x - 100) + 'px';
        explosion.style.top = (point.y - 100) + 'px';
        
        explosion.innerHTML = `
            <img class="explosion-image" src="${this.baseImageUrl}${flash.img}" alt="${flash.text}">
            <div class="explosion-info">${flash.player} - ${flash.city}</div>
        `;
        
        document.getElementById('map').appendChild(explosion);
        
        // Remove explosion after animation
        setTimeout(() => {
            explosion.remove();
        }, 3000);
    }
    
    async fetchFlashes() {
        try {
            // Add some randomization to avoid predictable patterns
            const jitter = Math.random() * 5000; // 0-5 second random delay
            
            let data = null;
            let source = 'primary';
            
            // Try primary API first
            try {
                console.log(`🌐 Trying primary API... (next fetch in ~${Math.round((this.fetchInterval + jitter) / 1000)}s)`);
                data = await this.fetchFromPrimaryAPI();
                
                // If we were using fallback before, log that we're back to primary
                if (this.usingFallback) {
                    console.log('✅ Primary API restored, switching back from fallback');
                    this.usingFallback = false;
                    this.updateStatusMessage('✅ Primary API restored');
                    this.updateEndpointStatus('Primary');
                    setTimeout(() => this.updateStatusMessage(''), 3000);
                } else {
                    this.updateEndpointStatus('Primary');
                }
                
            } catch (primaryError) {
                console.warn('⚠️ Primary API failed:', primaryError.message);
                
                // Try fallback endpoint
                try {
                    console.log('🔄 Trying fallback endpoint...');
                    data = await this.fetchFromFallbackHTML();
                    source = 'fallback';
                    
                    if (!this.usingFallback) {
                        console.log('🔄 Switched to fallback endpoint');
                        this.usingFallback = true;
                        this.updateStatusMessage('🔄 Using fallback endpoint');
                        this.updateEndpointStatus('Fallback');
                    }
                    
                } catch (fallbackError) {
                    console.error('❌ Both endpoints failed:', fallbackError.message);
                    this.updateStatusMessage('❌ All endpoints failed - retrying...');
                    return;
                }
            }
            
            if (data) {
                console.log(`📊 Data received from ${source} endpoint`);
                
                // Update stats with animation
                this.updateStats(data.flash_count, data.player_count);
                
                // Process flashes
                if (data.with_paris && Array.isArray(data.with_paris)) {
                    this.processFlashes(data.with_paris);
                }
                
                // Reset fetch interval if we were rate limited before
                if (this.fetchInterval > 60000) {
                    console.log('✅ API access restored, returning to normal interval');
                    this.fetchInterval = 60000;
                }
            }
            
        } catch (error) {
            console.error('❌ Unexpected error in fetchFlashes:', error);
            this.updateStatusMessage('❌ Unexpected error - retrying...');
        }
    }
    
    async fetchFromPrimaryAPI() {
        const headers = this.isLocal ? {} : {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };
        
        const response = await fetch(this.apiUrl, { headers });
        
        if (!response.ok) {
            if (response.status === 403) {
                console.error('🚫 IP banned (403). Increasing fetch interval to 5 minutes.');
                this.fetchInterval = 300000; // 5 minutes
                throw new Error(`Primary API blocked (403) - IP banned`);
            } else if (response.status === 429) {
                console.error('🚫 Too many requests (429). Increasing fetch interval to 2 minutes.');
                this.fetchInterval = 120000; // 2 minutes
                throw new Error(`Primary API rate limited (429)`);
            }
            throw new Error(`Primary API HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async fetchFromFallbackHTML() {
        const headers = this.isLocal ? {} : {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };
        
        const response = await fetch(this.fallbackUrl, { headers });
        
        if (!response.ok) {
            throw new Error(`Fallback HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (this.isLocal) {
            // Proxy server returns JSON directly
            return await response.json();
        } else {
            // Direct HTML access - need to parse
            const htmlText = await response.text();
            
            // Extract JSON from the HTML
            const jsonMatch = htmlText.match(/var flashData = JSON\.parse\('(.+?)'\);/);
            if (!jsonMatch) {
                throw new Error('Could not find flashData in HTML');
            }
            
            // Decode the JSON string (it's escaped in the HTML)
            let jsonString = jsonMatch[1];
            
            // Unescape the JSON string
            jsonString = jsonString
                .replace(/\\u0022/g, '"')
                .replace(/\\u002F/g, '/')
                .replace(/\\u003C/g, '<')
                .replace(/\\u003E/g, '>')
                .replace(/\\u0026/g, '&')
                .replace(/\\u0027/g, "'")
                .replace(/\\u003D/g, '=')
                .replace(/\\u003A/g, ':')
                .replace(/\\u002C/g, ',')
                .replace(/\\u007B/g, '{')
                .replace(/\\u007D/g, '}')
                .replace(/\\u005B/g, '[')
                .replace(/\\u005D/g, ']');
            
            try {
                const data = JSON.parse(jsonString);
                console.log('✅ Successfully parsed JSON from fallback HTML');
                return data;
            } catch (parseError) {
                console.error('❌ Failed to parse JSON from fallback HTML:', parseError);
                throw new Error('Failed to parse JSON from fallback HTML');
            }
        }
    }
    
    updateStatusMessage(message) {
        // Add status message to the header if it doesn't exist
        let statusElement = document.getElementById('statusMessage');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'statusMessage';
            statusElement.style.cssText = `
                position: fixed;
                top: 80px;
                right: 10px;
                background: rgba(0, 255, 0, 0.1);
                border: 1px solid #0f0;
                color: #0f0;
                padding: 8px 12px;
                border-radius: 5px;
                font-family: 'Courier New', monospace;
                font-size: 0.85em;
                z-index: 1000;
                transition: opacity 0.3s;
                max-width: 200px;
                text-align: center;
            `;
            document.body.appendChild(statusElement);
        }
        
        if (message) {
            statusElement.textContent = message;
            statusElement.style.opacity = '1';
        } else {
            statusElement.style.opacity = '0';
        }
    }
    
    updateStats(flashCount, playerCount) {
        // Parse numbers from formatted strings
        const newFlashCount = parseInt(flashCount.replace(/\s/g, ''));
        const newPlayerCount = parseInt(playerCount.replace(/\s/g, ''));
        
        // Animate if numbers changed
        if (newFlashCount !== this.currentFlashCount) {
            this.flashCountElement.classList.add('updating');
            setTimeout(() => this.flashCountElement.classList.remove('updating'), 500);
            this.currentFlashCount = newFlashCount;
        }
        
        if (newPlayerCount !== this.currentPlayerCount) {
            this.playerCountElement.classList.add('updating');
            setTimeout(() => this.playerCountElement.classList.remove('updating'), 500);
            this.currentPlayerCount = newPlayerCount;
        }
        
        this.flashCountElement.textContent = `Flashes: ${flashCount}`;
        this.playerCountElement.textContent = `Players: ${playerCount}`;
    }
    
    processFlashes(flashes) {
        // Check if this is the first load
        const isFirstLoad = this.allFlashes.length === 0;
        
        // Find new flashes that we haven't seen before
        const newFlashes = flashes.filter(flash => !this.seenFlashes.has(flash.flash_id));
        
        // Update all flashes array and stats
        this.allFlashes = [...flashes];
        this.updateCitiesAndStats(flashes);
        
        if (isFirstLoad) {
            // On first load, mark all as seen and display without animation
            flashes.forEach(flash => this.seenFlashes.add(flash.flash_id));
            this.updateCityFilter();
            this.updateLeaderboard();
            console.log(`🚀 Initial load: ${flashes.length} flashes loaded`);
        } else if (newFlashes.length > 0) {
            // Add new flashes to replay buffer instead of showing immediately
            console.log(`📦 Buffering ${newFlashes.length} new flashes for replay`);
            
            // Sort new flashes by timestamp (oldest first for proper replay order)
            newFlashes.sort((a, b) => a.timestamp - b.timestamp);
            
            // Calculate proper replay timing based on actual timestamps
            const currentTime = Date.now();
            const baseReplayTime = currentTime + 1000; // Start replaying in 1 second
            
            // Find the time span of the new flashes
            const firstTimestamp = newFlashes[0].timestamp;
            const lastTimestamp = newFlashes[newFlashes.length - 1].timestamp;
            const timeSpan = lastTimestamp - firstTimestamp;
            
            console.log(`⏱️ Flash time span: ${timeSpan} seconds`);
            
            // Add to replay buffer with proper timing intervals
            newFlashes.forEach((flash, index) => {
                this.seenFlashes.add(flash.flash_id);
                
                // Calculate the relative position of this flash in the timeline
                const relativeTime = flash.timestamp - firstTimestamp;
                
                // Use actual timing - no scaling or compression
                const actualTime = relativeTime * 1000; // Convert seconds to milliseconds
                
                this.replayBuffer.push({
                    flash: flash,
                    replayTime: baseReplayTime + actualTime,
                    originalTimestamp: flash.timestamp
                });
                
                console.log(`📅 Flash ${index + 1}: ${flash.player} scheduled for +${Math.round(actualTime/1000)}s (real timing)`);
            });
            
            // Update filters without re-rendering
            this.updateCityFilterOptions();
            this.updateLeaderboard();
            
            console.log(`📊 Replay buffer now has ${this.replayBuffer.length} flashes queued`);
            this.updateBufferStatus();
        } else {
            // No new flashes, just update stats
            this.updateCityFilterOptions();
            this.updateLeaderboard();
            console.log(`✅ No new flashes found`);
        }
    }
    
    updateBufferStatus() {
        if (this.bufferStatusElement) {
            this.bufferStatusElement.textContent = `Buffer: ${this.replayBuffer.length}`;
        }
    }
    
    updateEndpointStatus(endpoint) {
        if (this.endpointStatusElement) {
            this.endpointStatusElement.textContent = `API: ${endpoint}`;
            // Add visual indicator for fallback
            if (endpoint === 'Fallback') {
                this.endpointStatusElement.style.color = '#ff6600';
            } else {
                this.endpointStatusElement.style.color = '#0f0';
            }
        }
    }
    
    processReplayBuffer() {
        if (this.replayBuffer.length === 0) return;
        
        const currentTime = Date.now();
        const flashesToReplay = [];
        
        // Find flashes that are ready to be replayed
        this.replayBuffer = this.replayBuffer.filter(item => {
            if (item.replayTime <= currentTime) {
                flashesToReplay.push(item);
                return false; // Remove from buffer
            }
            return true; // Keep in buffer
        });
        
        // Replay each flash individually (no batching for sound)
        flashesToReplay.forEach((item, index) => {
            console.log(`🎬 Replaying flash: ${item.flash.player} from ${item.flash.city}`);
            
            // Play sound for each flash (authentic timing)
            this.playShootSound();
            
            // Add to map if visible
            if (this.mapVisible) {
                this.addFlashToMap(item.flash, true);
            }
            
            // Add to main view immediately (no additional delay)
            this.addFlash(item.flash, true, false); // false = don't play sound (already played)
        });
        
        // Update buffer status if any flashes were processed
        if (flashesToReplay.length > 0) {
            this.updateBufferStatus();
        }
    }
    
    updateCitiesAndStats(flashes) {
        // Update cities set
        flashes.forEach(flash => {
            this.cities.add(flash.city);
            
            // Update player stats
            if (this.playerStats.has(flash.player)) {
                this.playerStats.set(flash.player, this.playerStats.get(flash.player) + 1);
            } else {
                this.playerStats.set(flash.player, 1);
            }
        });
    }
    
    updateCityFilter() {
        this.updateCityFilterOptions();
        this.applyFilters();
    }
    
    updateCityFilterOptions() {
        const currentValue = this.cityFilter.value;
        
        // Clear existing options except "All Cities"
        this.cityFilter.innerHTML = '<option value="">All Cities</option>';
        
        // Add city options
        Array.from(this.cities).sort().forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            this.cityFilter.appendChild(option);
        });
        
        // Restore previous selection
        this.cityFilter.value = currentValue;
    }
    
    updateLeaderboard() {
        // Get top 10 players
        const topPlayers = Array.from(this.playerStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        this.leaderboardList.innerHTML = '';
        
        topPlayers.forEach(([player, count], index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            if (this.selectedPlayer === player) {
                item.classList.add('active');
            }
            
            item.innerHTML = `
                <span class="player-rank">#${index + 1}</span>
                <span class="player-name">${player}</span>
                <span class="player-score">${count}</span>
            `;
            
            item.addEventListener('click', () => this.selectPlayer(player));
            this.leaderboardList.appendChild(item);
        });
    }
    
    selectPlayer(player) {
        if (this.selectedPlayer === player) {
            this.selectedPlayer = null;
        } else {
            this.selectedPlayer = player;
        }
        
        this.updateLeaderboard();
        this.applyFilters();
    }
    
    applyFilters() {
        const cityFilter = this.cityFilter.value;
        
        // Filter flashes
        this.filteredFlashes = this.allFlashes.filter(flash => {
            const cityMatch = !cityFilter || flash.city === cityFilter;
            const playerMatch = !this.selectedPlayer || flash.player === this.selectedPlayer;
            return cityMatch && playerMatch;
        });
        
        // Sort by timestamp (newest first) - this fixes the ordering issue
        this.filteredFlashes.sort((a, b) => b.timestamp - a.timestamp);
        
        // Clear and repopulate flash container
        this.flashContainer.innerHTML = '';
        
        this.filteredFlashes.slice(0, this.maxFlashes).forEach(flash => {
            this.addFlash(flash, false);
        });
    }
    
    addFlash(flash, isNew = false, playSound = true) {
        const flashElement = this.createFlashElement(flash);
        
        if (isNew) {
            // Insert at the very beginning for new flashes (top-left)
            this.flashContainer.insertBefore(flashElement, this.flashContainer.firstChild);
            flashElement.classList.add('new');
            
            // Only play sound if explicitly requested (to avoid multiple sounds)
            if (playSound) {
                this.playShootSound();
            }
            
            // Clean up old flashes if we exceed the maximum
            this.cleanupOldFlashes();
        } else {
            // For filtered/existing flashes, append normally
            this.flashContainer.appendChild(flashElement);
        }
        
        // Force reflow to ensure animation plays
        flashElement.offsetHeight;
    }
    
    createFlashElement(flash) {
        const flashDiv = document.createElement('div');
        flashDiv.className = 'flash-item';
        flashDiv.dataset.flashId = flash.flash_id;
        
        const timestamp = new Date(flash.timestamp * 1000);
        const timeString = timestamp.toLocaleTimeString();
        
        flashDiv.innerHTML = `
            <img class="flash-image" src="${this.baseImageUrl}${flash.img}" alt="${flash.text}" loading="lazy">
            <div class="flash-info">
                <div class="flash-player">${flash.player}</div>
                <div class="flash-city">${flash.city}</div>
                <div class="flash-time">${timeString}</div>
            </div>
        `;
        
        return flashDiv;
    }
    
    cleanupOldFlashes() {
        const allFlashes = this.flashContainer.querySelectorAll('.flash-item');
        
        if (allFlashes.length > this.maxFlashes) {
            // Remove flashes that exceed the maximum
            for (let i = this.maxFlashes; i < allFlashes.length; i++) {
                allFlashes[i].style.opacity = '0';
                allFlashes[i].style.transform = 'translateY(50px) scale(0.8)';
                
                setTimeout(() => {
                    allFlashes[i].remove();
                }, 500);
            }
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpaceInvadersFlashApp();
});