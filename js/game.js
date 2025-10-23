// Beanie Dash - Main Game Module
class BeanieGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game State
        this.state = 'menu'; // menu, playing, gameover
        this.score = 0;
        this.deaths = 0;
        this.bestScore = parseInt(localStorage.getItem('beanieHighScore') || 0);
        this.musicEnabled = true;

        // Player Properties
        this.player = {
            x: 100,
            y: 0,
            size: 30,
            velocity: 0,
            rotation: 0,
            jumping: false,
            grounded: false,
            onPlatform: null, // Track which platform the player is standing on
            trail: [] // For neon trail effect
        };

        // Game Physics
        this.gravity = 0.8;
        this.jumpPower = -14; // Strong enough to jump over 2 obstacles
        this.maxFallSpeed = 20; // Terminal velocity to prevent tunneling through platforms
        this.groundY = 0;
        this.speed = 3.5; // Even easier starting speed
        this.maxSpeed = 12; // Slightly lower max speed
        this.speedIncrement = 0.0004; // Even more gradual speed increase

        // Obstacles
        this.obstacles = [];
        this.obstacleSpacing = 500; // Much more space between obstacles at start
        this.minObstacleSpacing = 250; // Higher minimum spacing
        this.lastObstacleX = 800; // First obstacle appears much further away

        // Difficulty progression
        this.difficultyLevel = 0; // Track difficulty for progressive obstacle introduction

        // Visual Effects
        this.particles = [];
        this.screenShake = 0;
        this.glowIntensity = 1;

        // Debug mode - set to true to see collision boxes
        this.debugMode = false;

        // Music Sync
        this.beatTimer = 0;
        this.beatInterval = 500; // milliseconds
        this.lastBeat = Date.now();

        // Progress tracking
        this.levelLength = 10000; // Distance units for 100%
        this.distanceTraveled = 0;

        this.init();
    }

    init() {
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Calculate ground position
        this.groundY = this.canvas.height - 100;
        this.player.y = this.groundY - this.player.size;

        // Event Listeners
        this.setupEventListeners();

        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();

        // Initialize UI
        this.updateUI();

        // Ensure canvas can receive focus for keyboard events
        this.canvas.focus();
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.groundY = this.canvas.height - 100;
    }

    setupEventListeners() {
        // Keyboard controls - bind to window for better capture
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
                e.preventDefault();
                this.handleJump();
            }
        });

        // Additional keyboard listener for document (fallback)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
                e.preventDefault();
                this.handleJump();
            }
        });

        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleJump();
        });

        // Click controls
        this.canvas.addEventListener('click', () => {
            this.handleJump();
        });

        // UI Buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('retry-btn').addEventListener('click', () => this.startGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('music-toggle').addEventListener('click', () => this.toggleMusic());
    }

    handleJump() {
        if (this.state === 'menu') {
            this.startGame();
        } else if (this.state === 'gameover') {
            // Restart from game over
            this.startGame();
        } else if (this.state === 'playing' && this.player.grounded) {
            this.player.velocity = this.jumpPower;
            this.player.jumping = true;
            this.player.grounded = false;
            this.playSound('jump');
            this.createJumpParticles();
        }
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.distanceTraveled = 0;
        this.speed = 3.5; // Start even slower
        this.obstacleSpacing = 500; // Reset to much easier spacing
        this.difficultyLevel = 0; // Reset difficulty
        this.obstacles = [];
        this.lastObstacleX = 800; // First obstacle much further away
        this.player.y = this.groundY - this.player.size;
        this.player.velocity = 0;
        this.player.rotation = 0;

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');

        if (this.musicEnabled) {
            this.playMusic();
        }

        this.generateInitialObstacles();

        // Ensure canvas has focus for keyboard input
        this.canvas.focus();
    }

    generateInitialObstacles() {
        // Start with alternating spikes and long platforms for easy learning
        // First a spike
        this.generateSimpleSpike(this.lastObstacleX + this.obstacleSpacing);

        // Then a long platform to jump on
        this.generateEasyPlatform(this.lastObstacleX + this.obstacleSpacing);

        // Another spike
        this.generateSimpleSpike(this.lastObstacleX + this.obstacleSpacing);

        // Another platform
        this.generateEasyPlatform(this.lastObstacleX + this.obstacleSpacing);
    }

    generateSimpleSpike(x) {
        // Generate only a simple spike for the tutorial phase
        const obstacle = {
            x: x || this.lastObstacleX + this.obstacleSpacing,
            type: 'spike',
            passed: false,
            y: this.groundY - 40, // Position y at the TOP of the spike (40px above ground)
            width: 30,
            height: 40,
            color: '#ff00ff',
            collisionWidth: 20, // Narrower collision box for triangle shape
            collisionOffset: 5, // Center the collision box
            groundY: this.groundY // Store ground position for drawing
        };

        this.obstacles.push(obstacle);
        this.lastObstacleX = obstacle.x;
    }

    generateEasyPlatform(x) {
        // Generate a long, easy-to-jump-on platform for beginners
        const obstacle = {
            x: x || this.lastObstacleX + this.obstacleSpacing,
            type: 'jump_platform',
            passed: false,
            y: this.groundY - 80, // Nice height for easy jumping
            width: 120, // Extra long platform for easy landing
            height: 15,
            color: '#ffff00',
            isJumpable: true
        };

        this.obstacles.push(obstacle);
        this.lastObstacleX = obstacle.x;
    }

    generateObstacle(x) {
        // Progressive difficulty - introduce obstacles gradually
        let availableTypes = ['spike', 'jump_platform']; // Start with spikes and platforms from the beginning

        if (this.difficultyLevel > 3) {
            availableTypes.push('block'); // Blocks come later now
        }
        if (this.difficultyLevel > 6) {
            availableTypes.push('platform'); // Moving platforms come much later
        }
        if (this.difficultyLevel > 8) {
            availableTypes.push('saw'); // Saws are even later
        }
        if (this.difficultyLevel > 10) {
            availableTypes.push('poop'); // Poop is for experts
        }

        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

        let obstacle = {
            x: x || this.lastObstacleX + this.obstacleSpacing,
            type: type,
            passed: false
        };

        switch(type) {
            case 'spike':
                obstacle.y = this.groundY - 40; // Position y at the TOP of the spike (40px above ground)
                obstacle.width = 30;
                obstacle.height = 40;
                obstacle.color = '#ff00ff';
                obstacle.collisionWidth = 20; // Narrower collision box for triangle shape
                obstacle.collisionOffset = 5; // Center the collision box
                obstacle.groundY = this.groundY; // Store ground position for drawing
                break;

            case 'jump_platform':
                // Static platforms at various heights that player can land on
                const heights = [60, 80, 100];  // Removed highest platform for easier jumping
                obstacle.y = this.groundY - heights[Math.floor(Math.random() * heights.length)];

                // Make platforms longer in early game for easier landing
                if (this.difficultyLevel <= 2) {
                    obstacle.width = 100 + Math.random() * 50; // 100-150 width for beginners
                } else {
                    obstacle.width = 80 + Math.random() * 40; // 80-120 width normally
                }

                obstacle.height = 15;
                obstacle.color = '#ffff00';
                obstacle.isJumpable = true; // Mark as a platform you can land on
                break;

            case 'block':
                obstacle.y = this.groundY - 40;
                obstacle.width = 40;
                obstacle.height = 40;
                obstacle.color = '#00ffff';
                break;

            case 'saw':
                obstacle.y = this.groundY - 30;
                obstacle.width = 50;
                obstacle.height = 50;
                obstacle.rotation = 0;
                obstacle.color = '#ff0000';
                break;

            case 'platform':
                obstacle.y = this.groundY - 80 - Math.random() * 60;
                obstacle.width = 60;
                obstacle.height = 10;
                obstacle.moveY = obstacle.y;
                obstacle.moveDir = 1;
                obstacle.color = '#00ff00';
                break;

            case 'poop':
                obstacle.y = this.groundY - 35;
                obstacle.width = 35;
                obstacle.height = 35;
                obstacle.color = '#8B4513';
                obstacle.bounce = 0;
                break;
        }

        this.obstacles.push(obstacle);
        this.lastObstacleX = obstacle.x;
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;

        // Update speed (gradual increase)
        if (this.speed < this.maxSpeed) {
            this.speed += this.speedIncrement * deltaTime;
        }

        // Update distance and score
        this.distanceTraveled += this.speed * deltaTime * 0.01;
        this.score = Math.floor(this.distanceTraveled);

        // Update difficulty level based on score
        const newDifficultyLevel = Math.floor(this.score / 40); // Increase difficulty every 40m
        if (newDifficultyLevel > this.difficultyLevel) {
            this.difficultyLevel = newDifficultyLevel;

            // Very gradually decrease obstacle spacing (but not below minimum)
            if (this.obstacleSpacing > this.minObstacleSpacing) {
                this.obstacleSpacing = Math.max(
                    this.minObstacleSpacing,
                    this.obstacleSpacing - 5  // Decrease by only 5px each level
                );
            }
        }

        // Update player physics
        this.updatePlayer(deltaTime);

        // Update obstacles
        this.updateObstacles(deltaTime);

        // Update particles
        this.updateParticles(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Generate new obstacles
        if (this.lastObstacleX - this.distanceTraveled * 100 < this.canvas.width) {
            this.generateObstacle();
        }

        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake -= deltaTime * 0.05;
        }

        // Music sync beat
        if (Date.now() - this.lastBeat > this.beatInterval) {
            this.lastBeat = Date.now();
            this.glowIntensity = 1.5;
        }
        if (this.glowIntensity > 1) {
            this.glowIntensity -= deltaTime * 0.002;
        }

        // Update UI
        this.updateUI();
    }

    updatePlayer(deltaTime) {
        // Apply gravity
        if (!this.player.grounded) {
            this.player.velocity += this.gravity;
            // Apply terminal velocity to prevent tunneling through platforms
            if (this.player.velocity > this.maxFallSpeed) {
                this.player.velocity = this.maxFallSpeed;
            }
        }

        // Update position
        this.player.y += this.player.velocity;

        // Check platform collisions first
        let landedOnPlatform = false;
        if (this.player.velocity >= 0) { // Check when falling or standing still
            for (let obstacle of this.obstacles) {
                if (obstacle.isJumpable) {
                    const playerBottom = this.player.y + this.player.size;
                    const playerPrevBottom = this.player.y + this.player.size - this.player.velocity; // Previous position
                    const platformTop = obstacle.y;
                    const platformBottom = obstacle.y + obstacle.height;

                    // Check if player is horizontally aligned with platform
                    const horizontallyAligned = this.player.x + this.player.size/2 > obstacle.x &&
                                               this.player.x - this.player.size/2 < obstacle.x + obstacle.width;

                    // More forgiving vertical collision - check if player passed through or is on platform
                    const verticallyAligned = (playerBottom >= platformTop - 5 && playerBottom <= platformBottom + 25) ||
                                             (playerPrevBottom <= platformTop && playerBottom >= platformTop);

                    if (horizontallyAligned && verticallyAligned && this.player.velocity >= 0) {
                        // Snap player to platform top
                        this.player.y = platformTop - this.player.size;
                        this.player.velocity = 0;
                        this.player.grounded = true;
                        this.player.jumping = false;
                        this.player.onPlatform = obstacle;
                        landedOnPlatform = true;
                        break;
                    }
                }
            }
        }

        // Ground collision
        if (!landedOnPlatform && this.player.y >= this.groundY - this.player.size) {
            this.player.y = this.groundY - this.player.size;
            this.player.velocity = 0;
            this.player.grounded = true;
            this.player.jumping = false;
            this.player.onPlatform = null;
        } else if (!landedOnPlatform && this.player.grounded && this.player.onPlatform) {
            // Check if player has moved off the platform horizontally
            const platform = this.player.onPlatform;
            const playerLeft = this.player.x - this.player.size/2;
            const playerRight = this.player.x + this.player.size/2;
            const platformLeft = platform.x - this.speed; // Account for platform movement
            const platformRight = platform.x + platform.width;

            if (playerRight < platformLeft || playerLeft > platformRight) {
                // Player has moved off the platform
                this.player.grounded = false;
                this.player.onPlatform = null;
            }
        }

        // Update rotation
        if (!this.player.grounded) {
            this.player.rotation += 0.15;
        } else {
            // Snap to 90-degree angles when grounded
            const targetRotation = Math.round(this.player.rotation / (Math.PI/2)) * (Math.PI/2);
            this.player.rotation += (targetRotation - this.player.rotation) * 0.3;
        }

        // Update trail
        this.player.trail.push({
            x: this.player.x,
            y: this.player.y + this.player.size/2,
            alpha: 1
        });

        // Limit trail length
        if (this.player.trail.length > 15) {
            this.player.trail.shift();
        }

        // Fade trail
        this.player.trail.forEach(point => {
            point.alpha -= 0.08;
        });
    }

    updateObstacles(deltaTime) {
        this.obstacles.forEach(obstacle => {
            // Move obstacles left
            obstacle.x -= this.speed;

            // Special behaviors
            if (obstacle.type === 'saw') {
                obstacle.rotation += 0.1;
            } else if (obstacle.type === 'platform') {
                obstacle.y += obstacle.moveDir * 2;
                if (obstacle.y > obstacle.moveY + 30 || obstacle.y < obstacle.moveY - 30) {
                    obstacle.moveDir *= -1;
                }
            } else if (obstacle.type === 'poop') {
                // Bouncing animation
                obstacle.bounce += 0.1;
                obstacle.y = this.groundY - 35 + Math.sin(obstacle.bounce) * 5;
            }

            // Mark as passed for scoring
            if (!obstacle.passed && obstacle.x + obstacle.width < this.player.x) {
                obstacle.passed = true;
            }
        });

        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obs => obs.x > -100);
    }

    updateParticles(deltaTime) {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3; // gravity
            particle.alpha -= 0.02;
            particle.size *= 0.98;
        });

        // Remove dead particles
        this.particles = this.particles.filter(p => p.alpha > 0);
    }

    checkCollisions() {
        const playerBox = {
            x: this.player.x - this.player.size/2 + 5,
            y: this.player.y + 5,
            width: this.player.size - 10,
            height: this.player.size - 10
        };

        for (let obstacle of this.obstacles) {
            // For jumpable platforms, check if we're hitting from below or sides
            if (obstacle.isJumpable) {
                // Skip collision if player is on top of the platform
                if (this.player.onPlatform === obstacle) {
                    continue;
                }

                // Check if hitting platform from below or sides
                if (this.isColliding(playerBox, obstacle)) {
                    const playerBottom = this.player.y + this.player.size;
                    const playerTop = this.player.y;
                    const platformTop = obstacle.y;

                    // Only safe if player is coming from above and landing on top
                    const isLandingOnTop = playerBottom <= platformTop + 15 && this.player.velocity >= 0;

                    if (!isLandingOnTop) {
                        // Hit platform from below or side - game over
                        this.gameOver();
                        break;
                    }
                }
            } else if (obstacle.type === 'platform') {
                // Moving platforms - skip if player is on it
                if (this.player.onPlatform === obstacle) {
                    continue;
                }
                // Otherwise check collision normally
                if (this.isColliding(playerBox, obstacle)) {
                    this.gameOver();
                    break;
                }
            } else {
                // All other obstacles (spikes, blocks, saws, poop) - any collision is death
                if (this.isColliding(playerBox, obstacle)) {
                    this.gameOver();
                    break;
                }
            }
        }
    }

    isColliding(box1, box2) {
        // Use custom collision box for obstacles if defined
        const obstacleX = box2.x + (box2.collisionOffset || 0);
        const obstacleWidth = box2.collisionWidth || box2.width;

        return box1.x < obstacleX + obstacleWidth &&
               box1.x + box1.width > obstacleX &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }

    gameOver() {
        this.state = 'gameover';
        this.deaths++;
        this.screenShake = 20;

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('beanieHighScore', this.bestScore);
        }

        this.playSound('death');
        this.createDeathParticles();

        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').textContent = `Distance: ${this.score}m`;
        document.getElementById('attempt-count').textContent = `Attempt #${this.deaths}`;

        this.stopMusic();

        // Ensure focus for keyboard events
        this.canvas.focus();
    }

    showMenu() {
        this.state = 'menu';
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('high-score-value').textContent = `${this.bestScore}m`;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply screen shake
        if (this.screenShake > 0) {
            this.ctx.save();
            this.ctx.translate(
                Math.random() * this.screenShake - this.screenShake/2,
                Math.random() * this.screenShake - this.screenShake/2
            );
        }

        // Draw background grid
        this.drawGrid();

        // Draw ground
        this.drawGround();

        // Draw obstacles
        this.drawObstacles();

        // Draw particles
        this.drawParticles();

        // Draw player
        this.drawPlayer();

        if (this.screenShake > 0) {
            this.ctx.restore();
        }

        // Draw debug collision boxes if debug mode is on
        if (this.debugMode) {
            this.drawDebugCollisionBoxes();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;
        const offset = (this.distanceTraveled * 100) % gridSize;

        // Vertical lines
        for (let x = -offset; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines with perspective
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawGround() {
        // Main ground line with neon glow
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20 * this.glowIntensity;

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();

        // Ground fill
        const gradient = this.ctx.createLinearGradient(0, this.groundY, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.02)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        this.ctx.shadowBlur = 0;
    }

    drawPlayer() {
        // Draw trail
        this.player.trail.forEach((point, index) => {
            if (point.alpha > 0) {
                this.ctx.fillStyle = `rgba(255, 0, 255, ${point.alpha * 0.5})`;
                this.ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
            }
        });

        // Draw player square
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y + this.player.size/2);
        this.ctx.rotate(this.player.rotation);

        // Neon glow effect
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 20 * this.glowIntensity;

        // Player body
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-this.player.size/2, -this.player.size/2, this.player.size, this.player.size);

        // Inner glow
        this.ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
        this.ctx.fillRect(-this.player.size/2, -this.player.size/2, this.player.size, this.player.size);

        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    }

    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            this.ctx.save();

            // Set glow effect
            this.ctx.shadowColor = obstacle.color;
            this.ctx.shadowBlur = 15 * this.glowIntensity;

            switch(obstacle.type) {
                case 'spike':
                    this.drawSpike(obstacle);
                    break;
                case 'jump_platform':
                    this.drawJumpPlatform(obstacle);
                    break;
                case 'block':
                    this.drawBlock(obstacle);
                    break;
                case 'saw':
                    this.drawSaw(obstacle);
                    break;
                case 'platform':
                    this.drawPlatform(obstacle);
                    break;
                case 'poop':
                    this.drawPoop(obstacle);
                    break;
            }

            this.ctx.restore();
        });
    }

    drawSpike(obstacle) {
        this.ctx.strokeStyle = obstacle.color;
        this.ctx.fillStyle = `${obstacle.color}33`;
        this.ctx.lineWidth = 2;

        // Use stored groundY for base, obstacle.y is now the top of the spike
        const baseY = obstacle.groundY || (obstacle.y + obstacle.height);
        const tipY = obstacle.y;

        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x, baseY);
        this.ctx.lineTo(obstacle.x + obstacle.width/2, tipY);
        this.ctx.lineTo(obstacle.x + obstacle.width, baseY);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    }

    drawBlock(obstacle) {
        this.ctx.strokeStyle = obstacle.color;
        this.ctx.fillStyle = `${obstacle.color}33`;
        this.ctx.lineWidth = 2;

        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    drawSaw(obstacle) {
        this.ctx.save();
        this.ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
        this.ctx.rotate(obstacle.rotation);

        this.ctx.strokeStyle = obstacle.color;
        this.ctx.fillStyle = `${obstacle.color}33`;
        this.ctx.lineWidth = 2;

        // Draw saw teeth
        const teeth = 8;
        const innerRadius = obstacle.width/4;
        const outerRadius = obstacle.width/2;

        this.ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2;
            const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;

            this.ctx.lineTo(
                Math.cos(angle) * outerRadius,
                Math.sin(angle) * outerRadius
            );
            this.ctx.lineTo(
                Math.cos(nextAngle) * innerRadius,
                Math.sin(nextAngle) * innerRadius
            );
        }
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawPlatform(obstacle) {
        this.ctx.strokeStyle = obstacle.color;
        this.ctx.fillStyle = `${obstacle.color}33`;
        this.ctx.lineWidth = 2;

        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    drawJumpPlatform(obstacle) {
        this.ctx.strokeStyle = obstacle.color;
        this.ctx.fillStyle = `${obstacle.color}55`;
        this.ctx.lineWidth = 3;

        // Draw main platform
        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Draw support lines
        const numSupports = Math.floor(obstacle.width / 20);
        this.ctx.lineWidth = 1;
        for (let i = 1; i < numSupports; i++) {
            const x = obstacle.x + (i * obstacle.width / numSupports);
            this.ctx.beginPath();
            this.ctx.moveTo(x, obstacle.y + obstacle.height);
            this.ctx.lineTo(x, obstacle.y + obstacle.height + 10);
            this.ctx.stroke();
        }
    }

    drawPoop(obstacle) {
        this.ctx.strokeStyle = obstacle.color;
        this.ctx.fillStyle = `${obstacle.color}99`;
        this.ctx.lineWidth = 2;

        // Draw poop emoji-style shape
        this.ctx.beginPath();

        // Bottom layer
        this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 10, 15, 0, Math.PI, true);

        // Middle layer
        this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 20, 12, Math.PI, 0, false);

        // Top swirl
        this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + 10, 8, Math.PI, 0, false);

        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Add stink lines for effect
        this.ctx.strokeStyle = '#90EE90';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const x = obstacle.x + obstacle.width/2 + (i - 1) * 10;
            const y = obstacle.y - 5;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.bezierCurveTo(x - 5, y - 5, x + 5, y - 10, x, y - 15);
            this.ctx.stroke();
        }
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${particle.alpha})`;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
    }

    drawDebugCollisionBoxes() {
        // Draw player collision box
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.player.x - this.player.size/2 + 5,
            this.player.y + 5,
            this.player.size - 10,
            this.player.size - 10
        );

        // Draw obstacle collision boxes
        this.obstacles.forEach(obstacle => {
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            const obstacleX = obstacle.x + (obstacle.collisionOffset || 0);
            const obstacleWidth = obstacle.collisionWidth || obstacle.width;
            this.ctx.strokeRect(obstacleX, obstacle.y, obstacleWidth, obstacle.height);
        });
    }

    createJumpParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.groundY,
                vx: Math.random() * 4 - 2,
                vy: -Math.random() * 5,
                size: Math.random() * 4 + 2,
                r: 0,
                g: 255,
                b: 255,
                alpha: 1
            });
        }
    }

    createDeathParticles() {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y + this.player.size/2,
                vx: Math.random() * 10 - 5,
                vy: Math.random() * 10 - 5,
                size: Math.random() * 6 + 2,
                r: 255,
                g: 0,
                b: 255,
                alpha: 1
            });
        }
    }

    updateUI() {
        // Update progress bar
        const progress = Math.min((this.distanceTraveled / this.levelLength) * 100, 100);
        document.getElementById('progress-bar').style.width = progress + '%';
        document.getElementById('progress-text').textContent = Math.floor(progress) + '%';

        // Update stats
        document.getElementById('score').textContent = `Distance: ${this.score}m`;
        document.getElementById('deaths').textContent = `Attempts: ${this.deaths}`;
        document.getElementById('best').textContent = `Best: ${this.bestScore}m`;

        // Show difficulty progression
        let difficultyText = 'Learning';
        if (this.difficultyLevel > 10) {
            difficultyText = 'INSANE!';
        } else if (this.difficultyLevel > 8) {
            difficultyText = 'Hard';
        } else if (this.difficultyLevel > 6) {
            difficultyText = 'Medium';
        } else if (this.difficultyLevel > 3) {
            difficultyText = 'Normal';
        } else if (this.difficultyLevel > 1) {
            difficultyText = 'Easy';
        }

        // Update difficulty display if it exists
        const difficultyElement = document.getElementById('difficulty');
        if (difficultyElement) {
            difficultyElement.textContent = `Level: ${difficultyText}`;
        }
    }

    playSound(type) {
        try {
            const audio = document.getElementById(type + 'Sound');
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.log('Audio play failed:', e));
            }
        } catch (e) {
            console.log('Sound error:', e);
        }
    }

    playMusic() {
        if (this.musicEnabled) {
            const music = document.getElementById('bgMusic');
            music.volume = 0.3;
            music.play().catch(e => console.log('Music play failed:', e));
        }
    }

    stopMusic() {
        const music = document.getElementById('bgMusic');
        music.pause();
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        const btn = document.getElementById('music-toggle');

        if (this.musicEnabled) {
            btn.textContent = '🎵';
            if (this.state === 'playing') {
                this.playMusic();
            }
        } else {
            btn.textContent = '🔇';
            this.stopMusic();
        }
    }

    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Password protection
    const CORRECT_PASSWORD = 'poop.pop.cool';
    const passwordScreen = document.getElementById('password-screen');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordError = document.getElementById('password-error');
    const startScreen = document.getElementById('start-screen');

    // Check if already authenticated in this session
    const isAuthenticated = sessionStorage.getItem('beanieAuthenticated') === 'true';

    let game = null;

    if (isAuthenticated) {
        // Already authenticated, skip password screen
        passwordScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        game = new BeanieGame();
    } else {
        // Show password screen
        passwordScreen.classList.remove('hidden');
        startScreen.classList.add('hidden');
        passwordInput.focus();
    }

    // Password validation function
    function validatePassword() {
        const enteredPassword = passwordInput.value.trim();

        if (enteredPassword === CORRECT_PASSWORD) {
            // Correct password
            sessionStorage.setItem('beanieAuthenticated', 'true');
            passwordScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
            passwordError.classList.add('hidden');

            // Initialize game after successful authentication
            if (!game) {
                game = new BeanieGame();
            }

            // Show logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.classList.remove('hidden');
            }

            // Play success sound if available
            const jumpSound = document.getElementById('jumpSound');
            if (jumpSound) {
                jumpSound.play().catch(e => console.log('Sound play failed:', e));
            }
        } else {
            // Wrong password
            passwordError.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.classList.add('shake');

            // Remove shake animation after it completes
            setTimeout(() => {
                passwordInput.classList.remove('shake');
            }, 500);

            // Play error sound if available
            const deathSound = document.getElementById('deathSound');
            if (deathSound) {
                deathSound.play().catch(e => console.log('Sound play failed:', e));
            }
        }
    }

    // Password submit handlers
    if (passwordSubmit) {
        passwordSubmit.addEventListener('click', validatePassword);
    }

    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                validatePassword();
            }
        });
    }

    // Logout functionality (for testing)
    const logoutBtn = document.getElementById('logout-btn');

    function logout() {
        sessionStorage.removeItem('beanieAuthenticated');
        location.reload();
    }

    // Show logout button when authenticated
    if (isAuthenticated && logoutBtn) {
        logoutBtn.classList.remove('hidden');
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Add keyboard shortcut for logout (L key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'l' || e.key === 'L') {
            if (isAuthenticated || sessionStorage.getItem('beanieAuthenticated') === 'true') {
                if (confirm('Logout and return to password screen?')) {
                    logout();
                }
            }
        }
    });

    // PWA Install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('install-btn').classList.remove('hidden');
    });

    document.getElementById('install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User ${outcome} the install prompt`);
            deferredPrompt = null;
            document.getElementById('install-btn').classList.add('hidden');
        }
    });
});