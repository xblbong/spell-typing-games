import Phaser from 'phaser';
import { gameData } from '../data';

export class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    init(data) {
        this.resultData = data; 
    }

    create() {
        const { width, height } = this.scale;

        // 1. OVERLAY: Membuat latar belakang gelap transparan
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

        // 2. CONTAINER UTAMA: Semua elemen modal ditaruh di sini
        const modal = this.add.container(width / 2, height / 2);

        // 3. BACKGROUND MODAL: Kotak utama dengan sudut melengkung
        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 1); 
        bg.fillRoundedRect(-250, -280, 500, 560, 30); // Kotak lebih tinggi
        modal.add(bg);

        // 4. HEADER: Bagian atas modal (Warna Ungu/Gelap)
        const header = this.add.graphics();
        header.fillStyle(this.resultData.isWin ? 0x7b56ff : 0xff4d6d, 1);
        header.fillRoundedRect(-250, -280, 500, 80, { tl: 30, tr: 30, bl: 0, br: 0 });
        modal.add(header);

        const title = this.add.text(0, -240, 
            this.resultData.isWin ? 'LEVEL COMPLETE!' : 'BATTLE LOST', 
            { fontSize: '28px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }
        ).setOrigin(0.5);
        modal.add(title);

        // 5. MAGE RANK: Judul tambahan biar seperti RPG (Mage Level)
        const rankText = this.add.text(0, -170, 'MAGE RANK: SEEDLING', {
            fontSize: '18px', color: '#4a3b52', fontWeight: 'bold', fontFamily: 'monospace'
        }).setOrigin(0.5);
        modal.add(rankText);

        // 6. STATS GRID: Menampilkan WPM dan Akurasi berdampingan
        this.createStatBlock(modal, -110, -100, 'SPEED', `${this.resultData.wpm}`, 'WPM', 0x75d94d);
        this.createStatBlock(modal, 110, -100, 'ACCURACY', `${this.resultData.accuracy}`, '%', 0x00d2ff);

        // 7. COIN REWARD: Menampilkan koin dengan icon
        const coinBox = this.add.graphics();
        coinBox.fillStyle(0xf8f9fa, 1);
        coinBox.fillRoundedRect(-180, 20, 360, 60, 15);
        modal.add(coinBox);

        const coinLabel = this.add.text(-160, 50, '🪙 Coins Earned:', { fontSize: '18px', color: '#4a3b52' }).setOrigin(0, 0.5);
        const coinVal = this.add.text(160, 50, `+${this.resultData.score}`, { 
            fontSize: '24px', fontWeight: 'bold', color: '#e6b800' 
        }).setOrigin(1, 0.5);
        modal.add([coinLabel, coinVal]);

        // 8. PROGRESS BAR: Meniru referensi gambar kamu (XP bar)
        this.createXPBar(modal, 120);

        // 9. TOMBOL UTAMA
        this.createMainButton(modal, 210);
    }

    /**
     * FUNGSI PEMBANTU: Membuat kotak statistik (WPM/Accuracy)
     */
    createStatBlock(container, x, y, label, value, unit, color) {
        const valText = this.add.text(x, y, value, { 
            fontSize: '48px', fontWeight: 'bold', color: Phaser.Display.Color.IntegerToColor(color).rgba 
        }).setOrigin(0.5);
        
        const unitText = this.add.text(x + (valText.width/2) + 15, y + 10, unit, { 
            fontSize: '14px', color: '#888888', fontWeight: 'bold' 
        }).setOrigin(0, 0.5);

        const lblText = this.add.text(x, y + 40, label, { 
            fontSize: '14px', color: '#4a3b52', fontWeight: 'bold' 
        }).setOrigin(0.5);

        container.add([valText, unitText, lblText]);
    }

    /**
     * FUNGSI PEMBANTU: Membuat Bar Progress XP
     */
    createXPBar(container, y) {
        const barW = 360;
        const bgBar = this.add.graphics();
        bgBar.fillStyle(0xeeeeee, 1);
        bgBar.fillRoundedRect(-barW/2, y, barW, 20, 10);

        const fillBar = this.add.graphics();
        fillBar.fillStyle(0x7b56ff, 1);
        // Persentase random buat gaya (60%)
        fillBar.fillRoundedRect(-barW/2, y, barW * 0.6, 20, 10);
        
        const xpText = this.add.text(0, y + 35, '2,500 XP to next rank', { fontSize: '12px', color: '#888' }).setOrigin(0.5);
        
        container.add([bgBar, fillBar, xpText]);
    }

    /**
     * FUNGSI PEMBANTU: Membuat Tombol Utama (Claim/Retry)
     */
    createMainButton(container, y) {
        const isWin = this.resultData.isWin;
        const btnText = isWin ? 'CLAIM REWARD' : 'TRY AGAIN';
        const btnColor = isWin ? 0x00ffcc : 0xffcc00;

        const btn = this.add.container(0, y);
        const bg = this.add.rectangle(0, 0, 360, 70, btnColor).setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(4, 0xffffff);

        const txt = this.add.text(0, 0, btnText, { 
            fontSize: '22px', fontWeight: 'bold', color: '#ffffff' 
        }).setOrigin(0.5);

        btn.add([bg, txt]);
        container.add(btn);

        // Animasi klik & Logika Pindah
        bg.on('pointerdown', () => {
            this.sound.play('keyboard'); // Pake sound yang ada aja buat feedback
            if (isWin) {
                gameData.getUser().userCoins += this.resultData.score;
                this.scene.stop('GameScene');
                this.scene.start('MenuScene');
            } else {
                this.scene.stop('GameScene');
                this.scene.start('GameScene', { levelIndex: this.resultData.levelIndex });
            }
            this.scene.stop();
        });

        // Hover Effect
        bg.on('pointerover', () => bg.setAlpha(0.8));
        bg.on('pointerout', () => bg.setAlpha(1));
    }
}