export default class TypingBar {
    constructor(scene, x, y) {
        this.scene = scene;
        this.centerX = x;
        this.centerY = y;
        this.isLocked = false; // Menandai apakah sedang mengetik kata

        const style = { fontSize: '32px', fontFamily: 'monospace', fontWeight: 'bold' };

        // 1. Background & Border
        this.bgBox = scene.add.graphics();
        this.drawBackground(0x7b56ff); // Warna default standby

        // 2. Area Sensor Hover (Hit Zone)
        // Kita buat kotak transparan seukuran bar untuk menangkap input mouse
        this.hitZone = scene.add.rectangle(x, y, 500, 60, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        // Logika Hover
        this.hitZone.on('pointerover', () => {
            // Berubah warna jika sedang tidak mengetik kata (standby)
            if (!this.isLocked) this.drawBackground(0xffee00); // Kuning emas saat hover
        });

        this.hitZone.on('pointerout', () => {
            // Kembali ke ungu jika tidak sedang mengetik
            if (!this.isLocked) this.drawBackground(0x7b56ff);
        });

        // 3. Teks & Kursor
        this.placeholderText = scene.add.text(x, y, 'READY TO CAST...', style)
            .setOrigin(0.5).setColor('#555555').setAlpha(0.5);

        this.bgText = scene.add.text(x, y, '', style).setOrigin(0.5).setAlpha(0.15);
        this.fgText = scene.add.text(x, y, '', style).setOrigin(0.5).setColor('#00ffcc');
        
        this.cursor = scene.add.rectangle(x, y, 4, 35, 0x00ffff).setOrigin(0.5);
        
        // Animasi
        this.setupAnimations();
    }

    setupAnimations() {
        // Animasi Border "Bernapas"
        this.scene.tweens.add({
            targets: this.bgBox,
            alpha: 0.6,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Animasi Kursor Berkedip
        this.scene.tweens.add({
            targets: this.cursor,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    drawBackground(color) {
        this.bgBox.clear()
            .fillStyle(0x000000, 0.7)
            .lineStyle(3, color)
            .fillRoundedRect(this.centerX - 250, this.centerY - 30, 500, 60, 12)
            .strokeRoundedRect(this.centerX - 250, this.centerY - 30, 500, 60, 12);
    }

    update(word, index) {
        // Jika tidak ada kata (Standby)
        if (!word || word === "") {
            this.isLocked = false;
            this.placeholderText.setVisible(true);
            this.bgText.setText("");
            this.fgText.setText("");
            this.cursor.setVisible(false);
            
            // Cek posisi mouse untuk menentukan warna (jika mouse sedang di atasnya)
            const isMouseOver = this.hitZone.getBounds().contains(this.scene.input.x, this.scene.input.y);
            this.drawBackground(isMouseOver ? 0xffee00 : 0x7b56ff);
            return;
        }

        // Jika sedang mengetik (Locked-On)
        this.isLocked = true;
        this.drawBackground(0x00ffcc); // Warna Cyan saat aktif mengetik
        this.placeholderText.setVisible(false);
        this.cursor.setVisible(true);
        
        this.bgText.setText(word);
        this.fgText.setText(word.substring(0, index));

        const totalW = this.bgText.width;
        const startX = this.centerX - (totalW / 2);
        this.lastStartX = startX;

        this.bgText.setOrigin(0, 0.5).setX(startX);
        this.fgText.setOrigin(0, 0.5).setX(startX);
        
        const charW = totalW / word.length;
        this.cursor.setPosition(startX + (index * charW), this.centerY);
    }

    // --- Efek Feedback ---
    triggerInvalid() {
        this.drawBackground(0xff4d6d);
        this.scene.cameras.main.shake(100, 0.002);
        this.scene.time.delayedCall(200, () => this.drawBackground(this.isLocked ? 0x00ffcc : 0x7b56ff));
    }

    triggerHit() {
        this.scene.tweens.add({ targets: this.cursor, scaleY: 1.5, duration: 50, yoyo: true });
    }

    triggerMiss() {
        this.fgText.setColor('#ff4d6d');
        this.scene.time.delayedCall(200, () => this.fgText.setColor('#00ffcc'));
    }
}