export const wordLibrary = {
    // Sifat Kamus
    "starter_spells": {
        spellNameLibrary: "Starter Spells",
        wordLength: "Small",
        jsonKey: "words_starter", // Key untuk Phaser
        jsonPath: "/data/words/starter_words.json", //pathfile
        answerMana: 10,       // Mana yang didapat per kata
        bonusCoin: 1          // Tambahan koin
    },
    "fire_advanced": {
        spellNameLibrary: "Inferno Spells",
        wordLength: "Medium",
        jsonKey: "words_fire", // Key untuk Phaser
        jsonPath: "/data/words/advanced_words.json", //pathfile
        answerMana: 25,
        bonusCoin: 3
    },
    "boss_incantation": {
        spellNameLibrary: "Forbidden Spells",
        wordLength: "Long",
        jsonKey: "words_hard", // Key untuk Phaser
        jsonPath: "/data/words/boss_words.json", //pathfile
        answerMana: 50,
        bonusCoin: 10
    }
};