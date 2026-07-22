import { useEffect, useRef } from 'react';
import { startPhaser } from '../game/main';

export default function PhaserGame() {
    const gameRef = useRef(null); // Penanda untuk container div
    const phaserInstance = useRef(null); // Penanda untuk instance game agar tidak double-spawn

    useEffect(() => {
        // Nyalakan game hanya sekali saat komponen muncul
        if (!phaserInstance.current) {
            phaserInstance.current = startPhaser('game-container');
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