export default class TypingBar {
    constructor(scene, x, y) {
        this.scene = scene;
        this.centerX = x;
        this.centerY = y;

        // Posisi Y yang lebih presisi untuk tengah perut bubble
        const visualY = y - 10;

        // 1. Gambar Bubble (Alpha sedikit dikurangi agar menyatu dengan background)
        this.bubbleImage = scene.add.image(x, y, 'ui_typing_bubble')
            .setScale(0.5)
            .setDepth(10)
            .setAlpha(0.95);

        // 2. Gaya tulisan Minimalis & Modern
        const commonStyle = {
            fontSize: '12px', 
            fontFamily: '"Press Start 2P", monospace, Arial, sans-serif',
            fontWeight: 'bold',
        };

        // Placeholder: Abu-abu Lavender (Sangat soft)
        this.placeholderText = scene.add.text(x, visualY, 'WAITING FOR SPELL..', commonStyle)
            .setOrigin(0.5)
            .setColor('#b2bec3') 
            .setAlpha(0.6)
            .setDepth(12);

        // Background Text (Huruf belum diketik): Abu-abu terang (High Quality Grey)
        this.bgText = scene.add.text(x, visualY, '', commonStyle)
            .setOrigin(0.5)
            .setColor('#d1d8e0') // Abu-abu sangat soft
            .setDepth(12);

        // Foreground Text (Huruf SUDAH diketik): Indigo Magis (Kontras tinggi)
        this.fgText = scene.add.text(x, visualY, '', commonStyle)
            .setOrigin(0.6)
            .setColor('#4834d4') // Warna ungu indigo yang elegan
            .setShadow(1, 1, 'rgba(0,0,0,0.1)', 2) // Shadow tipis agar teks "timbul"
            .setDepth(12);

        // Kursor: Tipis dan Elegan (Warna Ungu Muda)
        this.cursor = scene.add.rectangle(x, visualY, 2, 28, 0x686de0)
            .setOrigin(0.5)
            .setVisible(false)
            .setDepth(13);

        // Animasi napas yang lebih halus (Slow & Smooth)
        this.scene.tweens.add({
            targets: this.bubbleImage,
            scale: 0.52,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Animasi kursor berkedip (Blink)
        this.scene.tweens.add({
            targets: this.cursor,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    drawBackground(color) {
        this.bubbleImage.setTint(color);
    }

    triggerLockOn() {
        this.isLocked = true;
        // Beri tint biru sangat pudar (Soft Lavender) agar tidak mencolok
        this.bubbleImage.setTint(0xeff5ff); 
    }

    triggerHit() {
        // Feedback visual kecil saat berhasil mengetik
        this.scene.tweens.add({ 
            targets: this.bubbleImage, 
            scaleX: 0.53, 
            duration: 50, 
            yoyo: true 
        });
    }

    triggerInvalid() {
        // Merah pastel jika salah tekan (Lebih nyaman di mata dibanding merah solid)
        this.drawBackground(0xffb8b8); 
        this.scene.time.delayedCall(200, () => this.bubbleImage.clearTint());
    }

    triggerMiss() {
        // Teks berubah jadi merah marun sebentar jika salah di tengah kata
        this.fgText.setColor('#eb4d4b');
        this.scene.time.delayedCall(200, () => this.fgText.setColor('#4834d4'));
    }

    update(word, index) {
        if (!word || word === "") {
            this.placeholderText.setVisible(true);
            this.bgText.setText("");
            this.fgText.setText("");
            this.cursor.setVisible(false);
            this.bubbleImage.clearTint();
            return;
        }

        this.placeholderText.setVisible(false);
        this.cursor.setVisible(true);

        this.bgText.setText(word);
        this.fgText.setText(word.substring(0, index));

        const totalW = this.bgText.width;
        const textY = this.centerY - 10; // Sesuaikan dengan visualY
        const startX = this.centerX - (totalW / 2);

        this.bgText.setOrigin(0, 0.5).setPosition(startX, textY);
        this.fgText.setOrigin(0, 0.5).setPosition(startX, textY);

        const typedPart = word.substring(0, index);
        const tempText = this.scene.make.text({ style: this.fgText.style }).setText(typedPart);
        const typedW = tempText.width;
        tempText.destroy();

        this.cursor.setPosition(startX + typedW + 2, textY);
    }
}