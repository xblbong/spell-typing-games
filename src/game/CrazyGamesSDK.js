/**
 * CrazyGames SDK Integration Helper
 * Handles audio muting through CrazyGames SDK events.
 * 
 * SDK is loaded via <script> tag in index.html, so we access it via window.CrazyGames
 */

let gameInstance = null;

/**
 * Initialize CrazyGames SDK integration.
 * Call this after Phaser game instance is created.
 * @param {Phaser.Game} game - The Phaser game instance
 */
export function initCrazyGamesSDK(game) {
    gameInstance = game;

    // Check if CrazyGames SDK is available (loaded from script tag)
    if (typeof window.CrazyGames === 'undefined' || !window.CrazyGames.SDK) {
        console.log('[CrazyGames] SDK not available, skipping integration.');
        return;
    }

    try {
        const sdk = window.CrazyGames.SDK;

        // Initialize the SDK
        sdk.init().then(() => {
            console.log('[CrazyGames] SDK initialized successfully.');

            // Listen for game settings changes (mute/unmute)
            sdk.game.onSettingsChange((settings) => {
                if (gameInstance && gameInstance.sound) {
                    if (settings.muteAudio) {
                        gameInstance.sound.mute = true;
                        console.log('[CrazyGames] Audio muted by platform.');
                    } else {
                        gameInstance.sound.mute = false;
                        console.log('[CrazyGames] Audio unmuted by platform.');
                    }
                }
            });
        }).catch((err) => {
            console.warn('[CrazyGames] SDK init failed:', err);
        });
    } catch (err) {
        console.warn('[CrazyGames] SDK integration error:', err);
    }
}
