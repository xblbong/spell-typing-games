export const levelLibrary = [
    {
        levelName: "Mystic Forest",
        levelCategory: "Ez",
        bgKey: "bg_level1", // key untuk bg
        bgPath: "images/background/Curiosa_alternatif.png", // path untuk background
        enemyIDs: ["slime_red"],
        baseCoin: 10,
        minTarget: 5,       
        timeTarget: 30 
    },
    {
        levelName: "Crystal Cave",
        levelCategory: "Norm",
        bgKey: "bg_level2", // key untuk bg
        bgPath: "images/background/Curiosa_alternatif.png", // path untuk background
        enemyIDs: ["slime_red", "goblin_mage"],
        baseCoin: 25,
        minTarget: 8,
        timeTarget: 30
    },
    {
        levelName: "Shadow Castle",
        levelCategory: "Hard",
        bgKey: "bg_level3", // key untuk bg
        bgPath: "images/background/Curiosa_alternatif.png", // path untuk background
        enemyIDs: ["goblin_mage", "dark_knight"],
        baseCoin: 40,
        minTarget: 12,
        timeTarget: 60
    }
];