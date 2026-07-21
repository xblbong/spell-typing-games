import Phaser from 'phaser'

const COLORS = {
    bg: 0x1a1a2e,        // Ungu gelap (langit)
    ground: 0x150d1d,    // Tanah gelap
    uiBox: 0x000000,     // Hitam untuk container
    mana: 0x00d2ff,      // Biru muda (mana)
    mantraGreen: 0x00ffcc, // Hijau-cyan (huruf benar)
    textWhite: 0xffffff, // Putih (huruf sisa)
    enemy: 0xff4d6d,     // Merah-pink (musuh)
    wizard: 0x7b56ff,    // Ungu (penyihir)
    gold: 0xffcc00,      // Emas (skor)
    cursor: 0x00ffff     // Biru terang (kursor)
};

const WORDS = ['INFERNO', 'FLAME', 'STORM', 'LIGHTNING', 'METEOR', 'ARCANE'];

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {
        this.currentIndex = 0;
        this.score = 0;
        this.mana = 100;
        this.targetWord = Phaser.Utils.Array.GetRandom(WORDS);
    }

    create() {
        const { width, height } = this.scale;

        this.createBackground(width, height);
        this.createUI(width, height);
        this.createCharacters(width, height);

        // Input Listener
        this.input.keyboard.on('keydown', (event) => this.handleInput(event));
        
        // Jalankan update visual pertama kali
        this.updateTypingVisuals();
    }

    createBackground(width, height) {
        // Langit
        this.add.rectangle(0, 0, width, height, COLORS.bg).setOrigin(0);
        
        // Bintang-bintang kecil (Sesuai lingkaran merahmu)
        for (let i = 0; i < 25; i++) {
            let x = Phaser.Math.Between(0, width);
            let y = Phaser.Math.Between(0, height * 0.6);
            let size = Phaser.Math.FloatBetween(0.5, 1.8);
            this.add.circle(x, y, size, 0xffffff, 0.4);
        }

        // Bulan
        this.add.circle(width - 120, 100, 45, 0xffeecc, 0.9);

        // Tanah
        this.add.rectangle(0, height - 120, width, 120, COLORS.ground).setOrigin(0);
    }

    createUI(width, height) {
        // 1. MANA BAR (Kiri Atas)
        const manaBg = this.add.graphics();
        manaBg.fillStyle(0x000000, 0.5);
        manaBg.fillRoundedRect(20, 25, 200, 30, 8);
        
        this.manaFill = this.add.graphics();
        this.updateManaBar(); 

        this.add.text(230, 32, 'MANA', { 
            fontSize: '14px', color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' 
        });

        // 2. SCORE BAR (Kanan Atas)
        const scoreBg = this.add.graphics();
        scoreBg.fillStyle(0x000000, 0.5);
        scoreBg.fillRoundedRect(width - 220, 25, 200, 30, 8);
        
        this.scoreText = this.add.text(width - 35, 32, `SCORE ${this.score}`, {
            fontSize: '16px', color: '#ffcc00', fontFamily: 'monospace', fontWeight: 'bold'
        }).setOrigin(1, 0);

        // 3. BOTTOM TYPING BAR (Bar bawah yang besar)
        const barW = 500;
        const barH = 60;
        const barX = width / 2 - barW / 2;
        const barY = height - 85;

        this.add.graphics()
            .fillStyle(0x000000, 0.7)
            .lineStyle(2, COLORS.wizard, 0.8)
            .fillRoundedRect(barX, barY, barW, barH, 12)
            .strokeRoundedRect(barX, barY, barW, barH, 12);

        // TEKS BAR BAWAH (Kunci Presisi: Origin 0)
        const styleBottom = { fontSize: '36px', fontFamily: 'monospace', fontWeight: 'bold' };
        
        this.bottomTextBg = this.add.text(0, height - 55, '', styleBottom)
            .setOrigin(0, 0.5).setColor('#ffffff').setAlpha(0.15);
        
        this.bottomTextFg = this.add.text(0, height - 55, '', styleBottom)
            .setOrigin(0, 0.5).setColor('#00ffcc');

        this.cursor = this.add.rectangle(0, height - 55, 3, 38, COLORS.cursor).setOrigin(0, 0.5);
    }

    createCharacters(width, height) {
        // Penyihir & Musuh (Placeholder Kotak)
        this.wizard = this.add.rectangle(150, height - 180, 65, 105, COLORS.wizard).setOrigin(0.5);
        this.enemy = this.add.rectangle(width + 100, height - 180, 80, 80, COLORS.enemy).setOrigin(0.5);

        // TEKS DI ATAS MUSUH (Origin 0 untuk presisi tumpukan)
        const styleEnemy = { fontSize: '24px', fontFamily: 'monospace', fontWeight: 'bold' };
        
        this.enemyTextBg = this.add.text(0, 0, '', styleEnemy)
            .setOrigin(0, 0.5).setColor('#ffffff').setAlpha(0.3);
        
        this.enemyTextFg = this.add.text(0, 0, '', styleEnemy)
            .setOrigin(0, 0.5).setColor('#00ffcc');
    }

    update() {
        // Gerakan Musuh ke kiri
        if (this.enemy.x > 260) {
            this.enemy.x -= 1.1;
            this.syncTypingToEnemy();
        } else {
            this.takeDamage();
        }
    }

    handleInput(event) {
        const key = event.key.toUpperCase();
        if (key.length > 1) return; // Abaikan tombol fungsi (Shift, Enter, dll)

        if (key === this.targetWord[this.currentIndex]) {
            this.currentIndex++;
            this.updateTypingVisuals();

            if (this.currentIndex === this.targetWord.length) {
                this.defeatEnemy();
            }
        } else {
            // Salah ketik: Getar & kurangi mana sedikit
            this.mana = Math.max(0, this.mana - 1);
            this.updateManaBar();
            this.cameras.main.shake(100, 0.004);
        }
    }

    updateTypingVisuals() {
        const fullWord = this.targetWord;
        const typed = fullWord.substring(0, this.currentIndex);

        // 1. Update Isi Teks
        this.bottomTextBg.setText(fullWord);
        this.bottomTextFg.setText(typed);
        this.enemyTextBg.setText(fullWord);
        this.enemyTextFg.setText(typed);

        // 2. Hitung Posisi Center Bar Bawah
        // Monospace 36px punya lebar karakter sekitar 21.6px
        const charW = 21.6; 
        const totalW = fullWord.length * charW;
        const startX = (this.scale.width / 2) - (totalW / 2);

        this.bottomTextBg.x = startX;
        this.bottomTextFg.x = startX;
        this.cursor.x = startX + (this.currentIndex * charW);

        // Sync posisi teks di atas musuh
        this.syncTypingToEnemy();
    }

    syncTypingToEnemy() {
        const charW = 14.4; // Monospace 24px lebar karakternya ~14.4px
        const totalW = this.targetWord.length * charW;
        const startX = this.enemy.x - (totalW / 2);
        const yPos = this.enemy.y - 85;

        this.enemyTextBg.setPosition(startX, yPos);
        this.enemyTextFg.setPosition(startX, yPos);
    }

    updateManaBar() {
        this.manaFill.clear();
        this.manaFill.fillStyle(COLORS.mana, 1);
        // Bar Mana rounded (200px lebar total)
        this.manaFill.fillRoundedRect(20, 25, (this.mana / 100) * 200, 30, 8);
    }

    defeatEnemy() {
        this.score += 100;
        this.scoreText.setText(`SCORE ${this.score}`);
        
        // Partikel sederhana saat menang (opsional)
        this.cameras.main.flash(100, 0, 255, 200, 0.2);
        
        this.resetRound();
    }

    takeDamage() {
        this.mana = Math.max(0, this.mana - 20);
        this.updateManaBar();
        this.cameras.main.flash(200, 200, 0, 0, 0.5);
        
        if (this.mana <= 0) {
            // Tambahkan logika Game Over di sini nanti
            this.score = 0;
            this.mana = 100;
        }
        
        this.resetRound();
    }

    resetRound() {
        this.enemy.x = this.scale.width + 100;
        this.targetWord = Phaser.Utils.Array.GetRandom(WORDS);
        this.currentIndex = 0;
        this.updateTypingVisuals();
    }
}