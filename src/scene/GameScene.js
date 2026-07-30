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
     * [INIT] Fungsi pertama yang dijalankan saat scene dimulai.
     * Digunakan untuk mengambil data dari scene sebelumnya dan mengatur state awal.
     */
    init(data) {
        // Ambil index level yang dipilih pemain (default ke 0/Level 1)
        this.currentLevelIndex = data.levelIndex ?? 0;
        this.level = gameData.getLevel(this.currentLevelIndex);
        this.user = gameData.getUser();

        // Safety check: Jika data level tidak ditemukan, balik ke Menu
        if (!this.level) {
            console.error("Data Level tidak ditemukan!");
            this.scene.start('MenuScene');
            return;
        }

        // State Utama Permainan: Menyimpan data yang berubah-ubah selama bermain
        this.state = {
            score: 0,               // Skor Koin yang dikumpulkan
            mana: 1000,            // Mana saat ini (mulai dari 1000)
            maxMana: 1000,         // Batas maksimal mana
            currentIndex: 0,       // Huruf ke-berapa yang sedang diketik pada target musuh
            defeatedCount: 0,      // Jumlah musuh yang sudah dikalahkan
            timeLeft: this.level.timeTarget, // Sisa waktu dari data level
            isGameOver: false      // Penanda apakah game sudah berakhir
        };

        this.targetEnemy = null;   // Menyimpan referensi musuh yang sedang "dikunci" untuk diketik
    }

    /**
     * [PRELOAD] Memuat aset gambar dan suara ke dalam memori browser.
     */
    preload() {
        // Memuat gambar karakter penyihir (Penyihir diam & Penyihir merapal mantra)
        this.load.image('wizard_idle', 'images/characters/Luma_cimol.png');
        this.load.image('wizard_dead', 'images/characters/Luma_dead.png');
        this.load.image('wizard_attack', 'images/characters/Wizard_chanting.png');

        // Memuat gambar untuk background Spesifik Level dari Data
        if (this.level.bgKey && this.level.bgPath) {
            this.load.image(this.level.bgKey, this.level.bgPath);
        }

        // Memuat semua Efek Suara (SFX)
        this.load.audio('keyboard', 'music/keyboard.mp3');      // Suara ngetik
        this.load.audio('correct', 'music/complate-correct.mp3'); // Suara satu kata selesai
        this.load.audio('uncorrect', 'music/uncorrect.mp3');     // Suara salah ketik
        this.load.audio('sparkle', 'music/sparkle-effect.mp3');         // Suara kemenangan (sparkle)
        this.load.audio('attack', 'music/attack.mp3');           // Suara saat penyihir menyerang
        this.load.audio('boom', 'music/boom.mp3');               // Suara musuh meledak/mati
        this.load.audio('bgm_music', 'music/background-music.mp3'); // Musik latar

        // Memuat Video Serangan Musuh
        this.load.video('attack_vfx', 'video/attack.mp4')

        // Memuat aset gambar musuh secara otomatis berdasarkan daftar musuh di level ini
        this.level.enemies.forEach(enemy => {
            this.load.image(enemy.sprite, enemy.imagePath);
        });

        // Memuat JSON Kata secara dinamis berdasarkan WordLibrary
        this.level.enemies.forEach(enemy => {
            const lib = wordLibrary[enemy.wordLibID];
            // Cek jika JSON belum di-load untuk menghindari double load
            if (lib.jsonPath && !this.cache.json.exists(lib.jsonKey)) {
                this.load.json(lib.jsonKey, lib.jsonPath);
                console.log(`Loading JSON Words: ${lib.jsonKey}`);
            }
        });
    }

    /**
     * [CREATE] Membuat objek visual dan sistem utama setelah aset selesai dimuat.
     */
    create() {
        const { width, height } = this.scale;

        // 1. Setup Lingkungan (Langit, Tanah, Bintang, Penyihir)
        this.setupEnvironment(width, height);

        // 2. Setup Tampilan HUD (Bar Mana, Koin, Info Level)
        this.setupHUD(width, height);

        // 3. Inisialisasi Grup Musuh (Tempat menyimpan banyak musuh sekaligus)
        this.enemies = this.add.group();

        // 4. Membuat Bar Pengetikan di bawah layar
        this.typingBar = new TypingBar(this, width / 2, height - 55);

        // 5. Sistem Munculnya Musuh (Spawner)
        this.spawnEnemy(); // Munculkan 1 musuh langsung saat start
        this.spawnTimer = this.time.addEvent({
            delay: 3000, // Munculkan musuh baru setiap 3 detik
            callback: () => this.spawnEnemy(),
            loop: true
        });

        // 6. Jalankan Timer Level (Berkurang setiap 1 detik)
        this.setupLevelTimer();

        // 7. Input Keyboard: Menangkap setiap tombol yang ditekan pemain
        this.input.keyboard.on('keydown', (e) => this.handleTyping(e));

        // 8. Menjalankan Musik Latar (BGM) jika belum ada yang main
        if (!this.sound.get('bgm_music')) {
            const bgm = this.sound.add('bgm_music', { volume: 0.3, loop: true });
            bgm.play();
        }
    }

    /**
     * [SETUP ENVIRONMENT] Mengatur latar belakang dan animasi penyihir.
     */
    setupEnvironment(width, height) {
        // tampilkan gambar background dari data level 
        if (this.level.bgKey && this.textures.exists(this.level.bgKey)) {
            const bg = this.add.image(width / 2, height / 2, this.level.bgKey); //letakan di tengah menggunakan width/2 dan height/2 
            bg.setDisplaySize(width, height); //setSize full size menutupi layar (fullscreen)
        } else {
            // gambar langit
            this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0); //fallback jika gambar tidak ada gunakan warna solid agar tidak putih
        }

        // Gambar Tanah
        this.add.rectangle(0, height - 120, width, 120, 0x150d1d, 0.5).setOrigin(0);

        // Partikel Bintang (Menambah suasana malam)
        for (let i = 0; i < 25; i++) {
            this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height * 0.6), 1.2, 0xffffff, 0.3);
        }

        // Tampilkan Penyihir
        this.wizard = this.add.image(150, height - 230, 'wizard_idle').setScale(0.3);

        // Nama karakter di atas wizard (Ambil dari data user)
        this.add.text(150, height - 370, this.user.userName, {
            fontSize: '24px', fontFamily: 'monospace', color: '#00ffcc',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        // Efek "Breathe" (Penyihir bergerak naik-turun halus)
        this.tweens.add({
            targets: this.wizard,
            y: this.wizard.y - 20,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * [SETUP HUD] Mengatur bar Mana, skor koin, dan info level.
     */
    setupHUD(width, height) {
        const barX = 20;
        const barY = 25;
        const barWidth = 200;
        const barHeight = 30;

        // Container Gelap untuk Bar Mana
        this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(barX, barY, barWidth + 60, barHeight, 8);
        this.manaFill = this.add.graphics();

        // Teks "MANA" di samping bar
        this.add.text(barX + barWidth + 10, barY + 7, 'MANA', {
            fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold', color: '#00ffff'
        });

        // Tampilan Koin di kanan atas
        this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(width - 150, 25, 150, 30, 10);
        this.coinText = this.add.text(width - 35, 32, '', {
            fontSize: '18px', color: '#ffcc00', fontFamily: 'monospace', fontWeight: 'bold'
        }).setOrigin(1, 0);

        // Teks Info Level (Target & Waktu) di tengah atas
        this.infoText = this.add.text(width / 2, 40, '', {
            fontSize: '22px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5);

        this.updateUI(); // Sinkronkan visual pertama kali
    }

    /**
     * [HANDLE TYPING] Jantung utama logika permainan (Mengetik).
     */
    handleTyping(event) {
        if (this.state.isGameOver) return; // Berhenti jika game sudah selesai

        const char = event.key.toUpperCase(); // Ambil tombol dan jadikan huruf kapital
        if (char.length > 1) return; // Abaikan tombol Shift, Ctrl, Enter, dll.

        let isCorrectKey = false; // Penanda untuk memutar suara keyboard

        // 1. Logika Jika BELUM PUNYA TARGET (Cari musuh yang huruf depannya cocok)
        if (!this.targetEnemy) {
            const candidates = this.enemies.getChildren()
                .filter(e => e.active && e.targetWord[0] === char)
                .sort((a, b) => a.x - b.x); // Cari musuh yang paling dekat (x terkecil)

            if (candidates.length > 0) {
                this.targetEnemy = candidates[0]; // Kunci target
                this.state.currentIndex = 1;      // Mulai dari huruf kedua
                this.typingBar.triggerLockOn();   // Feedback visual bar
                this.typingBar.triggerHit();      // Feedback visual kursor
                isCorrectKey = true;
            } else {
                this.typingBar.triggerInvalid(); // Visual bar jadi merah
                this.cameras.main.flash(100, 255, 0, 0, 0.2); // Kilatan merah tipis di layar
                if (this.cache.audio.exists('uncorrect')) {
                    this.sound.play('uncorrect', { volume: 0.4 });
                }
            }
        }
        // 2. Logika Jika SUDAH PUNYA TARGET (Lanjutkan urutan huruf)
        else {
            if (char === this.targetEnemy.targetWord[this.state.currentIndex]) {
                this.state.currentIndex++;
                this.typingBar.triggerHit();
                this.createTypingParticle(this.input.x, this.input.y); // Buat partikel cahaya
                isCorrectKey = true;
            } else {
                this.applyPenalty();
                this.typingBar.triggerMiss();
                // PENGAMAN: Cek dulu kuncinya ada tidak?
                if (this.cache.audio.exists('uncorrect')) {
                    this.sound.play('uncorrect', { volume: 0.4 });
                }
            }

        }

        // Mainkan suara keyboard jika tombol yang ditekan benar
        if (isCorrectKey) {
            this.sound.play('keyboard', {
                volume: 0.5,
                detune: Phaser.Math.Between(-100, 100) // Nada suara sedikit berbeda agar tidak bosan
            });
        }

        // 3. Cek Jika KATA SELESAI (Kalahkan musuh)
        if (this.targetEnemy && this.state.currentIndex === this.targetEnemy.targetWord.length) {
            this.sound.play('correct', { volume: 0.6 });
            this.resolveCombat(true); // Selesaikan pertarungan dengan kemenangan
            this.targetEnemy = null;  // Bebaskan target agar bisa ngetik musuh lain
            this.state.currentIndex = 0;
        }

        this.refreshVisuals(); // Update semua teks di layar
    }

    /**
     * [RESOLVE COMBAT] Menangani hasil akhir pengetikan satu kata.
     */
    resolveCombat(isWin) {
        if (isWin && this.targetEnemy) {
            const { bonusCoin, answerMana } = this.targetEnemy.stats.library;

            // Efek Suara & Pose Serangan Penyihir
            this.sound.play('attack', { volume: 0.7 });
            this.wizard.setTexture('wizard_attack');
            this.time.delayedCall(500, () => {
                if (this.scene.isActive()) this.wizard.setTexture('wizard_idle'); // Balik ke pose diam
            });

            // Tambah Mana & Koin dari data library musuh
            this.state.mana = Math.min(1000, this.state.mana + answerMana);
            this.state.score += (this.level.baseCoin + bonusCoin);
            this.state.defeatedCount++;

            // Ledakan musuh mati
            this.sound.play('boom', { volume: 0.5 });
            this.targetEnemy.die();
            this.cameras.main.flash(100, 0, 255, 200, 0.2); // Kilatan cahaya hijau
        }
        this.updateUI();
    }

    /**
     * [REDUCE MANA] Fungsi pusat untuk mengurangi nyawa (Mana).
     */
    reduceMana(amount) {
        if (this.state.isGameOver) return;

        this.state.mana = Math.max(0, this.state.mana - amount);
        this.updateUI();

        // Jika Mana habis, Game Over
        if (this.state.mana <= 0) {
            this.endGame(false);
        }
    }

    /**
     * [TAKE DAMAGE] Dipanggil saat musuh berhasil menabrak penyihir.
     */
    takeDamage(enemy) {
        this.cameras.main.flash(200, 255, 0, 0, 0.5); // Kilatan cahaya merah

        // Jika yang nabrak adalah target ketik, batalkan target
        if (this.targetEnemy === enemy) {
            this.targetEnemy = null;
            this.state.currentIndex = 0;
        }

        const damage = enemy.stats.attackPower; // Ambil kekuatan serang musuh
        this.sound.play('boom', { volume: 0.4 });
        enemy.die();
        this.reduceMana(damage); // Kurangi mana sesuai kekuatan musuh
    }

    applyPenalty() {
        this.cameras.main.shake(100, 0.003); // Getaran layar
        // Efek Kilatan Merah (Durasi: 200ms, Warna: Merah(255,0,0), Transparansi: 0.4)
        this.cameras.main.flash(200, 255, 0, 0, 0.4);
        this.reduceMana(15); // Hukuman salah ketik: -15 Mana
    }

    /**
     * [SPAWN ENEMY] Menciptakan musuh baru di sebelah kanan layar.
     */
    spawnEnemy() {
        if (this.state.isGameOver) return;

        // Ambil jenis musuh acak dari daftar level
        const enemyTemplate = Phaser.Utils.Array.GetRandom(this.level.enemies);
        const enemyStats = gameData.getEnemyFullData(enemyTemplate.id);

        // Ambil kata dari data json
        const jsonKey = enemyStats.library.jsonKey;
        const wordList = this.cache.json.get(jsonKey);

        const randomWord = Phaser.Utils.Array.GetRandom(wordList);
        const spawnX = this.scale.width + 100;
        const groundY = this.scale.height - 180;
        let spawnY = groundY;

        // Atur posisi Y berdasarkan tipe gerakan (Ground vs Flying)
        if (enemyStats.movementType === "Flying") {
            spawnY = groundY - Phaser.Math.Between(150, 300); // Melayang di langit
        } else {
            spawnY = groundY + Phaser.Math.Between(-5, 15);  // Jalan di tanah
        }

        // Buat objek musuh menggunakan Prefab (Enemy.js)
        const newEnemy = new Enemy(this, spawnX, spawnY, enemyStats);
        newEnemy.targetWord = randomWord.toUpperCase(); // Pastikan Kapital

        this.enemies.add(newEnemy); // Masukkan ke grup agar bisa diupdate bersama
        this.refreshVisuals();
    }

    /**
     * [UPDATE] Fungsi yang berjalan otomatis 60 kali per detik.
     */
    update() {
        if (this.state.isGameOver) return;

        // Gerakkan semua musuh ke arah penyihir
        this.enemies.getChildren().forEach(enemy => {
            // 1. Tentukan batas berhenti tembak (misal di x=600)
            const stopDistance = 600;

            if (enemy.stats.enemyCategory === "FarAttack" && enemy.x <= stopDistance) {
                // Berhenti jalan dan mulai menembak jika belum menembak
                if (!enemy.isAttacking) {
                    this.enemyShoot(enemy);
                }
            } else {
                // Musuh maju jika tipe Direct atau belum sampai batas
                enemy.move();
            }

            // Jika musuh sampai di garis pertahanan (x=260)
            if (enemy.x <= 260) {
                this.takeDamage(enemy);
            }
        });
    }

    /**
     * [ENEMY SHOOT] Fungsi untuk membuat musuh menembakkan kekuatannya.
     */
    enemyShoot(enemy) {
        enemy.isAttacking = true; // Penanda agar tidak menembak ribuan kali sekaligus

        // Ambil kunci aset dari data musuh
        const vfxKey = enemy.stats.attackVFX;
        if (!vfxKey) return;

        // 1. Buat proyektil (Misal menggunakan video/gif yang kamu load)
        // Kita gunakan sprite biasa tapi texture-nya dari vfxKey
        const projectile = this.add.video(enemy.x, enemy.y, vfxKey);

        // 2. Mainkan videonya
        projectile.play(true); // 'true' berarti videonya looping selama terbang
        projectile.setScale(0.5); // Sesuaikan ukuran video agar tidak menutupi layar

        // 3. Tembakkan ke arah penyihir (ke kiri)
        this.tweens.add({
            targets: projectile,
            x: this.wizard.x,
            y: this.wizard.y,
            duration: 800, // Kecepatan tembakan
            onComplete: () => {
                // 4. Efek saat peluru kena penyihir
                if (!this.state.isGameOver) {
                    this.cameras.main.flash(200, 255, 0, 0, 0.3); // Kilatan merah
                    this.reduceMana(enemy.stats.attackPower);    // Kurangi darah

                    // Suara saat terkena tembakan
                    if (this.cache.audio.exists('uncorrect')) {
                        this.sound.play('uncorrect', { volume: 0.3 });
                    }
                }

                projectile.destroy(); // Hapus peluru setelah kena

                // Beri jeda 3 detik sebelum musuh menembak lagi
                this.time.delayedCall(3000, () => {
                    if (enemy.active) enemy.isAttacking = false;
                });
            }
        });
    }

    /**
     * [REFRESH VISUALS] Mengupdate teks hijau/putih pada bar bawah dan di atas musuh.
     */
    refreshVisuals() {
        const word = this.targetEnemy ? this.targetEnemy.targetWord : "";
        this.typingBar.update(word, this.state.currentIndex);

        this.enemies.getChildren().forEach(e => {
            // Hanya musuh target yang mendapatkan progres warna hijau
            const idx = (e === this.targetEnemy) ? this.state.currentIndex : 0;
            e.updateVisuals(e.targetWord, idx);
        });
    }

    /**
     * [UPDATE UI] Mengatur tampilan bar Mana dan angka HUD.
     */
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
        // Menang jika jumlah musuh yang dikalahkan sudah mencapai target level
        const isSuccess = this.state.defeatedCount >= this.level.minTarget;
        this.endGame(isSuccess);
    }

    /**
     * [END GAME] Mengakhiri permainan dan memunculkan pop-up hasil.
     */
    endGame(isSuccess) {
        if (this.state.isGameOver) return;
        this.state.isGameOver = true;

        // Berhentikan semua timer agar tidak spawn musuh lagi
        if (this.spawnTimer) this.spawnTimer.remove();
        if (this.levelTimer) this.levelTimer.remove();

        // Hapus semua musuh yang tersisa di layar
        this.enemies.clear(true, true);

        // Mainkan suara kemenangan/kalah
        if (isSuccess) {
            if (this.cache.audio.exists('sparkle')) {
                this.sound.play('sparkle', { volume: 0.8 });
            }
        } else {
            // Kamu bisa tambah suara kalah di sini jika punya asetnya
        }

        // Munculkan ResultScene (Pop-up Victory/Lost)
        this.scene.launch('ResultScene', {
            isWin: isSuccess,
            score: this.state.score,
            levelIndex: this.currentLevelIndex
        });

        // Pause scene ini agar background masih terlihat diam di belakang pop-up
        this.scene.pause();
    }

    /**
     * [PARTICLE] Menciptakan cahaya kecil setiap kali ngetik benar.
     */
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
}