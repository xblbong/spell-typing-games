import { enemyLibrary } from "./enemies";
import { levelLibrary } from "./levels";
import { userData } from "./user";
import { wordLibrary } from "./wordLibrary";

export const gameData = {
    getUser: () => userData,

    getLevel: (levelIndex) => {
        const level = levelLibrary[levelIndex];
        if (!level) return null;

        // Gunakan enemyIDs
        const enrichedEnemies = level.enemyIDs.map(id => {
            return {
                id: id,
                ...enemyLibrary[id]
            };
        });

        return {
            ...level,
            enemies: enrichedEnemies // Kita simpan sebagai 'enemies' untuk digunakan di Scene
        };
    },

    // Nama fungsi disamakan dengan yang dipanggil di GameScene
    getEnemyFullData: (enemyId) => {
        const enemy = enemyLibrary[enemyId];
        if (!enemy) return null;

        const library = wordLibrary[enemy.wordLibID];

        return {
            ...enemy,
            library: library
        };
    }
};