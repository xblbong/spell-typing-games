import Phaser from 'phaser';
import { gameData } from '../data';

export class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    create() {
        const { width, height } = this.scale;

        // 1. Tampilan Latar Belakang & Judul (Warna emas sesuai tema sihir)
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);
        this.add.text(width / 2, height * 0.25, 'SPELL TYPING', {
            fontSize: '60px', fontFamily: 'monospace', fontWeight: 'bold', color: '#e6b800'
        }).setOrigin(0.5);

        // 2. Instruksi Input
        this.add.text(width / 2, height * 0.4, 'ENTER YOUR MAGE NAME (3-7 CHARS):', {
            fontSize: '18px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5);

        // 3. Teks Peringatan/Error (Awalnya tidak terlihat/kosong)
        const errorText = this.add.text(width / 2, height * 0.52, '', {
            fontSize: '16px', fontFamily: 'monospace', color: '#ff4d6d'
        }).setOrigin(0.5);

        // 4. Hapus input lama jika ada (Penting untuk kestabilan refresh/HMR)
        document.querySelectorAll('.game-input').forEach(el => el.remove());

        // 5. Membuat Elemen Input HTML secara dinamis
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = 'Name...';
        inputElement.className = 'game-input';
        
        // --- KUNCI: ATRIBUT MAX LENGHT ---
        // Secara otomatis mencegah user mengetik lebih dari 7 karakter di browser
        inputElement.maxLength = 7; 

        const gameContainer = document.getElementById('game-container');
        const parentEl = gameContainer || document.body;
        parentEl.appendChild(inputElement);

        inputElement.focus();

        // 6. Membuat Tombol Start
        const startBtn = this.add.container(width / 2, height * 0.65);
        const bg = this.add.rectangle(0, 0, 220, 55, 0x7b56ff).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, 'BEGIN JOURNEY', { fontSize: '20px', fontWeight: 'bold' }).setOrigin(0.5);
        startBtn.add([bg, txt]);

        // 7. FUNGSI LOGIKA VALIDASI
        const proceedToMenu = () => {
            const name = inputElement.value.trim();
            
            // CEK MINIMAL 3 KARAKTER
            if (name.length < 3) {
                errorText.setText('NAME TOO SHORT! (MIN 3)');
                // Efek getar kecil pada input agar user sadar
                this.cameras.main.shake(100, 0.002);
                return; // Berhenti di sini, jangan pindah scene
            }

            // Simpan nama ke Data Global jika valid
            const user = gameData.getUser();
            user.userName = name;

            // Hapus input dari layar sebelum pindah
            inputElement.remove();

            // Pindah ke Menu Level
            this.scene.start('MenuScene');
        };

        // EVENT: Klik Tombol
        bg.on('pointerdown', proceedToMenu);

        // EVENT: Tekan Tombol Enter pada Keyboard
        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') proceedToMenu();
        });

        // FEEDBACK VISUAL: Update status tombol secara real-time saat mengetik
        inputElement.addEventListener('input', () => {
            if (inputElement.value.length >= 3 && inputElement.value.length <= 7) {
                bg.setFillStyle(0x7b56ff); // Warna normal
                errorText.setText('');    // Hapus pesan error
            } else {
                bg.setFillStyle(0x555555); // Warna abu-abu (tanda belum valid)
            }
        });

        // Hover Effect untuk UX
        bg.on('pointerover', () => {
            if (inputElement.value.length >= 3) bg.setFillStyle(0x9d81ff);
        });
        bg.on('pointerout', () => {
            if (inputElement.value.length >= 3) bg.setFillStyle(0x7b56ff);
            else bg.setFillStyle(0x555555);
        });

        // CLEANUP: Pastikan elemen HTML terhapus saat ganti scene
        this.events.on('shutdown', () => {
            if (inputElement.parentNode) inputElement.remove();
        });
    }
}