import Phaser from 'phaser';
import { gameData } from '../data';

export class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    /**
     * [PRELOAD] Memuat aset gambar dekorasi & background
     */
    preload() {
        // Dekorasi Sudut Luar (Biru-Cyan)
        this.load.image('res_corner_outer', 'images/ui/corner_outer.png');
    }

    create() {
        const { width, height } = this.scale;

        // 1. LATAR BELAKANG GELAP (Malam / Space)
        this.add.rectangle(0, 0, width, height, 0x0a0e27).setOrigin(0);

        // Hiasan Bintang-bintang Kecil di Latar Belakang
        for (let i = 0; i < 40; i++) {
            this.add.circle(
                Phaser.Math.Between(0, width), 
                Phaser.Math.Between(0, height), 
                Phaser.Math.FloatBetween(0.8, 1.8), 
                0xffffff, 
                Phaser.Math.FloatBetween(0.2, 0.7)
            );
        }

        // 2. JUDUL UTAMA (SPELL TYPING GAME)
        this.add.text(width / 2, height * 0.30, 'SPELL TYPING GAME', {
            fontSize: '44px',
            fontFamily: 'monospace',
            fontWeight: '900',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // 3. MODAL FRAME (Tengah Layar)
        const frameW = 680;
        const frameH = 340;
        const modalY = height * 0.56;

        const modal = this.add.container(width / 2, modalY);

        // Frame Utama (Navy Blue)
        const frame = this.add.graphics();
        frame.fillStyle(0x151b40, 1);
        frame.fillRoundedRect(-frameW / 2, -frameH / 2, frameW, frameH, 16);

        // Garis Tepi Ganda (Putih & Biru Muda)
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

        // 4. TEKS INSTRUKSI (Enter your mage name)
        const labelText = this.add.text(0, -80, 'Enter your mage name', {
            fontSize: '24px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        modal.add(labelText);

        // 5. TEKS ERROR / PERINGATAN
        const errorText = this.add.text(0, 115, '', {
            fontSize: '15px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#ff4d6d'
        }).setOrigin(0.5);
        modal.add(errorText);

        // 6. HAPUS INPUT LAMA & BUAT INPUT HTML BARU
        document.querySelectorAll('.game-input').forEach(el => el.remove());

        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = '';
        inputElement.className = 'game-input';
        inputElement.maxLength = 7;

        Object.assign(inputElement.style, {
            position: 'fixed',
            boxSizing: 'border-box',
            transform: 'translate(-50%, -50%)', // Mencegah input bergeser dari tengah
            borderRadius: '30px',
            background: '#ffffff',
            border: '2px solid #a0c4ff',
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.3), inset 0 3px 6px rgba(0, 0, 0, 0.2)',
            color: '#121736',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textAlign: 'center',
            outline: 'none',
            padding: '0 20px',
            zIndex: '9999',
        });

        // Tempel langsung ke document.body agar tidak terpengaruh margin parent
        document.body.appendChild(inputElement);

        // FUNGSI UNTUK MENYESUAIKAN POSISI INPUT SECARA PRESISI DI TENGAH CANVAS
        const updateInputPosition = () => {
            const canvas = this.sys.game.canvas;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const scaleX = rect.width / width;
            const scaleY = rect.height / height;

            // Titik Tengah Horizontal & Vertikal Modal
            const centerX = rect.left + (rect.width / 2);
            const targetY = rect.top + (modalY - 5) * scaleY;

            inputElement.style.left = `${centerX}px`;
            inputElement.style.top = `${targetY}px`;
            inputElement.style.width = `${360 * scaleX}px`;
            inputElement.style.height = `${48 * scaleY}px`;
            inputElement.style.fontSize = `${19 * scaleY}px`;
        };

        updateInputPosition();
        window.addEventListener('resize', updateInputPosition);

        // Focus langsung ke input
        setTimeout(() => inputElement.focus(), 100);

        // 7. TOMBOL "BEGIN JOURNEY" (Kapsul Biru)
        const btnY = 80;
        const btnContainer = this.add.container(0, btnY);
        modal.add(btnContainer);

        const btnBg = this.add.graphics();
        const drawBtn = (color) => {
            btnBg.clear();
            btnBg.fillStyle(color, 1);
            btnBg.fillRoundedRect(-110, -22, 220, 44, 22);
            btnBg.lineStyle(2.5, 0xffffff, 1);
            btnBg.strokeRoundedRect(-110, -22, 220, 44, 22);
        };
        drawBtn(0x3b59eb);

        const btnTxt = this.add.text(0, 0, 'Begin journey', {
            fontSize: '17px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#ffffff',
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(0, 0, 220, 44, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        btnContainer.add([btnBg, btnTxt, hitArea]);

        // 8. LOGIKA VALIDASI & PERPINDAHAN SCENE
        const proceedToMenu = () => {
            const name = inputElement.value.trim();

            if (name.length < 3) {
                errorText.setText('NAME TOO SHORT! (MIN 3 CHARS)');
                this.cameras.main.shake(100, 0.002);
                return;
            }

            const user = gameData.getUser();
            user.userName = name;

            window.removeEventListener('resize', updateInputPosition);
            inputElement.remove();

            this.scene.start('MenuScene');
        };

        hitArea.on('pointerdown', proceedToMenu);

        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') proceedToMenu();
        });

        // Real-time Visual Feedback
        inputElement.addEventListener('input', () => {
            if (inputElement.value.length >= 3 && inputElement.value.length <= 7) {
                drawBtn(0x3b59eb);
                errorText.setText('');
            } else {
                drawBtn(0x4a5568);
            }
        });

        hitArea.on('pointerover', () => {
            if (inputElement.value.length >= 3) drawBtn(0x5a75ff);
        });

        hitArea.on('pointerout', () => {
            if (inputElement.value.length >= 3) drawBtn(0x3b59eb);
            else drawBtn(0x4a5568);
        });

        // CLEANUP: Hapus input & listener saat scene mati
        this.events.on('shutdown', () => {
            window.removeEventListener('resize', updateInputPosition);
            if (inputElement.parentNode) inputElement.remove();
        });
    }
}