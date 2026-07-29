import Phaser from 'phaser';
import { gameData } from '../data';
import Enemy from '../game/prefabs/Enemy';
import TypingBar from '../game/ui/TypingBar';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.currentLevelIndex = data.levelIndex ?? 0;
        this.level = gameData.getLevel(this.currentLevelIndex);
        this.user = gameData.getUser();

        if (!this.level) {
            console.error("Data Level tidak ditemukan!");
            this.scene.start('MenuScene');
            return;
        }

        this.state = {
            score: 0,
            mana: 1000,
            maxMana: 1000,
            currentIndex: 0,
            defeatedCount: 0,
            timeLeft: this.level.timeTarget,
            isGameOver: false
        };

        this.targetEnemy = null;
    }

    preload() {
        this.load.image('wizard_idle', 'images/characters/Luma_cimol.png');
        this.load.image('wizard_attack', 'images/characters/Wizard_chanting.png');

        this.level.enemies.forEach(enemy => {
            this.load.image(enemy.sprite, enemy.imagePath);
        });
    }

    create() {
        const { width, height } = this.scale;

        this.setupEnvironment(width, height);
        this.setupHUD(width, height);

        this.enemies = this.add.group();
        this.typingBar = new TypingBar(this, width / 2, height - 55);

        this.spawnEnemy();
        this.spawnTimer = this.time.addEvent({
            delay: 3000,
            callback: () => this.spawnEnemy(),
            loop: true
        });

        this.setupLevelTimer();

        // Input Handler
        this.input.keyboard.on('keydown', (e) => this.handleTyping(e));
    }

    setupEnvironment(width, height) {
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);
        this.add.rectangle(0, height - 120, width, 120, 0x150d1d).setOrigin(0);

        for (let i = 0; i < 25; i++) {
            this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height * 0.6), 1.2, 0xffffff, 0.3);
        }

        this.wizard = this.add.image(150, height - 230, 'wizard_idle').setScale(0.3);

        // IMPROVE: Nama karakter di atas wizard
        this.add.text(150, height - 370, this.user.userName, {
            fontSize: '24px', fontFamily: 'monospace', color: '#00ffcc',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        // IMPROVE: Animasi Breathe
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
        // 1. Koordinat dasar Bar Mana
        const barX = 20;
        const barY = 25;
        const barWidth = 200;
        const barHeight = 30;

        // Gambar Container Gelap di belakang
        this.add.graphics()
            .fillStyle(0x000000, 0.5)
            .fillRoundedRect(barX, barY, barWidth + 60, barHeight, 8);

        // object ini untuk isi mana
        this.manaFill = this.add.graphics();

        // tambah bagian teks samping mana
        this.add.text(barX + barWidth + 10, barY + 7, 'MANA', {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#00ffff'
        });

        // area coins
        this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(width - 150, 25, 150, 30, 10);
        this.coinText = this.add.text(width - 35, 32, '', {
            fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace', fontWeight: 'bold'
        }).setOrigin(1, 0);

        // info level
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

    handleTyping(event) {
        if (this.state.isGameOver) return;

        const char = event.key.toUpperCase();
        if (char.length > 1) return;

        if (!this.targetEnemy) {
            const candidates = this.enemies.getChildren()
                .filter(e => e.active && e.targetWord[0] === char)
                .sort((a, b) => a.x - b.x);

            if (candidates.length > 0) {
                this.targetEnemy = candidates[0];
                this.state.currentIndex = 1;
                this.typingBar.triggerLockOn();
                this.typingBar.triggerHit();
            } else {
                this.typingBar.triggerInvalid();
            }
        }
        else {
            if (char === this.targetEnemy.targetWord[this.state.currentIndex]) {
                this.state.currentIndex++;
                this.typingBar.triggerHit();
                // IMPROVE: Partikel saat ketik benar
                this.createTypingParticle(this.input.x, this.input.y);
            } else {
                this.applyPenalty();
                this.typingBar.triggerMiss();
            }
        }

        if (this.targetEnemy && this.state.currentIndex === this.targetEnemy.targetWord.length) {
            this.resolveCombat(true);
            this.targetEnemy = null;
            this.state.currentIndex = 0;
        }

        this.refreshVisuals();
    }

    createTypingParticle(x, y) {
        const p = this.add.circle(x, y, 4, 0x00ffff);
        this.tweens.add({
            targets: p,
            y: y - 30,
            x: x + Phaser.Math.Between(-20, 20),
            alpha: 0,
            scale: 0,
            duration: 400,
            onComplete: () => p.destroy()
        });
    }

    spawnEnemy() {
        if (this.state.isGameOver) return;

        const enemyTemplate = Phaser.Utils.Array.GetRandom(this.level.enemies);
        const enemyStats = gameData.getEnemyFullData(enemyTemplate.id);

        const spawnX = this.scale.width + 100;
        const groundY = this.scale.height - 180;
        let spawnY = groundY;

        if (enemyStats.movementType === "Flying") {
            spawnY = groundY - Phaser.Math.Between(150, 300);
        } else {
            spawnY = groundY + Phaser.Math.Between(-5, 15);
        }

        const newEnemy = new Enemy(this, spawnX, spawnY, enemyStats);
        newEnemy.targetWord = Phaser.Utils.Array.GetRandom(enemyStats.library.words);

        this.enemies.add(newEnemy);
        this.refreshVisuals();
    }

    update() {
        if (this.state.isGameOver) return;

        this.enemies.getChildren().forEach(enemy => {
            enemy.move();
            if (enemy.x <= 260) {
                this.takeDamage(enemy);
            }
        });
    }

    resolveCombat(isWin) {
        if (isWin && this.targetEnemy) {
            const { bonusCoin, answerMana } = this.targetEnemy.stats.library;

            // IMPROVE: Texture swap attack feedback
            this.wizard.setTexture('wizard_attack');
            this.time.delayedCall(500, () => {
                if (this.scene.isActive()) this.wizard.setTexture('wizard_idle');
            });

            this.state.mana = Math.min(1000, this.state.mana + answerMana);
            this.state.score += (this.level.baseCoin + bonusCoin);
            this.state.defeatedCount++;

            this.targetEnemy.die();
            this.cameras.main.flash(100, 0, 255, 200, 0.2);
        }
        this.updateUI();
    }

    reduceMana(amount) {
        if (this.state.isGameOver) return;

        // Kurangi mana
        this.state.mana = Math.max(0, this.state.mana - amount);
        this.updateUI();

        // Cek jika habis
        if (this.state.mana <= 0) {
            this.endGame(false); // Game Over (Kalah)
        }
    }

    applyPenalty() {
        // Efek visual
        this.cameras.main.shake(100, 0.003);

        // Gunakan fungsi pembantu (kurangi 15 mana)
        this.reduceMana(15);
    }

    takeDamage(enemy) {
        // Efek visual
        this.cameras.main.flash(200, 255, 0, 0, 0.5);

        // Jika musuh yang menabrak adalah yang sedang diketik, reset target
        if (this.targetEnemy === enemy) {
            this.targetEnemy = null;
            this.state.currentIndex = 0;
        }

        // Simpan attack power musuh sebelum dihancurkan
        const damage = enemy.stats.attackPower;

        enemy.die();

        // Gunakan fungsi pembantu untuk kurangi mana sesuai kekuatan musuh
        this.reduceMana(damage);
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

    refreshVisuals() {
        const word = this.targetEnemy ? this.targetEnemy.targetWord : "";
        this.typingBar.update(word, this.state.currentIndex);

        this.enemies.getChildren().forEach(e => {
            const idx = (e === this.targetEnemy) ? this.state.currentIndex : 0;
            e.updateVisuals(e.targetWord, idx);
        });
    }

    updateUI() {
        if (this.manaFill) {
            this.manaFill.clear().fillStyle(0x00ffff, 1)
                .fillRoundedRect(20, 25, (this.state.mana / 1000) * 200, 30, 8);
        }

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
        if (this.state.isGameOver) return;
        this.state.isGameOver = true;

        // 1. Matikan sistem
        if (this.spawnTimer) this.spawnTimer.remove();
        if (this.levelTimer) this.levelTimer.remove();

        // 2. Bersihkan layar
        this.enemies.clear(true, true);

        // 3. Panggil Pop-up Result
        this.scene.launch('ResultScene', {
            isWin: isSuccess,
            score: this.state.score,
            levelIndex: this.currentLevelIndex
        });

        // 4. Pause agar visual tetap diam di belakang modal
        this.scene.pause();
    }
}