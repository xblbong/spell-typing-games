import Phaser from 'phaser';
import { gameData } from '../data';

export class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    init(data) {
        this.resultData = data;
    }

    /**
     * [PRELOAD] Memuat semua aset gambar dekorasi & ikon
     */
    preload() {
        // 1. Gambar Hasil (Trofi jika Menang, Gambar Kalah jika Kalah)
        this.load.image('res_trophy', 'images/ui/trophy.png');
        this.load.image('res_defeat', 'images/ui/defeat_icon.png');

        // 2. Dekorasi Frame Luar & Dalam
        this.load.image('res_corner_outer', 'images/ui/corner_outer.png'); // 4 Sudut Luar (Biru-Cyan)
        this.load.image('res_corner_inner', 'images/ui/corner_inner.png'); // 4 Segitiga Sudut Dalam
        this.load.image('res_diamond', 'images/ui/diamond.png');           // Berlian Atas & Bawah Panel

        // 3. Ikon Statistik
        this.load.image('res_icon_star', 'images/ui/icon_star.png');       // Bintang Rank
        this.load.image('res_icon_lightning', 'images/ui/icon_lightning.png'); // Petir WPM
        this.load.image('res_icon_target', 'images/ui/icon_target.png');   // Target Akurasi
        this.load.image('res_icon_coin', 'images/ui/icon_coin.png');       // Koin
    }

    create() {
        const { width, height } = this.scale;

        // 1. BACKGROUND OVERLAY (Gelap Transparan Pekat)
        this.add.rectangle(0, 0, width, height, 0x070a1a, 0.90).setOrigin(0);

        // 2. CONTAINER UTAMA (Pusat Modal di Tengah Layar)
        const modal = this.add.container(width / 2, height / 2 - 10);

        // 3. FRAME LUAR (Tinggi ditingkatkan dari 530 ke 580 agar ada Padding)
        const frameW = 450;
        const frameH = 580;

        const frame = this.add.graphics();
        // Latar Frame Luar (Navy Space Blue)
        frame.fillStyle(0x131836, 1);
        frame.fillRoundedRect(-frameW / 2, -frameH / 2, frameW, frameH, 16);

        // Garis Tepi Ganda (Putih di luar, Biru Muda di dalam)
        frame.lineStyle(5, 0xd0e3ff, 1);
        frame.strokeRoundedRect(-frameW / 2, -frameH / 2, frameW, frameH, 16);
        frame.lineStyle(3, 0x7a9ee6, 0.9);
        frame.strokeRoundedRect(-frameW / 2 + 5, -frameH / 2 + 5, frameW - 10, frameH - 10, 12);
        modal.add(frame);

        // --- A. DEKORASI 4 SUDUT FRAME LUAR ---
        if (this.textures.exists('res_corner_outer')) {
            const outerCorners = [
                { x: -frameW / 2, y: -frameH / 2, angle: -180, flipX: true, flipY: false }, // Top-Left
                { x: frameW / 2, y: -frameH / 2, angle: 180, flipX: false, flipY: false }, // Top-Right
                { x: -frameW / 2, y: frameH / 2, angle: -180, flipX: true, flipY: true }, // Bottom-Left
                { x: frameW / 2, y: frameH / 2, angle: 180, flipX: false, flipY: true }  // Bottom-Right
            ];

            outerCorners.forEach(pos => {
                const cornerImg = this.add.image(pos.x, pos.y, 'res_corner_outer')
                    .setAngle(pos.angle)
                    .setFlip(pos.flipX, pos.flipY)
                    .setScale(0.85);
                modal.add(cornerImg);
            });
        }

        // --- B. IKON ATAS (💔 / 🏆) - Diturunkan sedikit agar tidak bocor dari border atas ---
        const isWin = this.resultData.isWin;
        const topIconKey = isWin ? 'res_trophy' : 'res_defeat';

        if (this.textures.exists(topIconKey)) {
            // Skala disesuaikan & Y diturunkan ke -220 agar ada padding 40px dari border atas
            const topIcon = this.add.image(0, -220, topIconKey).setScale(0.10);
            modal.add(topIcon);
        }

        // Teks Judul Kemenangan/Kekalahan
        const titleText = this.add.text(0, -145, isWin ? 'VICTORY!' : 'DEFEATED!', {
            fontSize: '36px',
            fontWeight: '900',
            color: '#ffffff',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        modal.add(titleText);

        // 4. INNER PANEL (Diperbesar sedikit tinggi & lebarnya)
        const innerW = 380;
        const innerH = 275;
        const innerY = 25;

        const innerBg = this.add.graphics();
        innerBg.fillStyle(0x15182e, 1);
        innerBg.fillRoundedRect(-innerW / 2, innerY - innerH / 2, innerW, innerH, 12);
        innerBg.lineStyle(2, 0x323c66, 1);
        innerBg.strokeRoundedRect(-innerW / 2, innerY - innerH / 2, innerW, innerH, 12);
        modal.add(innerBg);

        // --- C. DEKORASI PANEL DALAM (2 Diamonds & 4 Corner Triangles) ---
        if (this.textures.exists('res_diamond')) {
            const topDiamond = this.add.image(0, innerY - innerH / 2, 'res_diamond').setScale(0.85);
            const bottomDiamond = this.add.image(0, innerY + innerH / 2, 'res_diamond').setScale(0.85);
            modal.add([topDiamond, bottomDiamond]);
        }

        if (this.textures.exists('res_corner_inner')) {
            const innerCorners = [
                { x: -innerW / 2 + 8, y: innerY - innerH / 2 + 8, angle: 0 },   // Top-Left
                { x: innerW / 2 - 8, y: innerY - innerH / 2 + 8, angle: 90 },  // Top-Right
                { x: -innerW / 2 + 8, y: innerY + innerH / 2 - 8, angle: -90 },// Bottom-Left
                { x: innerW / 2 - 8, y: innerY + innerH / 2 - 8, angle: 180 }  // Bottom-Right
            ];
            innerCorners.forEach(pos => {
                const tri = this.add.image(pos.x, pos.y, 'res_corner_inner')
                    .setAngle(pos.angle)
                    .setScale(0.75);
                modal.add(tri);
            });
        }

        // 5. KONTEN ISI (Rank, Stats, Koin, XP, & Button)
        this.createContent(modal, innerY);
        this.createXPBar(modal, 200);      // Digeser ke Y:200 agar ada jeda dari panel
        this.createMainButton(modal, 290);  // Digeser ke Y:290 pas di bagian bawah frame
    }

    createContent(container, innerY) {
        // --- A. RANK BADGE ---
        const rankY = innerY - 85; // Digeser lebih atas sedikit
        const rankPill = this.add.graphics();
        rankPill.fillStyle(0x191e36, 1);
        rankPill.fillRoundedRect(-110, rankY - 18, 220, 36, 18);
        rankPill.lineStyle(1.5, 0x48547a, 1);
        rankPill.strokeRoundedRect(-110, rankY - 18, 220, 36, 18);
        container.add(rankPill);

        if (this.textures.exists('res_icon_star')) {
            const rankIcon = this.add.image(-80, rankY, 'res_icon_star').setScale(0.08);
            container.add(rankIcon);
        }
        const rankText = this.add.text(-50, rankY, 'Rank: Seedling', {
            fontSize: '15px', fontFamily: 'monospace', color: '#e2e8f0', fontWeight: 'bold'
        }).setOrigin(0, 0.5);
        container.add(rankText);

        // --- B. STATS BOX (Latar Merah Keunguan Gelap & Border Merah) ---
        const statsY = innerY - 10; // Posisi Tengah yang pas
        const boxH = 46;
        const boxW = 310;
        const radius = boxH / 2; // Capsule / Pill Shape (100% Rounded)

        const statsBg = this.add.graphics();
        statsBg.fillStyle(0x29121a, 1);
        statsBg.fillRoundedRect(-boxW / 2, statsY - boxH / 2, boxW, boxH, radius);
        statsBg.lineStyle(2, 0xee2b2b, 1);
        statsBg.strokeRoundedRect(-boxW / 2, statsY - boxH / 2, boxW, boxH, radius);
        statsBg.lineBetween(0, statsY - boxH / 2 + 1, 0, statsY + boxH / 2 - 1);
        container.add(statsBg);

        // Stat Kiri: WPM
        if (this.textures.exists('res_icon_lightning')) {
            const wpmIcon = this.add.image(-120, statsY, 'res_icon_lightning').setScale(0.05);
            container.add(wpmIcon);
        }
        const wpmVal = this.add.text(-90, statsY, `${this.resultData.wpm || 0} WPM`, {
            fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0, 0.5);
        container.add(wpmVal);

        // Stat Kanan: Accuracy
        if (this.textures.exists('res_icon_target')) {
            const accIcon = this.add.image(25, statsY, 'res_icon_target').setScale(0.05);
            container.add(accIcon);
        }
        const accVal = this.add.text(58, statsY, `${this.resultData.accuracy || 0}%`, {
            fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0, 0.5);
        container.add(accVal);

        // --- C. REWARD KOIN ---
        const coinY = innerY + 65; // Digeser lebih bawah sedikit agar seimbang
        const coinPill = this.add.graphics();
        coinPill.fillStyle(0x191e36, 1);
        coinPill.fillRoundedRect(-90, coinY - 20, 180, 40, 20);
        coinPill.lineStyle(2, 0xfacc15, 1);
        coinPill.strokeRoundedRect(-90, coinY - 20, 180, 40, 20);
        container.add(coinPill);

        if (this.textures.exists('res_icon_coin')) {
            const coinIcon = this.add.image(-55, coinY, 'res_icon_coin').setScale(0.05);
            container.add(coinIcon);
        }
        const coinVal = this.add.text(-25, coinY, `+${this.resultData.score || 0}`, {
            fontSize: '22px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0, 0.5);
        container.add(coinVal);
    }

    createXPBar(container, y) {
        const barW = 340;
        const barH = 18;
        const progress = 0.75;
        const currentW = barW * progress;
        const startX = -barW / 2;

        const bgBar = this.add.graphics();
        bgBar.fillStyle(0x000000, 1);
        bgBar.fillRoundedRect(startX - 2, y - 2, barW + 4, barH + 4, (barH + 4) / 2);

        const fillBar = this.add.graphics();

        if (currentW > 0) {
            const cornerRadius = barH / 2;

            fillBar.fillStyle(0x007865, 1);
            fillBar.fillRoundedRect(startX, y, currentW, barH, cornerRadius);

            fillBar.fillStyle(0x00ffb4, 1);
            fillBar.fillRoundedRect(startX, y, currentW, barH * 0.52, {
                tl: cornerRadius,
                tr: cornerRadius,
                bl: 0,
                br: 0
            });

            fillBar.fillStyle(0x00ffb4, 1);
            const lineW = Math.max(1, currentW - cornerRadius);
            fillBar.fillRoundedRect(startX + cornerRadius / 2, y + barH - 2, lineW, 2, 1);
        }

        const xpText = this.add.text(0, y + 26, '1,500 XP to next rank', {
            fontSize: '13px',
            color: '#a0aec0',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        container.add([bgBar, fillBar, xpText]);
    }

    createMainButton(container, y) {
        const isWin = this.resultData.isWin;
        const btnText = isWin ? 'Claim reward' : 'Try Again';

        const btn = this.add.container(0, y);
        const bg = this.add.graphics();

        bg.fillStyle(0x3b59eb, 1);
        bg.fillRoundedRect(-135, -25, 270, 50, 25);

        bg.lineStyle(3, 0xffffff, 1);
        bg.strokeRoundedRect(-135, -25, 270, 50, 25);

        const txt = this.add.text(0, 0, btnText, {
            fontSize: '20px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(0, 0, 270, 50, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        btn.add([bg, txt, hitArea]);
        container.add(btn);

        hitArea.on('pointerdown', () => {
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

        hitArea.on('pointerover', () => btn.setScale(1.04));
        hitArea.on('pointerout', () => btn.setScale(1));
    }
}