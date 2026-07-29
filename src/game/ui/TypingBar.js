export default class TypingBar {
    constructor(scene, x, y) {
        this.scene = scene;
        this.centerX = x;
        this.centerY = y;
        this.isLocked = false;

        const style = { fontSize: '32px', fontFamily: 'monospace', fontWeight: 'bold' };

        // 1. Background & Border
        this.bgBox = scene.add.graphics();
        this.drawBackground(0x7b56ff); 

        // 2. Hit Zone untuk Hover
        this.hitZone = scene.add.rectangle(x, y, 500, 60, 0x000000, 0).setInteractive({ useHandCursor: true });

        // 3. Teks & Kursor
        this.placeholderText = scene.add.text(x, y, 'READY TO CAST...', style).setOrigin(0.5).setColor('#555555').setAlpha(0.5);
        this.bgText = scene.add.text(x, y, '', style).setOrigin(0.5).setAlpha(0.15);
        this.fgText = scene.add.text(x, y, '', style).setOrigin(0.5).setColor('#00ffcc');
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

    // --- FUNGSI-FUNGSI YANG TADI HILANG ---
    triggerLockOn() {
        this.isLocked = true;
        this.drawBackground(0x00ffcc); // Berubah warna saat mengunci musuh
    }

    triggerHit() {
        this.scene.tweens.add({ targets: this.cursor, scaleY: 1.5, duration: 50, yoyo: true });
    }

    triggerInvalid() {
        this.drawBackground(0xff4d6d);
        this.scene.time.delayedCall(200, () => this.drawBackground(this.isLocked ? 0x00ffcc : 0x7b56ff));
    }

    triggerMiss() {
        this.fgText.setColor('#ff4d6d');
        this.scene.time.delayedCall(200, () => this.fgText.setColor('#00ffcc'));
    }

    update(word, index) {
        if (!word || word === "") {
            this.isLocked = false;
            this.placeholderText.setVisible(true);
            this.bgText.setText("");
            this.fgText.setText("");
            this.cursor.setVisible(false);
            this.drawBackground(0x7b56ff);
            return;
        }

        this.placeholderText.setVisible(false);
        this.cursor.setVisible(true);
        this.bgText.setText(word).updateText();
        this.fgText.setText(word.substring(0, index));

        const startX = this.centerX - (this.bgText.width / 2);
        this.bgText.setOrigin(0, 0.5).setX(startX);
        this.fgText.setOrigin(0, 0.5).setX(startX);
        this.cursor.setX(startX + (index * (this.bgText.width / word.length)));
    }
}