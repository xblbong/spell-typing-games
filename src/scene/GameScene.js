import Phaser from 'phaser';
import { gameData } from '../data';
import Enemy from '../game/prefabs/Enemy';
import TypingBar from '../game/ui/TypingBar';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    /**
     * Inisialisasi State Game
     * Menerima data levelIndex dari MenuScene
     */
    init(data) {
        const levelIndex = data.levelIndex ?? 0;
        this.level = gameData.getLevel(levelIndex);
        this.user = gameData.getUser();

        // Safety check jika data level gagal dimuat
        if (!this.level) {
            console.error("Data Level tidak ditemukan!");
            this.scene.start('MenuScene');
            return;
        }

        this.state = {
            score: 0,
            mana: 1000,           // Default Start Mana
            maxMana: 1000,
            currentIndex: 0,
            defeatedCount: 0,
            timeLeft: this.level.timeTarget,
            isGameOver: false
        };

        this.targetEnemy = null;   // Musuh yang sedang dikunci/diketik
        this.activeEnemyGroup = null;
    }

    /**
     * Memuat Aset Secara Dinamis
     */
    preload() {
        // Load Karakter Utama
        this.load.image('wizard', 'images/characters/Luma_cimol.png');

        // Auto-load musuh yang terdaftar di level ini saja
        this.level.enemies.forEach(enemy => {
            this.load.image(enemy.sprite, enemy.imagePath);
        });
    }

    create() {
        const { width, height } = this.scale;

        // 1. Inisialisasi Visual & UI
        this.setupEnvironment(width, height);
        this.setupHUD(width, height);
        
        // 2. Inisialisasi Sistem Musuh
        this.enemies = this.add.group();
        this.typingBar = new TypingBar(this, width / 2, height - 55);

        // 3. Jalankan Spawner (Muncul 1 langsung, sisanya berkala)
        this.spawnEnemy();
        this.spawnTimer = this.time.addEvent({
            delay: 3000, 
            callback: () => this.spawnEnemy(),
            loop: true
        });

        // 4. Jalankan Timer Level
        this.setupLevelTimer();

        // 5. Input Handler (Arrow function menjaga konteks 'this')
        this.input.keyboard.on('keydown', (e) => this.handleTyping(e));
    }

    // --- SEKSI SETUP ---

    setupEnvironment(width, height) {
        // Background Langit & Tanah
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);
        this.add.rectangle(0, height - 120, width, 120, 0x150d1d).setOrigin(0);

        // Bintang Random
        for (let i = 0; i < 25; i++) {
            this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height * 0.6), 1.2, 0xffffff, 0.3);
        }

        // Wizard Player
        this.wizard = this.add.image(150, height - 230, 'wizard').setScale(0.3);
        
        // Animasi Idle Wizard (Breathe effect)
        this.tweens.add({
            targets: this.wizard,
            y: this.wizard.y - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    setupHUD(width, height) {
        // Area Mana (Kiri Atas)
        this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(20, 25, 200, 30, 8);
        this.manaFill = this.add.graphics();

        // Area Coins (Kanan Atas)
        this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(width - 220, 25, 200, 30, 8);
        this.coinText = this.add.text(width - 35, 32, '', { 
            fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace', fontWeight: 'bold' 
        }).setOrigin(1, 0);

        // Info Level (Tengah Atas)
        this.infoText = this.add.text(width / 2, 40, '', { 
            fontSize: '22px', fontFamily: 'monospace', color: '#ffffff' 
        }).setOrigin(0.5);

        this.updateUI();
    }

    setupLevelTimer() {
        this.levelTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.state.isGameOver) return;
                this.state.timeLeft--;
                this.updateUI();
                if (this.state.timeLeft <= 0) this.checkWinCondition();
            },
            loop: true
        });
    }

    // --- SEKSI LOGIKA GAMEPLAY ---

    handleTyping(event) {
        if (this.state.isGameOver) return;

        const char = event.key.toUpperCase();
        if (char.length > 1) return;

        // TARGETING SYSTEM
        if (!this.targetEnemy) {
            // Cari musuh terdekat yang huruf depannya cocok
            const candidates = this.enemies.getChildren()
                .filter(e => e.active && e.targetWord[0] === char)
                .sort((a, b) => a.x - b.x);

            if (candidates.length > 0) {
                this.targetEnemy = candidates[0];
                this.state.currentIndex = 1;
            }
        } else {
            // Jika sudah ada target, periksa urutan huruf
            if (char === this.targetEnemy.targetWord[this.state.currentIndex]) {
                this.state.currentIndex++;
            } else {
                this.applyPenalty();
            }
        }

        // Cek Kata Selesai
        if (this.targetEnemy && this.state.currentIndex === this.targetEnemy.targetWord.length) {
            this.resolveCombat(true);
            this.targetEnemy = null;
            this.state.currentIndex = 0;
        }

        this.refreshVisuals();
    }

    spawnEnemy() {
        if (this.state.isGameOver) return;

        const enemyTemplate = Phaser.Utils.Array.GetRandom(this.level.enemies);
        const data = gameData.getEnemyFullData(enemyTemplate.id);
        
        const spawnX = this.scale.width + 100;
        const spawnY = this.scale.height - 180;

        const newEnemy = new Enemy(this, spawnX, spawnY, data);
        newEnemy.targetWord = Phaser.Utils.Array.GetRandom(data.library.words);
        
        this.enemies.add(newEnemy);
        this.refreshVisuals();
    }

    update() {
        if (this.state.isGameOver) return;

        this.enemies.getChildren().forEach(enemy => {
            enemy.move();
            // Jarak pukul (Jika musuh sampai di x=260)
            if (enemy.x <= 260) {
                this.takeDamage(enemy);
            }
        });
    }

    resolveCombat(isWin) {
        if (isWin && this.targetEnemy) {
            const { bonusCoin, answerMana } = this.targetEnemy.stats.library;
            
            // Mana hanya bertambah jika tidak sedang penuh
            this.state.mana = Math.min(1000, this.state.mana + answerMana);
            this.state.score += (this.level.baseCoin + bonusCoin);
            this.state.defeatedCount++;

            this.targetEnemy.die();
            this.cameras.main.flash(100, 0, 255, 200, 0.2);
        }
        
        this.updateUI();
    }

    applyPenalty() {
        this.state.mana = Math.max(0, this.state.mana - 15);
        this.cameras.main.shake(100, 0.003);
        this.updateUI();
    }

    takeDamage(enemy) {
        this.state.mana = Math.max(0, this.state.mana - enemy.stats.attackPower);
        
        if (this.targetEnemy === enemy) {
            this.targetEnemy = null;
            this.state.currentIndex = 0;
        }

        enemy.die();
        this.cameras.main.flash(200, 255, 0, 0, 0.5);
        this.updateUI();

        if (this.state.mana <= 0) this.endGame(false);
    }

    // --- REFRESH VISUAL & UI ---

    refreshVisuals() {
        const word = this.targetEnemy ? this.targetEnemy.targetWord : "";
        this.typingBar.update(word, this.state.currentIndex);

        this.enemies.getChildren().forEach(e => {
            const idx = (e === this.targetEnemy) ? this.state.currentIndex : 0;
            e.updateVisuals(e.targetWord, idx);
        });
    }

    updateUI() {
        // Update Mana Bar
        if (this.manaFill) {
            this.manaFill.clear().fillStyle(0x00ffff, 1)
                .fillRoundedRect(20, 25, (this.state.mana / 1000) * 200, 30, 8);
        }

        // Update Text Info
        if (this.coinText) this.coinText.setText(`COINS: ${this.state.score}`);
        if (this.infoText) {
            this.infoText.setText(
                `TARGET: ${this.state.defeatedCount}/${this.level.minTarget} | TIME: ${this.state.timeLeft}s`
            );
        }
    }

    checkWinCondition() {
        const isSuccess = this.state.defeatedCount >= this.level.minTarget;
        this.endGame(isSuccess);
    }

    endGame(isSuccess) {
        this.state.isGameOver = true;
        this.spawnTimer.remove();
        this.levelTimer.remove();
        this.enemies.clear(true, true);

        const msg = isSuccess ? "LEVEL CLEARED!" : "MISSION FAILED!";
        const color = isSuccess ? '#00ffcc' : '#ff4d6d';

        this.add.text(this.scale.width / 2, this.scale.height / 2, msg, { 
            fontSize: '64px', fontFamily: 'monospace', fontWeight: 'bold', color: color
        }).setOrigin(0.5);

        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }
}