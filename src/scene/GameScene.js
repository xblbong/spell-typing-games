import Phaser from 'phaser';
import { gameData } from '../data';
import Enemy from '../game/prefabs/Enemy';
import TypingBar from '../game/ui/TypingBar';
import { wordLibrary } from '../data/wordLibrary';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    /**
     * [INIT] Persiapan data sebelum scene dimuat.
     * Mengambil data level dari MenuScene dan mengatur status awal pemain.
     */
    init(data) {
        // Menyimpan index level untuk keperluan Reset/Retry
        this.currentLevelIndex = data.levelIndex ?? 0;
        this.level = gameData.getLevel(this.currentLevelIndex);
        this.user = gameData.getUser();

        // Cek keamanan data
        if (!this.level) {
            console.error("Data Level tidak ditemukan!");
            this.scene.start('MenuScene');
            return;
        }

        // State Utama: Data yang berubah selama permainan berlangsung
        this.state = {
            score: 0,               // Koin terkumpul
            mana: 1000,            // Nyawa penyihir
            maxMana: 1000,         // Batas nyawa penuh
            currentIndex: 0,       // Huruf yang sedang diketik
            defeatedCount: 0,      // Musuh yang sudah dikalahkan
            timeLeft: this.level.timeTarget, // Waktu mundur level
            isGameOver: false,     // Status permainan

            // Statistik tambahan untuk hasil akhir WPM & Akurasi
            totalCharsTyped: 0, // Total huruf yang diketik pemain
            totalWordsTyped: 0,   // Total kata yang diketik pemain
            gameStartTime: 0, // Waktu mulai level (dalam milidetik)
            isStarted: false, // Penanda level sudah dimulai

            //Statistik Evaluasi Penyihir
            spellsPerfect: 0, // Hitungan setiap satu kata selesai tanpa salah ketik sama sekali
            totalErrors: 0,   // Hitungan setiap kali fungsi applyPenalty() dipanggil
            isCurrentWordPerfect: true // Penanda apakah kata yang sedang diketik ini sempurna atau tidak
        };

        this.targetEnemy = null;   // Musuh yang sedang dikunci/diketik
    }

    /**
     * [PRELOAD] Memuat aset gambar, suara, dan data kata.
     */
    preload() {
        // Aset Penyihir
        this.load.image('wizard_idle', 'images/characters/Luma_cimol.png');
        this.load.image('wizard_dead', 'images/characters/Luma_died.png');
        this.load.image('wizard_attack', 'images/characters/Wizard_chanting.png');

        // Background dinamis
        if (this.level.bgKey && this.level.bgPath) {
            this.load.image(this.level.bgKey, this.level.bgPath);
        }

        // Efek Suara
        this.load.audio('keyboard', 'music/keyboard.mp3');
        this.load.audio('correct', 'music/complate-correct.mp3');
        this.load.audio('uncorrect', 'music/uncorrect.mp3');
        this.load.audio('sparkle', 'music/sparkle-effect.mp3');
        this.load.audio('attack', 'music/attack.mp3');
        this.load.audio('boom', 'music/boom.mp3');
        this.load.audio('bgm_music', 'music/background-music.mp3');

        // Aset foto Serangan
        this.load.image('attack_vfx', 'images/weaponry/Waterball.png');

        // Memuat semua musuh yang ada di level ini
        this.level.enemies.forEach(enemy => {
            this.load.image(enemy.sprite, enemy.imagePath);
        });

        // Memuat database kata dari JSON
        this.level.enemies.forEach(enemy => {
            const lib = wordLibrary[enemy.wordLibID];
            if (lib && lib.jsonPath && !this.cache.json.exists(lib.jsonKey)) {
                this.load.json(lib.jsonKey, lib.jsonPath);
            }
        });
    }

    /**
     * [CREATE] Menyusun objek visual ke layar.
     */
    create() {
        const { width, height } = this.scale;

        // 1. Setup Latar Belakang
        this.setupEnvironment(width, height);

        // 2. Setup Antarmuka (HUD)
        this.setupHUD(width, height);

        // 3. Setup Grup dan Bar Pengetikan
        this.enemies = this.add.group();
        this.typingBar = new TypingBar(this, width / 2, height - 55);

        // 4. Sistem Muncul Musuh (Spawn)
        this.spawnEnemy();
        this.spawnTimer = this.time.addEvent({
            delay: 3000,
            callback: () => this.spawnEnemy(),
            loop: true
        });

        // 5. Jalankan Timer Level
        this.setupLevelTimer();

        // 6. Tangkap Input Keyboard
        this.input.keyboard.on('keydown', (e) => this.handleTyping(e));

        // 7. Musik Latar
        if (!this.sound.get('bgm_music')) {
            const bgm = this.sound.add('bgm_music', { volume: 0.3, loop: true });
            bgm.play();
        }
    }

    /**
     * [SETUP ENVIRONMENT] Mengatur background dan animasi penyihir.
     */
    setupEnvironment(width, height) {
        if (this.level.bgKey && this.textures.exists(this.level.bgKey)) {
            const bg = this.add.image(width / 2, height / 2, this.level.bgKey);
            bg.setDisplaySize(width, height);
        }

        // Tanah tempat musuh berjalan
        this.add.rectangle(0, height - 120, width, 120, 0x150d1d, 0.5).setOrigin(0);

        // Hiasan Bintang
        for (let i = 0; i < 25; i++) {
            this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height * 0.6), 1.2, 0xffffff, 0.3);
        }

        // Penyihir (Luma Cimol)
        this.wizard = this.add.image(150, height - 230, 'wizard_idle').setScale(0.3);
        this.add.text(150, height - 370, this.user.userName, {
            fontSize: '24px', fontFamily: 'monospace', color: '#00ffcc',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        // Efek Wizard Bernapas
        this.tweens.add({
            targets: this.wizard, y: this.wizard.y - 20, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }

    /**
     * [SETUP HUD] Header bar untuk nyawa, skor, dan info level.
     */
    setupHUD(width, height) {
        const barX = 20; const barY = 25;
        this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(barX, barY, 260, 30, 8);
        this.manaFill = this.add.graphics();
        this.add.text(barX + 210, barY + 7, 'MANA', { fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold', color: '#00ffff' });

        this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(width - 150, 25, 150, 30, 10);
        this.coinText = this.add.text(width - 35, 32, '', { fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace', fontWeight: 'bold' }).setOrigin(1, 0);

        this.infoText = this.add.text(width / 2, 40, '', { fontSize: '22px', fontFamily: 'monospace', color: '#ffffff' }).setOrigin(0.5);
        this.updateUI();
    }

    /**
     * [HANDLE TYPING] Mendeteksi input keyboard pemain.
     */
    handleTyping(event) {
        //jika permainan sudah berakhir, hentikan logika ini
        if (this.state.isGameOver) return;
        const char = event.key.toUpperCase();
        if (char.length > 1) return; //jika panjang karakter lebih dari 1, hentikan logika ini (untuk tombol seperti Shift, Enter, dll)

        let isCorrectKey = false; // set false terlebih dahulu, nanti akan diubah menjadi true jika benar

        //jika permainan belum dimulai, catat waktu mulai level saat pemain mengetik huruf pertama
        if (!this.state.isStarted) {
            this.state.isStarted = true;
            this.state.gameStartTime = this.time.now; // Catat waktu mulai level
        }

        // Jika belum ada target yang sedang diketik
        if (!this.targetEnemy) {
            const candidates = this.enemies.getChildren()
                .filter(e => e.active && !e.isDying && e.targetWord[0] === char)
                .sort((a, b) => a.x - b.x); // Pilih musuh paling depan

            if (candidates.length > 0) {
                this.targetEnemy = candidates[0];
                this.state.currentIndex = 1;
                this.state.isCurrentWordPerfect = true; // Reset penanda kata sempurna
                this.typingBar.triggerLockOn();
                this.typingBar.triggerHit();

                this.state.totalCharsTyped++; // Tambah total huruf yang diketik
                this.state.totalWordsTyped++; // Tambah total kata yang diketik
                isCorrectKey = true;
            } else {
                this.typingBar.triggerInvalid();
                this.state.totalErrors++; // Tambah total kesalahan ketik
                this.cameras.main.flash(100, 255, 0, 0, 0.2);
                this.sound.play('uncorrect', { volume: 0.4 });
            }
        } else {
            // Lanjutkan mengetik target yang sudah dikunci
            if (char === this.targetEnemy.targetWord[this.state.currentIndex]) {
                this.state.currentIndex++;
                this.typingBar.triggerHit();
                this.createTypingParticle(this.input.x, this.input.y);

                this.state.totalCharsTyped++; // Tambah total huruf yang diketik
                this.state.totalWordsTyped++; // Tambah total kata yang diketik
                isCorrectKey = true;
            } else {
                this.state.isCurrentWordPerfect = false; // Tandai kata ini tidak sempurna
                this.state.totalErrors++; // Tambah total kesalahan ketik
                this.applyPenalty();
                this.typingBar.triggerMiss();
                this.sound.play('uncorrect', { volume: 0.4 });
            }
        }

        // Jika pemain menekan tombol yang benar, mainkan efek suara keyboard dengan variasi detune
        if (isCorrectKey) {
            this.sound.play('keyboard', { volume: 0.5, detune: Phaser.Math.Between(-100, 100) });
        }

        // Jika satu kata selesai: Musuh baru boleh mati
        if (this.targetEnemy && this.state.currentIndex === this.targetEnemy.targetWord.length) {
            // Kita jalankan refreshVisuals dulu agar huruf terakhir sempat berubah HIJAU/CYAN
            this.refreshVisuals();

            this.sound.play('correct', { volume: 0.6 });

            //kasih jeda sedikit sebelum musuh mati agar efek visual huruf terakhir sempat terlihat
            this.time.delayedCall(100, () => {
                if (this.targetEnemy) {
                    //jika kata yang diketik sempurna, maka tambah hitungan kata sempurna
                    if (this.state.isCurrentWordPerfect) this.state.spellsPerfect++; // Tambah hitungan kata sempurna

                    this.resolveCombat(true);
                    this.targetEnemy = null;
                    this.state.currentIndex = 0;
                    this.refreshVisuals();
                }
            });

            return; // Hentikan logika di sini agar tidak memanggil refreshVisuals dua kali
        } else {
            this.refreshVisuals();
        }
    }

    /**
     * [RESOLVE COMBAT] Menangani saat satu kata musuh selesai diketik.
     */
    resolveCombat(isWin) {
        if (isWin && this.targetEnemy) {
            const { bonusCoin, answerMana } = this.targetEnemy.stats.library;

            // Visual: Wizard menyerang
            this.wizard.setTexture('wizard_attack');
            this.sound.play('attack', { volume: 0.7 });
            this.time.delayedCall(500, () => { if (this.scene.isActive()) this.wizard.setTexture('wizard_idle'); });

            // Tambah Poin & Mana
            this.state.mana = Math.min(1000, this.state.mana + answerMana);
            this.state.score += (this.level.baseCoin + bonusCoin);
            this.state.defeatedCount++;

            // Visual: Musuh Kedip Mati
            this.sound.play('boom', { volume: 0.5 });
            this.targetEnemy.die();
            this.cameras.main.flash(100, 0, 255, 200, 0.2);
        }
        this.updateUI();
    }

    /**
     * [REDUCE MANA] Fungsi pusat pengurangan darah (Mana).
     */
    reduceMana(amount) {
        if (this.state.isGameOver) return;
        this.state.mana = Math.max(0, this.state.mana - amount);
        this.updateUI();
        this.wizard.setTexture('wizard_dead');
        this.time.delayedCall(800, () => { if (!this.state.isGameOver) this.wizard.setTexture('wizard_idle'); });
        if (this.state.mana <= 0) this.endGame(false);
    }

    applyPenalty() {
        this.cameras.main.shake(100, 0.003);
        this.cameras.main.flash(200, 255, 0, 0, 0.4);
        this.reduceMana(15);
    }

    /**
     * [HANDLE CONTACT DAMAGE] Musuh tertahan dan memukul wizard.
     */
    handleContactDamage(enemy) {
        //jika permainan sudah berakhir, hentikan logika ini
        if (this.state.isGameOver) return;
        // dimana camera akan berkedip merah, suara ledakan, dan mengurangi mana pemain
        this.cameras.main.flash(200, 255, 0, 0, 0.5);
        this.sound.play('boom', { volume: 0.3 });
        this.reduceMana(enemy.stats.attackPower);

        //apakah musuh yang sedang kita ketik ini masih hidup? jika iya, maka kita reset targetEnemy dan currentIndex agar pemain bisa mengetik musuh lain
        if (this.targetEnemy === enemy) {
            this.targetEnemy = null; // Reset target musuh karena musuh ini sudah menyerang
            this.state.currentIndex = 0; // Reset indeks pengetikan karena musuh mati
            this.refreshVisuals(); // Refresh visual agar bar pengetikan dan musuh diperbarui

            if (this.cache.audio.exists('uncorrect')) {
                this.sound.play('uncorrect', { volume: 0.4 });
            }
        }

        //setelah menyerang musuh langsung menjalankan fungsi die() kedip untuk menghilangkan musuh dari permainan
        enemy.die(); // Musuh mati setelah menyerang

        //refresh visual untuk memperbarui tampilan bar pengetikan dan musuh
        this.refreshVisuals();
    }

    /**
     * [SPAWN ENEMY] Menciptakan musuh baru.
     */
    spawnEnemy() {
        if (this.state.isGameOver) return;
        const enemyTemplate = Phaser.Utils.Array.GetRandom(this.level.enemies);
        const enemyStats = gameData.getEnemyFullData(enemyTemplate.id);

        const wordList = this.cache.json.get(enemyStats.library.jsonKey);
        const randomWord = Phaser.Utils.Array.GetRandom(wordList || ["MAGIC"]);

        // FIX: Spacing lebih acak agar tidak keluar layar sekaligus atau tumpang tindih
        const spawnX = this.scale.width + Phaser.Math.Between(100, 300);
        const groundY = this.scale.height - 180;

        let spawnY = (enemyStats.movementType === "Flying") ? groundY - Phaser.Math.Between(150, 350) : groundY + Phaser.Math.Between(-5, 20);

        const newEnemy = new Enemy(this, spawnX, spawnY, enemyStats);
        newEnemy.targetWord = randomWord.toUpperCase();
        this.enemies.add(newEnemy);
        this.refreshVisuals();
    }

    /**
     * [UPDATE] Fungsi loop pengecekan posisi.
     */
    update() {
        if (this.state.isGameOver) return;

        const children = this.enemies.getChildren();
        children.forEach((enemy, index) => {
            if (!enemy.active || enemy.isDying) return;

            // 1. Logika Serangan FarAttack jika musuh tipe ini sudah sampai batas tertentu, maka musuh akan menembakkan proyektil ke wizard. Kita cek apakah musuh sudah menyerang atau belum.
            if (enemy.stats.enemyCategory === "FarAttack" && !enemy.isAttacking) {
                this.enemyShoot(enemy);
            }

            // 2. FIX: LOGIKA STANDOFF (Garis Pertahanan)
            // KUNCI: Kita buat target berhenti bervariasi agar tidak tumpuk sempurna (280 + index * 15)
            const stopPoint = 280 + (index * 15);

            //jika enemy.x sudah sampai batas stopPoint, maka musuh akan berhenti dan menyiapkan serangan terakhir ke wizard.
            if (enemy.x <= stopPoint) {
                //Jika musuh sudah menyiapkan serangan dan belum menyerang, maka musuh akan menyerang wizard setelah 2 detik. Jika musuh sudah menyerang, maka tidak akan menyerang lagi.
                if (!enemy.isPreparingStrike) {
                    enemy.isPreparingStrike = true; // musuh diam di tempat dan menyiapkan serangan terakhir
                    // Efek visual: Musuh berkedip merah sebelum menyerang
                    enemy.sprite.setTint(0xff0000);
                    this.time.delayedCall(2000, () => { // Delay 2 detik sebelum menyerang
                        // Pastikan musuh masih ada (belum diketik mati oleh pemain)
                        if (enemy.active && !enemy.isDying && !this.state.isGameOver) {
                            this.handleContactDamage(enemy); // Pukul Wizard lalu mati (die)
                        }
                    });
                }
            } else {
                enemy.move(); // Musuh maju jika belum sampai batas
            }
        });
    }

    /**
     * [ENEMY SHOOT] Tembakan proyektil musuh.
     */
    enemyShoot(enemy) {
        if (!enemy.active || enemy.isDying) return;
        enemy.isAttacking = true;
        const projectile = this.add.image(enemy.x, enemy.y, 'attack_vfx');
        projectile.setScale(0.2);

        this.tweens.add({
            targets: projectile, x: this.wizard.x, y: this.wizard.y, duration: 1500,
            onComplete: () => {
                if (!this.state.isGameOver) {
                    this.cameras.main.flash(200, 255, 0, 0, 0.3);
                    this.reduceMana(enemy.stats.attackPower);
                    this.sound.play('uncorrect', { volume: 0.3 });
                }
                projectile.destroy();
                this.time.delayedCall(3000, () => { if (enemy.active && !enemy.isDying) enemy.isAttacking = false; });
            }
        });
    }

    /**
     * [REFRESH VISUALS] Sinkronkan teks.
     */
    refreshVisuals() {
        const word = this.targetEnemy ? this.targetEnemy.targetWord : "";
        this.typingBar.update(word, this.state.currentIndex);
        this.enemies.getChildren().forEach(e => {
            const idx = (e === this.targetEnemy) ? this.state.currentIndex : 0;
            e.updateVisuals(e.targetWord, idx);
        });
    }

    /**
     * [UPDATE UI] Header bar.
     */
    updateUI() {
        if (this.manaFill) {
            this.manaFill.clear().fillStyle(0x00ffff, 1).fillRoundedRect(20, 25, (this.state.mana / 1000) * 200, 30, 8);
        }
        this.coinText?.setText(`COINS: ${this.state.score}`);
        this.infoText?.setText(`TARGET: ${this.state.defeatedCount}/${this.level.minTarget} | TIME: ${this.state.timeLeft}s`);
    }

    checkWinCondition() {
        if (this.state.defeatedCount >= this.level.minTarget) this.endGame(true);
        else if (this.state.timeLeft <= 0) this.endGame(false);
    }

    /** 
     * [CALCULATE WPM] Menghitung kecepatan mengetik pemain.
     * Rumus: WPM = (Total Kata / Total Menit) = (totalWordsTyped / (elapsedTimeInSeconds / 60))
     */

    calculateWPM() {
        //Hitung total detik yang telah berlalu sejak level dimulai
        const totalTimeSeconds = (this.time.now - this.state.gameStartTime) / 1000;
        const minutes = totalTimeSeconds / 60;

        //jika waktu kurang dari atau sama dengan 0 atau total huruf yang diketik adalah 0, maka WPM = 0    
        if (minutes <= 0 || this.state.totalCharsTyped === 0) return 0;

        //rumus WPM (karakter diketik / 5) / menit
        const wpm = (this.state.totalCharsTyped / 5) / minutes;
        return Math.round(wpm); // Bulatkan ke angka terdekat

        // Jika ingin menggunakan total kata yang diketik, gunakan baris berikut:
        // const wpm = this.state.totalWordsTyped / minutes;
        // return Math.round(wpm);
    }

    /**
     * [END GAME] Berhenti dan panggil Pop-up.
     */
    endGame(isSuccess) {
        if (this.state.isGameOver) return;
        this.state.isGameOver = true;

        //hitung WPM saat permainan berakhir
        const finalWPM = this.calculateWPM();

        //hitung akurasi benar atau salah (jika total huruf yang diketik lebih dari 0, maka akurasi = (total kata yang diketik / total huruf yang diketik) * 100)
        const totalAttempts = this.state.totalCharsTyped + this.state.totalErrors;
        const accuracy = totalAttempts > 0 ? Math.round((this.state.totalCharsTyped / totalAttempts) * 100) : 0;

        if (!isSuccess) this.wizard.setTexture('wizard_dead');
        if (this.spawnTimer) this.spawnTimer.remove();
        if (this.levelTimer) this.levelTimer.remove();
        this.enemies.clear(true, true);

        if (isSuccess && this.cache.audio.exists('sparkle')) this.sound.play('sparkle', { volume: 0.8 });
        this.scene.launch('ResultScene', {
            isWin: isSuccess,
            score: this.state.score,
            levelIndex: this.currentLevelIndex,
            wpm: finalWPM,
            accuracy: accuracy > 100 ? 100 : accuracy,
            defeated: this.state.defeatedCount,
            perfect: this.state.spellsPerfect,
            errors: this.state.totalErrors
        });
        this.scene.pause();
    }

    createTypingParticle(x, y) {
        const p = this.add.circle(x, y, 4, 0x00ffff);
        this.tweens.add({ targets: p, y: y - 30, x: x + Phaser.Math.Between(-20, 20), alpha: 0, scale: 0, duration: 400, onComplete: () => p.destroy() });
    }

    setupLevelTimer() {
        this.levelTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.state.isGameOver) return;
                this.state.timeLeft--; this.updateUI();
                if (this.state.timeLeft <= 0) this.checkWinCondition();
            },
            loop: true
        });
    }
}