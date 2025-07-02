class SpaceInvadersFlashApp {
    constructor() {
        this.apiUrl = 'https://api.space-invaders.com/flashinvaders/flashes/';
        this.baseImageUrl = 'https://api.space-invaders.com';
        this.flashContainer = document.getElementById('flashContainer');
        this.flashCountElement = document.getElementById('flashCount');
        this.playerCountElement = document.getElementById('playerCount');
        this.soundToggle = document.getElementById('soundToggle');
        this.shootSound = document.getElementById('shootSound');
        
        this.soundEnabled = true;
        this.seenFlashes = new Set();
        this.maxFlashes = 50; // Maximum number of flashes to display
        
        this.init();
    }
    
    init() {
        // Set up sound toggle
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        
        // Create a simple shoot sound using Web Audio API as fallback
        this.createShootSound();
        
        // Start fetching data
        this.fetchFlashes();
        
        // Set up periodic updates
        setInterval(() => this.fetchFlashes(), 5000); // Update every 5 seconds
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
    
    async fetchFlashes() {
        try {
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            // Update stats
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
        this.flashCountElement.textContent = `Flashes: ${flashCount}`;
        this.playerCountElement.textContent = `Players: ${playerCount}`;
    }
    
    processFlashes(flashes) {
        // Process flashes in reverse order (newest first)
        const newFlashes = flashes.filter(flash => !this.seenFlashes.has(flash.flash_id));
        
        newFlashes.forEach((flash, index) => {
            this.seenFlashes.add(flash.flash_id);
            
            // Add a small delay for each new flash to create a cascade effect
            setTimeout(() => {
                this.addFlash(flash, true);
            }, index * 100);
        });
        
        // Remove old flashes if we exceed the maximum
        this.cleanupOldFlashes();
    }
    
    addFlash(flash, isNew = false) {
        const flashElement = this.createFlashElement(flash);
        
        // Insert at the beginning of the container
        this.flashContainer.insertBefore(flashElement, this.flashContainer.firstChild);
        
        if (isNew) {
            flashElement.classList.add('new');
            this.playShootSound();
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