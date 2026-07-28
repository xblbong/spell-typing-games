export const enemyLibrary = {
    "slime_red": {
        enemyName: "Red Slime",
        wordLibID: "starter_spells",
        attackPower: 5,
        sprite: "slime_red_anim",
        imagePath: "images/enimies/Goblin_1.png", 
        enemyCategory: "DirectAttack", // Urusan Logika Serang
        movementType: "Ground",        // Urusan Logika Posisi/Ketinggian
        walkSpeed: 1
    },
    "goblin_mage": {
        enemyName: "Goblin Mage",
        wordLibID: "fire_advanced", 
        attackPower: 15,
        sprite: "goblin_mage_anim",           
        imagePath: "images/enimies/Goblin_1.png",
        enemyCategory: "FarAttack",
        movementType: "Flying",        // Dia terbang!
        walkSpeed: 2
    },
    "dark_knight": {
        enemyName: "Dark Knight",
        wordLibID: "boss_incantation",
        attackPower: 30,
        sprite: "knight_anim",                
        imagePath: "images/enimies/Goblin_1.png",
        enemyCategory: "DirectAttack",
        movementType: "Ground",
        walkSpeed: 3
    }
};