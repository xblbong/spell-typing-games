import Phaser from 'phaser';
import { gameData } from '../data';

export class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    init(data) {
        // Menerima data dari GameScene: isWin, score, levelIndex, wpm, accuracy, perfect, errors
        this.resultData = data; 
    }

    create() {
        const { width, height } = this.scale;

        // 1. OVERLAY: Latar belakang gelap transparan
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

        // 2. CONTAINER UTAMA: Wadah modal agar semua elemen bergerak bersama
        const modal = this.add.container(width / 2, height / 2);

        // 3. BACKGROUND MODAL: Kotak putih utama (Tinggi diset 600 agar muat semua statistik)
        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 1); 
        bg.fillRoundedRect(-250, -300, 500, 600, 30); 
        modal.add(bg);

        // 4. HEADER: Bagian atas modal (Warna Ungu jika menang, Merah jika kalah)
        const header = this.add.graphics();
        header.fillStyle(this.resultData.isWin ? 0x7b56ff : 0xff4d6d, 1);
        header.fillRoundedRect(-250, -300, 500, 80, { tl: 30, tr: 30, bl: 0, br: 0 });
        modal.add(header);

        const titleText = this.resultData.isWin ? 'MISSION CLEARED!' : 'BATTLE LOST';
        modal.add(this.add.text(0, -260, titleText, { 
            fontSize: '28px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' 
        }).setOrigin(0.5));

        // 5. PANGGIL KONTEN STATISTIK (Di sinilah fungsi yang kamu tanyakan dipanggil)
        this.createContent(modal);

        // 6. PANGGIL XP BAR (Visual kemajuan rank)
        this.createXPBar(modal, 180);

        // 7. PANGGIL TOMBOL UTAMA (Claim / Retry)
        this.createMainButton(modal, 260);
    }

    /**
     * [CREATE CONTENT] 
     * Inilah tempat fungsi yang kamu tanyakan tadi diletakkan.
     */
    createContent(container) {
        // A. Tampilkan Statistik Grid (WPM & Accuracy) di bagian atas
        this.createStatBlock(container, -110, -140, 'SPEED', `${this.resultData.wpm || 0}`, 'WPM', 0x75d94d);
        this.createStatBlock(container, 110, -140, 'ACCURACY', `${this.resultData.accuracy || 0}`, '%', 0x00d2ff);

        // B. LAPORAN EVALUASI MANTRA (Perfect vs Fumbles)
        const reportStyle = { fontSize: '18px', fontFamily: 'monospace', color: '#4a3b52', fontWeight: 'bold' };
        
        const perfectTxt = this.add.text(0, -30, `✨ Perfect Casts: ${this.resultData.perfect || 0}`, reportStyle).setOrigin(0.5);
        const errorTxt = this.add.text(0, 5, `💥 Mana Fumbles: ${this.resultData.errors || 0}`, reportStyle).setOrigin(0.5);
        
        // C. Koin Reward Box (Bagian Abu-abu)
        const coinBox = this.add.graphics();
        coinBox.fillStyle(0xf8f9fa, 1);
        coinBox.fillRoundedRect(-180, 80, 360, 60, 15);
        
        const coinVal = this.add.text(0, 110, `🪙 Coins Earned: +${this.resultData.score}`, { 
            fontSize: '22px', fontWeight: 'bold', color: '#e6b800' 
        }).setOrigin(0.5);

        // Masukkan elemen-elemen ke dalam kontainer modal
        container.add([coinBox, perfectTxt, errorTxt, coinVal]);
    }

    /**
     * [STAT BLOCK] Membuat angka statistik besar (WPM / Accuracy)
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
     * [XP BAR] Membuat visual progress level
     */
    createXPBar(container, y) {
        const barW = 360;
        const bgBar = this.add.graphics().fillStyle(0xeeeeee, 1).fillRoundedRect(-barW/2, y, barW, 20, 10);
        const fillBar = this.add.graphics().fillStyle(0x7b56ff, 1).fillRoundedRect(-barW/2, y, barW * 0.7, 20, 10);
        const xpText = this.add.text(0, y + 35, 'Keep practicing to unlock Master Rank!', { fontSize: '12px', color: '#888' }).setOrigin(0.5);
        
        container.add([bgBar, fillBar, xpText]);
    }

    /**
     * [MAIN BUTTON] Membuat tombol Claim atau Retry
     */
    createMainButton(container, y) {
        const isWin = this.resultData.isWin;
        const btnText = isWin ? 'CLAIM REWARD' : 'TRY AGAIN';
        const btnColor = isWin ? 0x00ffcc : 0xffcc00;

        const btn = this.add.container(0, y);
        const bg = this.add.rectangle(0, 0, 360, 70, btnColor).setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(4, 0xffffff);
        const txt = this.add.text(0, 0, btnText, { fontSize: '22px', fontWeight: 'bold', color: '#ffffff' }).setOrigin(0.5);

        btn.add([bg, txt]);
        container.add(btn);

        bg.on('pointerdown', () => {
            this.sound.play('keyboard'); 
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

        bg.on('pointerover', () => bg.setAlpha(0.8));
        bg.on('pointerout', () => bg.setAlpha(1));
    }
}