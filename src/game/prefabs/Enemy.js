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

        // Teks
        this.textBg = scene.add.text(0, -60, '', style)
            .setOrigin(0.5).setAlpha(0.5);
        
        this.textFg = scene.add.text(0, -60, '', { ...style, backgroundColor: null })
            .setOrigin(0.5).setColor('#00ffcc');

        //Sprite (Hanya sprite ini yang kita kecilkan jika perlu)
        this.sprite = scene.add.image(0, 0, enemyData.sprite);
        this.sprite.setScale(0.2);

        // Tambahkan ke container
        this.add([this.sprite, this.textBg, this.textFg]);
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