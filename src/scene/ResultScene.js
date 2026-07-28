import Phaser from 'phaser';
import { gameData } from '../data';

export class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    init(data) {
        this.resultData = data; // Menerima { isWin: true/false, score: 100, levelIndex: 0 }
    }

    create() {
        const { width, height } = this.scale;

        // 1. Overlay Gelap (Membuat game di belakang jadi redup)
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        // 2. Kotak Modal (Background Pop-up)
        const modalW = 400;
        const modalH = 450;
        const modalBase = this.add.container(width / 2, height / 2);
        
        const bg = this.add.graphics();
        bg.fillStyle(0xfff5e1, 1); // Warna krem cerah seperti referensi
        bg.lineStyle(6, 0x7b56ff, 1); // Border ungu
        bg.fillRoundedRect(-modalW/2, -modalH/2, modalW, modalH, 20);
        bg.strokeRoundedRect(-modalW/2, -modalH/2, modalW, modalH, 20);
        
        // Header Modal
        const header = this.add.graphics();
        header.fillStyle(0x4a3b52, 1);
        header.fillRoundedRect(-modalW/2, -modalH/2, modalW, 60, { tl: 20, tr: 20, bl: 0, br: 0 });

        const titleText = this.add.text(0, -modalH/2 + 30, 
            this.resultData.isWin ? 'VICTORY!' : 'BATTLE LOST', 
            { fontSize: '28px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }
        ).setOrigin(0.5);

        modalBase.add([bg, header, titleText]);

        // 3. Konten Tengah (Icon & Pesan)
        this.createContent(modalBase);

        // 4. Tombol Aksi
        this.createButton(modalBase, width, height);
    }

    createContent(container) {
        const isWin = this.resultData.isWin;
        
        // Icon (Ganti dengan image jika sudah ada)
        const iconColor = isWin ? 0xffcc00 : 0xff4d6d;
        const icon = this.add.circle(0, -40, 50, iconColor);
        const iconText = this.add.text(0, -40, isWin ? '🏆' : '💔', { fontSize: '50px' }).setOrigin(0.5);

        const message = isWin ? 'You cleared the level!' : 'Try again, Mage!';
        const msgText = this.add.text(0, 40, message, { 
            fontSize: '20px', color: '#4a3b52', fontFamily: 'monospace', align: 'center' 
        }).setOrigin(0.5);

        // Tampilkan Point jika Menang
        if (isWin) {
            const coinInfo = this.add.text(0, 90, `Coins Earned: +${this.resultData.score}`, {
                fontSize: '24px', fontWeight: 'bold', color: '#e6b800', fontFamily: 'monospace'
            }).setOrigin(0.5);
            container.add(coinInfo);
        }

        container.add([icon, iconText, msgText]);
    }

    createButton(container, screenW, screenH) {
        const isWin = this.resultData.isWin;
        const btnColor = isWin ? 0x00ffcc : 0x75d94d; // Hijau claim / Hijau retry
        const btnText = isWin ? 'CLAIM REWARD' : 'RETRY';

        const btn = this.add.container(0, 160);
        const btnBg = this.add.rectangle(0, 0, 250, 60, btnColor).setInteractive({ useHandCursor: true });
        btnBg.setStrokeStyle(4, 0xffffff);
        
        const txt = this.add.text(0, 0, btnText, { 
            fontSize: '22px', fontWeight: 'bold', color: '#ffffff' 
        }).setOrigin(0.5);

        btn.add([btnBg, txt]);
        container.add(btn);

        // Logika Klik
        btnBg.on('pointerdown', () => {
            if (isWin) {
                // Klaim koin dan balik ke menu
                gameData.getUser().userCoins += this.resultData.score;
                this.scene.stop('GameScene'); // Matikan Game
                this.scene.start('MenuScene'); // Balik Menu
            } else {
                // Retry: Matikan Game lalu nyalakan lagi level yang sama
                this.scene.stop('GameScene');
                this.scene.start('GameScene', { levelIndex: this.resultData.levelIndex });
            }
            this.scene.stop(); // Matikan diri sendiri (ResultScene)
        });

        // Animasi Pulse Tombol (UX)
        this.tweens.add({
            targets: btn,
            scale: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
}