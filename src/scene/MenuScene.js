import Phaser from 'phaser';
import { levelLibrary } from '../data/levels';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    /**
     * [PRELOAD] Memuat aset dekorasi UI & Gambar Latar Belakang Level untuk Preview
     */
    preload() {
        // 1. Aset Dekorasi UI Frame & Ikon
        this.load.image('res_corner_outer', 'images/ui/corner_outer.png');
        this.load.image('res_corner_inner', 'images/ui/corner_inner.png');
        this.load.image('res_diamond', 'images/ui/diamond.png');
        this.load.image('res_icon_skull', 'images/ui/skull_bar.png');

        //background
        this.load.image('res_background', 'images/background/Curiosa_alternatif.png');

        // 2. Memuat Gambar Background Level dari Library (untuk Preview di Kartu)
        levelLibrary.forEach(level => {
            if (level.bgKey && level.bgPath) {
                this.load.image(level.bgKey, level.bgPath);
            }
            if (level.bgKey && level.bgCover) {
                this.load.image(`${level.bgKey}_cover`, level.bgCover);
            }
        });
    }

    create() {
        const { width, height } = this.scale;

        // 1. LATAR BELAKANG GELAP (Space / Night Theme)
        this.add.image(width / 2, height / 2, 'res_background').setDisplaySize(width, height);

        // Hiasan Bintang-Bintang Kecil
        for (let i = 0; i < 50; i++) {
            this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.FloatBetween(0.8, 1.8),
                0xffffff,
                Phaser.Math.FloatBetween(0.2, 0.7)
            );
        }

        // 2. JUDUL UTAMA ("Choose your mission")
        this.add.text(width / 2, height * 0.15, 'Choose your mission', {
            fontSize: '28px',
            fontFamily: '"Press Start 2P", monospace',
            fontWeight: '900',
            color: '#ffffff',
        }).setOrigin(0.5);

        // 3. PENGATURAN TATA LETAK 3 KARTU LEVEL (Horisontal Side-by-Side)
        const cardW = 300;
        const cardH = 450;
        const cardY = height * 0.55;
        const spacing = 380; // Jarak antar kartu

        // Menghitung posisi X awal agar 3 kartu berada pas di tengah layar
        const totalWidth = (levelLibrary.length - 1) * spacing;
        const startX = width / 2 - totalWidth / 2;

        // Loop Pembuatan Kartu Level secara Dinamis
        levelLibrary.forEach((level, index) => {
            const cardX = startX + (index * spacing);
            this.createLevelCard(cardX, cardY, cardW, cardH, level, index);
        });
    }

    /**
     * Fungsi Pembuat Kartu Level
     */
    createLevelCard(x, y, width, height, level, index) {
        const cardContainer = this.add.container(x, y);

        // --- A. FRAME UTAMA KARTU (Navy Space Blue) ---
        const frame = this.add.graphics();
        frame.fillStyle(0x131836, 0.5);
        frame.fillRoundedRect(-width / 2, -height / 2, width, height, 16);

        // Garis Tepi Ganda
        frame.lineStyle(5, 0xd0e3ff, 1);
        frame.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
        frame.lineStyle(3, 0x7a9ee6, 0.9);
        frame.strokeRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, 12);
        cardContainer.add(frame);

        // --- B. DEKORASI 4 SUDUT FRAME LUAR ---
        if (this.textures.exists('res_corner_outer')) {
            const outerCorners = [
                { x: -width / 2, y: -height / 2, angle: -180, flipX: true, flipY: false }, // Top-Left
                { x: width / 2, y: -height / 2, angle: 180, flipX: false, flipY: false }, // Top-Right
                { x: -width / 2, y: height / 2, angle: -180, flipX: true, flipY: true }, // Bottom-Left
                { x: width / 2, y: height / 2, angle: 180, flipX: false, flipY: true }  // Bottom-Right
            ];

            outerCorners.forEach(pos => {
                const cornerImg = this.add.image(pos.x, pos.y, 'res_corner_outer')
                    .setAngle(pos.angle)
                    .setFlip(pos.flipX, pos.flipY)
                    .setScale(0.35);
                cardContainer.add(cornerImg);
            });
        }

        // --- C. HEADER TEKS KARTU (Nama Level & Difficulty) ---
        const titleY = -height / 2 + 54;
        const diffY = titleY + 32;

        // Nama Level (Misal: Mystic Forest)
        const nameText = this.add.text(0, titleY, level.levelName || `Level ${index + 1}`, {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Warna Teks Kesulitan (Easy = Hijau, Normal = Kuning, Hard = Merah)
        const diffColor = this.getDifficultyColor(level.levelCategory);
        const categoryText = this.add.text(0, diffY, level.levelCategory || 'Normal', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fontWeight: 'bold',
            color: diffColor
        }).setOrigin(0.5);

        cardContainer.add([nameText, categoryText]);

        // --- D. KOTAK PREVIEW GAMBAR LEVEL ---
        const prevW = 220;
        const prevH = 180;
        const prevY = 2;

        // Background tempat preview gambar
        const prevBg = this.add.graphics();
        prevBg.fillStyle(0x1a2147, 1);
        prevBg.fillRoundedRect(-prevW / 2, prevY - prevH / 2, prevW, prevH, 10);
        cardContainer.add(prevBg);

        const coverKey = `${level.bgKey}_cover`;
        const textureToUse = this.textures.exists(coverKey) ? coverKey : level.bgKey;
        // Menampilkan Gambar Preview Latar Belakang Level (jika ada)
        if (this.textures.exists(textureToUse)) {
            const previewImg = this.add.image(0, prevY, textureToUse);
            previewImg.setDisplaySize(prevW - 10, prevH - 10);

            // Membuat Topeng Masking Rounded agar gambar pas di dalam kotak
            const maskGraphics = this.make.graphics();
            maskGraphics.fillStyle(0xffffff);
            maskGraphics.fillRoundedRect(x - prevW / 2 + 5, y + prevY - prevH / 2 + 5, prevW - 10, prevH - 10, 8);
            previewImg.setMask(maskGraphics.createGeometryMask());

            cardContainer.add(previewImg);
        }

        // Border Kotak Preview
        const prevBorder = this.add.graphics();
        prevBorder.lineStyle(2, 0x3a4885, 1);
        prevBorder.strokeRoundedRect(-prevW / 2, prevY - prevH / 2, prevW, prevH, 10);
        cardContainer.add(prevBorder);

        // Ornamen Berlian & Sudut Dalam di Kotak Preview
        if (this.textures.exists('res_diamond')) {
            const topDiamond = this.add.image(0, prevY - prevH / 2, 'res_diamond').setScale(0.8);
            const bottomDiamond = this.add.image(0, prevY + prevH / 2, 'res_diamond').setScale(0.8);
            cardContainer.add([topDiamond, bottomDiamond]);
        }

        if (this.textures.exists('res_corner_inner')) {
            const innerCorners = [
                { x: -prevW / 2 + 6, y: prevY - prevH / 2 + 6, angle: 0 },
                { x: prevW / 2 - 6, y: prevY - prevH / 2 + 6, angle: 90 },
                { x: -prevW / 2 + 6, y: prevY + prevH / 2 - 6, angle: -90 },
                { x: prevW / 2 - 6, y: prevY + prevH / 2 - 6, angle: 180 }
            ];
            innerCorners.forEach(pos => {
                const tri = this.add.image(pos.x, pos.y, 'res_corner_inner')
                    .setAngle(pos.angle)
                    .setScale(0.7);
                cardContainer.add(tri);
            });
        }

        // --- E. FOOTER KARTU (Target Tengkorak & Tombol "Enter") ---
        const footerY = height / 2 - 70;

        // 1. Ikon Tengkorak & Teks Target (Sebelah Kiri)
        const skullX = -width / 2 + 80;
        if (this.textures.exists('res_icon_skull')) {
            const skullIcon = this.add.image(skullX, footerY, 'res_icon_skull').setScale(0.50);
            cardContainer.add(skullIcon);
        }

        const targetText = this.add.text(skullX + 2, footerY, `0/${level.minTarget || 5}`, {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        cardContainer.add(targetText);

        // 2. Tombol Biru "Enter" (Sebelah Kanan)
        const btnX = width / 2 - 80;
        const btnContainer = this.add.container(btnX, footerY);

        const btnBg = this.add.graphics();
        const drawBtn = (color) => {
            btnBg.clear();
            btnBg.fillStyle(color, 1);
            btnBg.fillRoundedRect(-55, -20, 110, 40, 20);
            btnBg.lineStyle(2, 0xffffff, 1);
            btnBg.strokeRoundedRect(-55, -20, 110, 40, 20);
        };
        drawBtn(0x3b59eb);

        const btnTxt = this.add.text(0, 0, 'Enter', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Hit Area untuk Sensor Klik Tombol Enter
        const hitArea = this.add.rectangle(0, 0, 110, 40, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        btnContainer.add([btnBg, btnTxt, hitArea]);
        cardContainer.add(btnContainer);

        // --- F. LOGIKA KLIK & HOVER EFEEK ---
        const startLevel = () => {
            this.scene.start('GameScene', { levelIndex: index });
        };

        // Klik Tombol Enter / Seluruh Kartu
        hitArea.on('pointerdown', startLevel);

        // Hover Effect Tombol Enter
        hitArea.on('pointerover', () => {
            drawBtn(0x5a75ff);
            cardContainer.setScale(1.03);
        });

        hitArea.on('pointerout', () => {
            drawBtn(0x3b59eb);
            cardContainer.setScale(1);
        });
    }

    /**
     * Helper Warna berdasarkan Tingkat Kesulitan
     */
    getDifficultyColor(category) {
        const cat = (category || '').toLowerCase();
        if (cat.includes('easy')) return '#00ff88';   // Hijau
        if (cat.includes('normal') || cat.includes('medium')) return '#ffcc00'; // Kuning
        if (cat.includes('hard')) return '#ff3333';     // Merah
        return '#00e5ff'; // Cyan
    }
}