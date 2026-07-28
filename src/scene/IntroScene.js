import Phaser from 'phaser';
import { gameData } from '../data';

export class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    create() {
        const { width, height } = this.scale;

        // 1. Tampilan Background & Judul
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);
        this.add.text(width / 2, height * 0.25, 'SPELL TYPING', {
            fontSize: '60px', fontFamily: 'monospace', fontWeight: 'bold', color: '#e6b800'
        }).setOrigin(0.5);

        // 2. Instruksi
        this.add.text(width / 2, height * 0.4, 'ENTER YOUR MAGE NAME:', {
            fontSize: '20px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5);

        // 3. Hapus input lama (kalau ada sisa dari HMR / StrictMode)
        document.querySelectorAll('.game-input').forEach(el => el.remove());

        // 4. Membuat Input HTML
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = 'Type name...';
        inputElement.className = 'game-input';
        const gameContainer = document.getElementById('game-container');
        const parentEl = gameContainer || document.body;
        parentEl.appendChild(inputElement);

        // Fokuskan otomatis ke input
        inputElement.focus();

        // 4. Tombol Start
        const startBtn = this.add.container(width / 2, height * 0.65);
        const bg = this.add.rectangle(0, 0, 200, 50, 0x7b56ff).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, 'BEGIN JOURNEY', { fontSize: '20px', fontWeight: 'bold' }).setOrigin(0.5);
        startBtn.add([bg, txt]);

        const proceedToMenu = () => {
            const name = inputElement.value.trim() || "Anonymous Mage";
            
            // Simpan ke Data Global
            const user = gameData.getUser();
            user.userName = name;

            // Hapus input dari layar
            inputElement.remove();

            // Pindah ke Menu Level
            this.scene.start('MenuScene');
        };

        // LOGIKA PINDAH SCENE
        bg.on('pointerdown', proceedToMenu);

        // Enter key juga bisa submit
        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') proceedToMenu();
        });

        // Hover Effect (UX)
        bg.on('pointerover', () => bg.setFillStyle(0x9d81ff));
        bg.on('pointerout', () => bg.setFillStyle(0x7b56ff));

        // Cleanup: pastikan input ilang kalo scene di-stop tanpa klik tombol
        this.events.on('shutdown', () => {
            if (inputElement.parentNode) inputElement.remove();
        });
    }
}