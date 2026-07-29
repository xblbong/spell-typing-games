import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Container {
    constructor(scene, x, y, enemyData) {
        super(scene, x, y);
        this.stats = enemyData;

        const style = {
            fontSize: '32px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            backgroundColor: '#00000088',
            padding: { x: 5, y: 4 }
        };

        // 1. BUAT SEMUA ANAK OBJEK DULU
        this.textBg = scene.add.text(0, -65, '', style).setOrigin(0.5).setAlpha(0.5);
        this.textFg = scene.add.text(0, -65, '', { ...style, backgroundColor: null }).setOrigin(0.5).setColor('#00ffcc');
        this.sprite = scene.add.image(0, 0, enemyData.sprite).setScale(0.2);
        this.sprite.setFlipX(true); //balik images

        // 2. MASUKKAN KE DALAM CONTAINER
        this.add([this.sprite, this.textBg, this.textFg]);
        
        // 3. BARU JALANKAN ANIMASI (TWEEN)
        if (this.stats.movementType === "Flying") {
            scene.tweens.add({
                targets: this,
                y: y - 25, // Melayang naik sejauh 25px
                duration: 1200 + Math.random() * 800, // Durasi acak biar ga barengan geraknya
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        scene.add.existing(this);
    }

    updateVisuals(targetWord, currentIndex) {
        if (!this.active) return;

        const typed = targetWord.substring(0, currentIndex);
        this.textBg.setText(targetWord);
        this.textFg.setText(typed);

        // Kita tumpuk FG tepat di atas BG
        const totalW = this.textBg.width;
        const startX = -(totalW / 2);

        this.textBg.setOrigin(0, 0.5).setX(startX);
        this.textFg.setOrigin(0, 0.5).setX(startX);
    }

    move() {
        this.x -= this.stats.walkSpeed;
    }

    die() {
        this.destroy();
    }
}