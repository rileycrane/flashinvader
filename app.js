class SpaceInvadersFlashApp {
    constructor() {
        this.apiUrl = 'https://api.space-invaders.com/flashinvaders/flashes/';
        this.baseImageUrl = 'https://api.space-invaders.com';
        this.flashContainer = document.getElementById('flashContainer');
        this.flashCountElement = document.getElementById('flashCount');
        this.playerCountElement = document.getElementById('playerCount');
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
        
        // Set up periodic updates
        setInterval(() => this.fetchFlashes(), 5000);
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
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            // Update stats with animation
            this.updateStats(data.flash_count, data.player_count);
            
            // Process flashes
            if (data.with_paris && Array.isArray(data.with_paris)) {
                this.processFlashes(data.with_paris);
            }
        } catch (error) {
            console.error('Error fetching flashes:', error);
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
        
        // Process new flashes first (before updating allFlashes)
        const newFlashes = flashes.filter(flash => !this.seenFlashes.has(flash.flash_id));
        
        // Update all flashes array
        this.allFlashes = [...flashes];
        
        // Update cities and player stats
        this.updateCitiesAndStats(flashes);
        
        if (isFirstLoad) {
            // On first load, mark all as seen and display without animation
            flashes.forEach(flash => this.seenFlashes.add(flash.flash_id));
            this.updateCityFilter();
            this.updateLeaderboard();
        } else {
            // Play sound once for the batch of new flashes (if any)
            if (newFlashes.length > 0) {
                this.playShootSound();
            }
            
            // Only add truly new flashes with animation
            newFlashes.forEach((flash, index) => {
                this.seenFlashes.add(flash.flash_id);
                
                // Add to map if visible
                if (this.mapVisible) {
                    setTimeout(() => {
                        this.addFlashToMap(flash, true);
                    }, index * 200);
                }
                
                // Add to main view with delay - only for new flashes
                setTimeout(() => {
                    this.addFlash(flash, true, false); // false = don't play sound
                }, index * 100);
            });
            
            // Update filters and leaderboard only if there are no new flashes
            // This prevents re-rendering existing flashes
            if (newFlashes.length === 0) {
                this.updateCityFilterOptions();
                this.updateLeaderboard();
            } else {
                // If there are new flashes, update filters without re-rendering
                this.updateCityFilterOptions();
                this.updateLeaderboard();
            }
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