// Flappy Bird Game - Main JavaScript File
class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flappyBirdHighScore')) || 0;
        this.gamesPlayed = parseInt(localStorage.getItem('flappyBirdGamesPlayed')) || 0;
        this.bestStreak = parseInt(localStorage.getItem('flappyBirdBestStreak')) || 0;

        // Game physics constants (VERY EASY MODE - Much more relaxed)
        this.GRAVITY = 0.25;        // Further reduced for very slow falling
        this.FLAP_FORCE = -6;       // Further reduced for gentle, floaty flaps
        this.PIPE_SPEED = 2.0;      // Slower pipe movement for more reaction time
        this.PIPE_GAP = 250;        // Much larger gaps for easier passage
        this.PIPE_SPAWN_RATE = 2200; // Longer time between pipes

        // Game objects
        this.bird = null;
        this.pipes = [];
        this.particles = [];
        this.clouds = [];

        // Game loop variables
        this.lastTime = 0;
        this.pipeTimer = 0;

        // Load images
        this.images = {};
        this.loadImages();

        // Initialize game
        this.init();
        this.setupEventListeners();
        this.updateStats();
        this.startAnimations();
    }

    loadImages() {
        const imageSources = {
            bird: 'resources/bird1.png',
            pipe: 'resources/pipe1.png',
            background: 'resources/background.png',
            explosion: 'resources/explosion.png'
        };

        let loadedCount = 0;
        const totalImages = Object.keys(imageSources).length;

        for (const [key, src] of Object.entries(imageSources)) {
            this.images[key] = new Image();
            this.images[key].onload = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    console.log('All images loaded successfully');
                }
            };
            this.images[key].onerror = () => {
                console.error(`Failed to load image: ${src}`);
                // Create placeholder if image fails to load
                this.createPlaceholderImage(key);
            };
            this.images[key].src = src;
        }
    }

    createPlaceholderImage(key) {
        // Create placeholder canvas for missing images
        const placeholder = document.createElement('canvas');
        const ctx = placeholder.getContext('2d');
        placeholder.width = 50;
        placeholder.height = 50;

        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(0, 0, 50, 50);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(key.toUpperCase(), 25, 30);

        this.images[key] = placeholder;
    }

    init() {
        // Initialize bird (VERY EASY MODE)
        this.bird = {
            x: 150,
            y: this.canvas.height / 2,
            width: 50,             // Bigger bird for better visibility
            height: 40,            // Bigger bird for better visibility
            velocity: 0,
            rotation: 0,
            flapAnimation: 0,
            maxVelocity: 6         // Lower max velocity for gentler falls
        };

        // Initialize clouds
        this.initClouds();

        // Reset game state
        this.pipes = [];
        this.particles = [];
        this.score = 0;
        this.pipeTimer = 0;
    }

    initClouds() {
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * (this.canvas.width + 200),
                y: Math.random() * this.canvas.height * 0.6,
                size: 30 + Math.random() * 40,
                speed: 0.2 + Math.random() * 0.3,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleFlap();
            }
        });

        // Mouse/Touch controls
        this.canvas.addEventListener('click', () => {
            this.handleFlap();
        });

        // Button controls
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.hideGameOverModal();
            this.restartGame();
        });

        document.getElementById('viewLeaderboardBtn').addEventListener('click', () => {
            window.location.href = 'leaderboard.html';
        });

        // Modal overlay click
        document.getElementById('modalOverlay').addEventListener('click', () => {
            this.hideGameOverModal();
        });
    }

    handleFlap() {
        if (this.gameState === 'playing') {
            this.bird.velocity = this.FLAP_FORCE;
            this.bird.flapAnimation = 1;
            this.createFlapParticles();
        } else if (this.gameState === 'menu') {
            this.startGame();
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.init();
        this.updateButtons();
        this.gameLoop();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameLoop();
        }
        this.updateButtons();
    }

    restartGame() {
        this.gameState = 'menu';
        this.init();
        this.updateButtons();
        this.render(); // Render the initial state
    }

    updateButtons() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const restartBtn = document.getElementById('restartBtn');

        switch (this.gameState) {
            case 'menu':
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                restartBtn.disabled = true;
                startBtn.textContent = 'Start Game';
                break;
            case 'playing':
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                restartBtn.disabled = false;
                pauseBtn.textContent = 'Pause';
                break;
            case 'paused':
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                restartBtn.disabled = false;
                pauseBtn.textContent = 'Resume';
                break;
            case 'gameOver':
                startBtn.disabled = true;
                pauseBtn.disabled = true;
                restartBtn.disabled = false;
                break;
        }
    }

    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update bird physics (EASY MODE)
        this.bird.velocity += this.GRAVITY;

        // Cap maximum velocity to prevent falling too fast
        if (this.bird.velocity > this.bird.maxVelocity) {
            this.bird.velocity = this.bird.maxVelocity;
        }

        this.bird.y += this.bird.velocity;

        // Bird rotation based on velocity
        this.bird.rotation = Math.max(-0.5, Math.min(0.5, this.bird.velocity * 0.05));

        // Update flap animation
        if (this.bird.flapAnimation > 0) {
            this.bird.flapAnimation -= 0.1;
        }

        // Update clouds
        this.updateClouds();

        // Spawn pipes
        this.pipeTimer += deltaTime;
        if (this.pipeTimer > this.PIPE_SPAWN_RATE) {
            this.spawnPipe();
            this.pipeTimer = 0;
        }

        // Update pipes
        this.updatePipes();

        // Update particles
        this.updateParticles();

        // Check collisions
        this.checkCollisions();

        // Update score
        this.updateScore();

        // Keep bird in bounds
        this.keepBirdInBounds();
    }

    updateClouds() {
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.size < 0) {
                cloud.x = this.canvas.width + cloud.size;
                cloud.y = Math.random() * this.canvas.height * 0.6;
            }
        });
    }

    spawnPipe() {
        const gapY = Math.random() * (this.canvas.height - this.PIPE_GAP - 100) + 50;

        this.pipes.push({
            x: this.canvas.width,
            topHeight: gapY,
            bottomY: gapY + this.PIPE_GAP,
            bottomHeight: this.canvas.height - (gapY + this.PIPE_GAP),
            width: 60,
            scored: false
        });
    }

    updatePipes() {
        this.pipes = this.pipes.filter(pipe => {
            pipe.x -= this.PIPE_SPEED;
            return pipe.x + pipe.width > -50; // Keep pipes that are still visible
        });
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity on particles
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }

    checkCollisions() {
        // Bird hitbox (VERY EASY MODE - Extremely forgiving collision detection)
        const birdHitbox = {
            x: this.bird.x + 15,          // Much smaller hitbox
            y: this.bird.y + 15,
            width: this.bird.width - 30,  // Very forgiving collision area
            height: this.bird.height - 30
        };

        // Check pipe collisions
        for (let pipe of this.pipes) {
            if (this.checkRectCollision(birdHitbox, {
                x: pipe.x,
                y: 0,
                width: pipe.width,
                height: pipe.topHeight
            }) || this.checkRectCollision(birdHitbox, {
                x: pipe.x,
                y: pipe.bottomY,
                width: pipe.width,
                height: pipe.bottomHeight
            })) {
                this.gameOver();
                return;
            }
        }

        // Check ground/ceiling collisions (VERY EASY MODE - Only ceiling death)
        if (this.bird.y < 0) {
            this.gameOver();
        }
        // Bird can go below screen without dying (bounce back up)
        if (this.bird.y + this.bird.height > this.canvas.height) {
            this.bird.y = this.canvas.height - this.bird.height;
            this.bird.velocity = -3; // Bounce back up instead of dying
            this.createBounceParticles(); // Visual feedback for bounce
        }
    }

    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    updateScore() {
        for (let pipe of this.pipes) {
            if (!pipe.scored && pipe.x + pipe.width < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.updateScoreDisplay();
                this.createScoreParticles();
            }
        }
    }

    keepBirdInBounds() {
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }
        if (this.bird.y + this.bird.height > this.canvas.height) {
            this.bird.y = this.canvas.height - this.bird.height;
            this.bird.velocity = 0;
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.createExplosionParticles();
        this.updateHighScore();
        this.showGameOverModal();
        this.updateButtons();
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyBirdHighScore', this.highScore.toString());
        }

        this.gamesPlayed++;
        localStorage.setItem('flappyBirdGamesPlayed', this.gamesPlayed.toString());

        // Save score to leaderboard
        this.saveScoreToLeaderboard();

        this.updateStats();
    }

    saveScoreToLeaderboard() {
        let leaderboard = JSON.parse(localStorage.getItem('flappyBirdLeaderboard')) || [];
        const playerName = prompt('Enter your name for the leaderboard:') || 'Anonymous';

        leaderboard.push({
            name: playerName,
            score: this.score,
            date: new Date().toISOString()
        });

        // Sort by score and keep top 10
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);

        localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(leaderboard));
    }

    showGameOverModal() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('gameOverModal').style.display = 'block';
        document.getElementById('modalOverlay').style.display = 'block';

        // Animate modal appearance
        if (typeof anime !== 'undefined') {
            anime({
                targets: '#gameOverModal',
                scale: [0.8, 1],
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutBack'
            });
        }
    }

    hideGameOverModal() {
        document.getElementById('gameOverModal').style.display = 'none';
        document.getElementById('modalOverlay').style.display = 'none';
    }

    updateScoreDisplay() {
        document.getElementById('score-display').textContent = this.score;

        // Animate score update
        if (typeof anime !== 'undefined') {
            anime({
                targets: '#score-display',
                scale: [1.2, 1],
                duration: 200,
                easing: 'easeOutBack'
            });
        }
    }

    updateStats() {
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('games-played').textContent = this.gamesPlayed;
        document.getElementById('best-streak').textContent = this.bestStreak;
    }

    // Particle effects
    createFlapParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y + this.bird.height,
                vx: -2 + Math.random() * 4,
                vy: -1 + Math.random() * 2,
                life: 20,
                maxLife: 20,
                alpha: 1,
                color: '#FFD700'
            });
        }
    }

    createScoreParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: -3 + Math.random() * 6,
                vy: -4 + Math.random() * 3,
                life: 30,
                maxLife: 30,
                alpha: 1,
                color: '#4ECDC4'
            });
        }
    }

    createExplosionParticles() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height / 2,
                vx: -5 + Math.random() * 10,
                vy: -5 + Math.random() * 10,
                life: 40,
                maxLife: 40,
                alpha: 1,
                color: '#FF6B6B'
            });
        }
    }

    createBounceParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.canvas.height - 10,
                vx: -2 + Math.random() * 4,
                vy: -3 + Math.random() * -2,
                life: 25,
                maxLife: 25,
                alpha: 1,
                color: '#4ECDC4'
            });
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.renderBackground();

        // Draw clouds
        this.renderClouds();

        // Draw pipes
        this.renderPipes();

        // Draw bird
        this.renderBird();

        // Draw particles
        this.renderParticles();

        // Draw UI elements if needed
        if (this.gameState === 'menu') {
            this.renderMenuText();
        }

        // Show very easy mode indicator
        this.ctx.fillStyle = 'rgba(156, 39, 176, 0.8)';
        this.ctx.font = 'bold 16px Inter';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🎈 VERY EASY MODE', 10, 30);
    }

    renderBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#F0F8FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.ctx.save();
            this.ctx.globalAlpha = cloud.opacity;
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(cloud.x - cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    renderPipes() {
        this.pipes.forEach(pipe => {
            if (this.images.pipe && this.images.pipe.complete) {
                // Use the loaded pipe image for both top and bottom pipes
                // Top pipe (rotated 180 degrees)
                this.ctx.save();
                this.ctx.translate(pipe.x + pipe.width / 2, pipe.topHeight);
                this.ctx.rotate(Math.PI);
                this.ctx.drawImage(this.images.pipe, -pipe.width / 2, 0, pipe.width, pipe.topHeight);
                this.ctx.restore();
                
                // Bottom pipe
                this.ctx.drawImage(this.images.pipe, pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
            } else {
                // Fallback to drawing if image isn't loaded
                this.ctx.fillStyle = '#2E8B57';
                // Top pipe
                this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
                // Bottom pipe
                this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
                
                // Pipe caps
                this.ctx.fillStyle = '#228B22';
                this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, pipe.width + 10, 30);
                this.ctx.fillRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 30);
            }
        });
    }

    renderBird() {
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate(this.bird.rotation);
        
        // Use the loaded bird image instead of drawing shapes
        if (this.images.bird && this.images.bird.complete) {
            this.ctx.drawImage(this.images.bird, -this.bird.width / 2, -this.bird.height / 2, this.bird.width, this.bird.height);
        } else {
            // Fallback to drawing if image isn't loaded
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Bird wing animation
            const wingOffset = Math.sin(this.bird.flapAnimation * Math.PI) * 10;
            this.ctx.fillStyle = '#FFA500';
            this.ctx.beginPath();
            this.ctx.ellipse(-5, wingOffset, 15, 8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Bird eye
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(10, -5, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = 'black';
            this.ctx.beginPath();
            this.ctx.arc(12, -5, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Bird beak
            this.ctx.fillStyle = '#FF6347';
            this.ctx.beginPath();
            this.ctx.moveTo(this.bird.width / 2, 0);
            this.ctx.lineTo(this.bird.width / 2 + 8, 2);
            this.ctx.lineTo(this.bird.width / 2, 4);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    renderMenuText() {
        this.ctx.fillStyle = '#36454F';
        this.ctx.font = 'bold 48px Playfair Display';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Flappy Bird', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.font = '24px Inter';
        this.ctx.fillText('Click or press SPACE to start', this.canvas.width / 2, this.canvas.height / 2 + 20);

        this.ctx.font = '18px Inter';
        this.ctx.fillText('Avoid the pipes and beat your high score!', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }

    startAnimations() {
        // Hero title animation
        if (typeof anime !== 'undefined') {
            anime({
                targets: '#hero-title',
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 1000,
                delay: 500,
                easing: 'easeOutBack'
            });

            // Hero subtitle animation
            anime({
                targets: '#hero-subtitle',
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 800,
                delay: 800,
                easing: 'easeOutQuad'
            });
        }
        // Floating clouds animation
        this.animateClouds();
    }

    animateClouds() {
        // This will be called continuously for cloud movement
        if (this.gameState === 'menu') {
            this.updateClouds();
            this.renderBackground();
            this.renderClouds();
            requestAnimationFrame(() => this.animateClouds());
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new FlappyBirdGame();

    // Initial render
    game.render();

    // Handle window resize
    window.addEventListener('resize', () => {
        // Adjust canvas size if needed
        const canvas = document.getElementById('gameCanvas');
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth - 48; // Account for padding

        if (containerWidth < 800) {
            const scale = containerWidth / 800;
            canvas.style.transform = `scale(${scale})`;
            canvas.style.transformOrigin = 'top left';
        } else {
            canvas.style.transform = 'none';
        }
    });
});
