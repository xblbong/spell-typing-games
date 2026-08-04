export default class TypingBar {
    constructor(scene, x, y) {
        this.scene = scene;
        this.centerX = x;
        this.centerY = y;
        this.isLocked = false;

        const style = { fontSize: '32px', fontFamily: 'monospace', fontWeight: 'bold' };

        // 1. Background Box
        this.bgBox = scene.add.graphics();
        this.drawBackground(0x7b56ff); 

        // 2. Hit Zone
        this.hitZone = scene.add.rectangle(x, y, 500, 60, 0x000000, 0).setInteractive({ useHandCursor: true });

        // 3. Teks Placeholder
        this.placeholderText = scene.add.text(x, y, 'READY TO CAST...', style).setOrigin(0.5).setColor('#555555').setAlpha(0.5);
        
        // 4. Teks Bayangan (Background tulisan)
        this.bgText = scene.add.text(x, y, '', style).setOrigin(0.5).setAlpha(0.15);
        
        // 5. Teks Foreground (Warna yang diketik benar)
        // KUNCI: Gunakan #00ffff (Cyan terang) agar sesuai permintaanmu
        this.fgText = scene.add.text(x, y, '', style).setOrigin(0.5).setColor('#00ffff');
        
        // 6. Kursor
        this.cursor = scene.add.rectangle(x, y, 4, 35, 0x00ffff).setOrigin(0.5).setVisible(false);

        this.setupAnimations();
    }

    drawBackground(color) {
        this.bgBox.clear().fillStyle(0x000000, 0.7).lineStyle(3, color)
            .fillRoundedRect(this.centerX - 250, this.centerY - 30, 500, 60, 12)
            .strokeRoundedRect(this.centerX - 250, this.centerY - 30, 500, 60, 12);
    }

    setupAnimations() {
        this.scene.tweens.add({ targets: this.bgBox, alpha: 0.6, duration: 1000, yoyo: true, repeat: -1 });
    }

    triggerLockOn() {
        this.isLocked = true;
        this.drawBackground(0x00ffff); // Berubah warna Cyan saat mengunci musuh
    }

    triggerHit() {
        this.scene.tweens.add({ targets: this.cursor, scaleY: 1.5, duration: 50, yoyo: true });
    }

    triggerInvalid() {
        this.drawBackground(0xff4d6d);
        this.scene.time.delayedCall(200, () => this.drawBackground(this.isLocked ? 0x00ffff : 0x7b56ff));
    }

    triggerMiss() {
        this.fgText.setColor('#ff4d6d');
        this.scene.time.delayedCall(200, () => this.fgText.setColor('#00ffff'));
    }

    /**
     * [UPDATE] 
     * Fungsi untuk memperbarui tampilan teks secara real-time.
     */
    update(word, index) {
        // Jika tidak ada kata yang diketik
        if (!word || word === "") {
            this.isLocked = false;
            this.placeholderText.setVisible(true);
            this.bgText.setText("");
            this.fgText.setText("");
            this.cursor.setVisible(false);
            this.drawBackground(0x7b56ff);
            return;
        }

        // Jika sedang mengetik
        this.placeholderText.setVisible(false);
        this.cursor.setVisible(true);
        
        // Update isi teks
        this.bgText.setText(word).updateText(); // Paksa update dimensi teks
        this.fgText.setText(word.substring(0, index));

        // HITUNG POSISI PRESISI
        // Kita hitung lebar total teks agar bisa ditaruh tepat di tengah bar
        const totalW = this.bgText.width;
        const startX = this.centerX - (totalW / 2);

        // Kunci posisi teks agar rata kiri di dalam kalkulasi centering kita
        this.bgText.setOrigin(0, 0.5).setPosition(startX, this.centerY);
        this.fgText.setOrigin(0, 0.5).setPosition(startX, this.centerY);

        // Update Posisi Kursor agar selalu di depan huruf terakhir
        const charW = totalW / word.length;
        this.cursor.setPosition(startX + (index * charW), this.centerY);
    }
}