export default class TypingBar {
    constructor(scene, x, y) {
        this.scene = scene;
        this.centerX = x;
        this.centerY = y;

        const style = { fontSize: '32px', fontFamily: 'monospace', fontWeight: 'bold' };

        //Background Bar
        scene.add.graphics()
            .fillStyle(0x000000, 0.7).lineStyle(2, 0x7b56ff)
            .fillRoundedRect(x - 250, y - 30, 500, 60, 12).strokeRoundedRect(x - 250, y - 30, 500, 60, 12);

        // Placeholder (Muncul saat kosong)
        this.placeholderText = scene.add.text(x, y, 'READY TO CAST...', style)
            .setOrigin(0.5).setColor('#555555').setAlpha(0.5);

        //Teks Utama
        this.bgText = scene.add.text(x, y, '', style).setOrigin(0.5).setAlpha(0.15);
        this.fgText = scene.add.text(x, y, '', style).setOrigin(0.5).setColor('#00ffcc');
        this.cursor = scene.add.rectangle(x, y, 3, 35, 0x00ffff).setOrigin(0.5).setVisible(false);
    }

    update(word, index) {
        if (!word || word === "") {
            this.placeholderText.setVisible(true);
            this.bgText.setText("");
            this.fgText.setText("");
            this.cursor.setVisible(false);
            return;
        }

        // Jika ada kata, sembunyikan placeholder
        this.placeholderText.setVisible(false);
        this.cursor.setVisible(true);
        this.bgText.setText(word).updateText();
        this.fgText.setText(word.substring(0, index));

        const totalW = this.bgText.width;
        const startX = this.centerX - (totalW / 2);

        this.bgText.setOrigin(0, 0.5).setX(startX);
        this.fgText.setOrigin(0, 0.5).setX(startX);
        
        const charW = totalW / word.length;
        this.cursor.setPosition(startX + (index * charW), this.centerY);
    }
}