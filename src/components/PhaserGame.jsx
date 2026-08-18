import { useEffect, useRef } from 'react';
import { startPhaser } from '../game/main';
import { initCrazyGamesSDK } from '../game/CrazyGamesSDK';

export default function PhaserGame() {
    const gameRef = useRef(null); // Penanda untuk container div
    const phaserInstance = useRef(null); // Penanda untuk instance game agar tidak double-spawn

    useEffect(() => {
        // Nyalakan game hanya sekali saat komponen muncul
        if (!phaserInstance.current) {
            phaserInstance.current = startPhaser('game-container');
            // Inisialisasi CrazyGames SDK untuk integrasi audio muting
            initCrazyGamesSDK(phaserInstance.current);
        }

        // Cleanup, Matikan game saat pindah halaman/komponen dihapus
        return () => {
            if (phaserInstance.current) {
                phaserInstance.current.destroy(true);
                phaserInstance.current = null;
            }
        };
    }, []);

    return <div id="game-container" ref={gameRef} />;
}