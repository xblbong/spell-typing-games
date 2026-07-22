export const enemyLibrary = {
    "slime_red": {
        enemyName: "Red Slime",
        wordLibID: "starter_spells",
        attackPower: 5,
        sprite: "slime_red_anim",             // Key untuk Phaser
        imagePath: "images/characters/Luma_cimol.png", // Path File
        enemyCategory: "DirectAttack",
        walkSpeed: 1
    },
    "goblin_mage": {
        enemyName: "Goblin Mage",
        wordLibID: "fire_advanced", 
        attackPower: 15,
        sprite: "goblin_mage_anim",           
        imagePath: "images/characters/Luma_cimol.png",
        enemyCategory: "FarAttack",
        walkSpeed: 2
    },
    "dark_knight": {
        enemyName: "Dark Knight",
        wordLibID: "boss_incantation",
        attackPower: 30,
        sprite: "knight_anim",                
        imagePath: "images/characters/Luma_cimol.png",
        enemyCategory: "DirectAttack",
        walkSpeed: 3
    }
};