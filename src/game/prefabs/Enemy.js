import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Container {
    constructor(scene, x, y, enemyData) {
        super(scene, x, y);
        this.stats = enemyData;   // Menyimpan data statistik musuh
        this.isDying = false;      // Penanda sedang proses kedip mati
        this.isStopped = false;    // Penanda sedang berhenti di depan penyihir
        this.isPreparingStrike = false; // Penanda sedang menyiapkan serangan (untuk tipe Strike)

        // Gaya tulisan mantra di atas kepala musuh
        const style = {
            fontSize: '24px', fontFamily: '"Press Start 2P", monospace', fontWeight: 'bold',
            backgroundColor: '#00000088', padding: { x: 5, y: 4 }
        };

        // 1. Membuat Teks Bayangan (Dasar Putih)
        this.textBg = scene.add.text(0, -65, '', style).setOrigin(0.5).setAlpha(0.5);
        // 2. Membuat Teks Progres (Warna Hijau-Cyan)
        this.textFg = scene.add.text(0, -65, '', { ...style, backgroundColor: null }).setOrigin(0.5).setColor('#00ffcc');
        
        // 3. Gambar Musuh
        this.sprite = scene.add.image(0, 0, enemyData.sprite).setScale(0.2);
        this.sprite.setFlipX(true); // Menghadap ke kiri (arah penyihir)

        // 4. Masukkan elemen ke Container
        this.add([this.sprite, this.textBg, this.textFg]);

        // 5. Animasi melayang jika tipe Flying
        if (this.stats.movementType === "Flying") {
            scene.tweens.add({
                targets: this,
                y: y - 25, 
                duration: 1200 + Math.random() * 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        scene.add.existing(this);
    }

    /**
     * [UPDATE VISUALS] Mengatur tampilan teks saat diketik.
     * Memperbaiki error totalW is not defined.
     */
    updateVisuals(targetWord, currentIndex) {
        if (!this.active || this.isDying) return;

        const typed = targetWord.substring(0, currentIndex);
        this.textBg.setText(targetWord);
        this.textFg.setText(typed);

        // --- FIX: Tambahkan 'const' agar tidak ReferenceError ---
        const totalW = this.textBg.width; 
        const startX = -(totalW / 2);

        this.textBg.setOrigin(0, 0.5).setX(startX);
        this.textFg.setOrigin(0, 0.5).setX(startX);
    }

    /**
     * [MOVE] Musuh jalan hanya jika tidak mati dan tidak sedang tertahan (stop).
     */
    move() {
        //jika musuh tidak mati, tidak berhenti, dan tidak sedang menyiapkan serangan, maka musuh akan bergerak ke kiri
        if (!this.isDying && !this.isStopped && !this.isPreparingStrike) {
            this.x -= this.stats.walkSpeed; // this.x -= this.stats.walkSpeed; // Menggerakkan musuh ke kiri sesuai kecepatan berjalan
        }
    }

    /**
     * [STOP] Menahan musuh agar diam di tempat.
     */
    stop() {
        this.isStopped = true;
    }

    /**
     * [DIE] Efek kedip 3x sebelum hancur. Dipanggil saat jawaban BENAR.
     */
    die() {
        if (this.isDying) return;
        this.isDying = true;

        // Animasi kedip (Flicker)
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 100,
            repeat: 3,
            yoyo: true,
            onComplete: () => {
                this.destroy(); // Hapus selamanya dari game
            }
        });
    }
}