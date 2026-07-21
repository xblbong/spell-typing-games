import Phaser from 'phaser'

// Warna sesuai Brief
const COLORS = {
    bg: 0x241631,        // Ungu Gelap
    ground: 0x150d1d,    // Tanah (lebih gelap)
    mantra: 0x00ffcc,    // Hijau-Cyan
    enemy: 0xff4d6d,     // Merah-Pink
    wizard: 0x7b56ff,    // Ungu Penyihir
    gold: 0xffcc00       // Emas (Skor)
};

const WORDS = ['INFERNO', 'FLAME', 'STORM', 'LIGHTNING'];

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {
        this.currentIndex = 0;
        this.score = 0;
        this.targetWord = Phaser.Utils.Array.GetRandom(WORDS);
    }

    create() {
        const { width, height } = this.scale;

        // 1. BACKGROUND (Langit Ungu)
        this.add.rectangle(0, 0, width, height, COLORS.bg).setOrigin(0);

        // 2. BULAN (Lingkaran Putih/Emas pucat)
        this.add.circle(width - 100, 100, 40, 0xffeecc).setAlpha(0.8);

        // 3. TANAH (Rectangle di bawah)
        this.add.rectangle(0, height - 100, width, 100, COLORS.ground).setOrigin(0);

        // 4. PENYIHIR (Placeholder Kotak Ungu di Kiri)
        // Kita simpan di variabel karena nanti akan ada animasi "merapal"
        this.wizard = this.add.rectangle(150, height - 150, 60, 100, COLORS.wizard);

        // 5. MUSUH (Placeholder Kotak Merah dari Kanan)
        this.enemy = this.add.rectangle(width + 50, height - 150, 70, 70, COLORS.enemy);

        // 6. UI: TYPING BAR (Kotak di bawah untuk teks yang diketik)
        const barBg = this.add.rectangle(width / 2, height - 50, 400, 60, 0x000000, 0.5);
        barBg.setStrokeStyle(2, COLORS.wizard);

        // 7. TEKS MANTRA (Di atas Musuh - Sesuai Brief)
        this.mantraBg = this.add.text(0, 0, '', {
            fontSize: '32px',
            fontFamily: 'monospace', // Pakai monospace dulu agar lebar tiap huruf sama persis
            color: '#ffffff',
            alpha: 0.3
        }).setOrigin(0, 0.5); // Origin X adalah 0 (Kiri)

        this.mantraFg = this.add.text(0, 0, '', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#00ffcc', // Hijau-Cyan sesuai brief
        }).setOrigin(0, 0.5);

        this.cursor = this.add.rectangle(0, 0, 2, 35, 0x00ffff).setOrigin(0, 0.5);


        // 8. SKOR (Pojok Kanan Atas)
        this.scoreText = this.add.text(width - 20, 20, 'SCORE 0', {
            fontSize: '24px',
            color: '#ffcc00',
            fontFamily: 'monospace'
        }).setOrigin(1, 0);

        // Input Keyboard
        this.input.keyboard.on('keydown', (event) => this.handleInput(event));

        this.drawWord();
    }

    update() {
       if (this.enemy.x > 250) {
            this.enemy.x -= 1;
            
            // Update posisi teks mengikuti musuh
            // Karena Origin X kita 0, kita harus geser koordinat X-nya sedikit ke kiri 
            // agar teks terlihat berada di tengah-tengah atas kepala musuh.
            let textX = this.enemy.x - 50; 
            let textY = this.enemy.y - 80;

            this.mantraBg.setPosition(textX, textY);
            this.mantraFg.setPosition(textX, textY);
            
            // Update posisi kursor agar mengikuti huruf terakhir yang diketik
            let offset = this.currentIndex * 19.2; // 19.2 adalah perkiraan lebar 1 huruf font monospace 32px
            this.cursor.setPosition(textX + offset, textY);
        }
    }

    drawWord() {
           // Set teks putih sebagai dasar
        this.mantraBg.setText(this.targetWord);
        
        // Set teks hijau untuk yang sudah benar
        let typedPart = this.targetWord.substring(0, this.currentIndex);
        this.mantraFg.setText(typedPart);
    }

    handleInput(event) {
        const key = event.key.toUpperCase();
        if (key.length > 1) return;

        const letterNeeded = this.targetWord[this.currentIndex];

        if (key === letterNeeded) {
            this.currentIndex++;
            this.drawWord();

            if (this.currentIndex === this.targetWord.length) {
                this.defeatEnemy();
            }
        } else {
            this.cameras.main.shake(100, 0.005);
        }
    }

    defeatEnemy() {
        // Efek saat musuh kalah
        this.score += 100;
        this.scoreText.setText('SCORE ' + this.score);

        // Respawn Musuh
        this.enemy.x = this.scale.width + 50;
        this.currentIndex = 0;
        this.targetWord = Phaser.Utils.Array.GetRandom(WORDS);
        this.drawWord();
    }

    handleDamage() {
        // Logika jika musuh menyentuh penyihir
        this.cameras.main.flash(500, 255, 0, 0);
        this.enemy.x = this.scale.width + 50; // Reset musuh
        this.currentIndex = 0;
        this.drawWord();
    }
}