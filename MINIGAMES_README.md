# Mini Multiplayer Games (Part 10)

This feature adds multiplayer mini-games to the Metaverse.

## How to Run

1.  **Start Backend**:
    ```bash
    cd apps/server
    npm run dev
    ```

2.  **Start Frontend**:
    ```bash
    cd apps/client
    npm run dev
    ```

## How to Test

1.  **Login**: Open the app and login/register.
2.  **Go to Game Room**: Navigate to the "Game Room" (slug: `game-room`).
    *   *Note: The default seed data adds a Quiz Zone to the Game Room.*
3.  **Find the Zone**: Walk to coordinates (200, 200). You should see a green semi-transparent box labeled "🎮 QUIZ".
4.  **Join Game**:
    *   Walk into the zone.
    *   You will see a prompt: "Press E to join QUIZ".
    *   Press **E**.
5.  **Play Quiz**:
    *   The Quiz UI will open.
    *   If you are the first player, click "START GAME".
    *   Answer questions by clicking the options.
    *   Scores are updated in real-time.
6.  **Multiplayer**:
    *   Open a second browser window (incognito).
    *   Login as a different user.
    *   Go to the same Game Room and join the same zone.
    *   You will see each other in the player list and scores will sync.

## Architecture

*   **Shared Types**: `packages/shared/src/types.ts` defines `GameZoneConfig` and `GameSession`.
*   **Server**:
    *   `apps/server/src/services/gameService.ts`: Manages in-memory game sessions and quiz logic.
    *   `apps/server/src/sockets/gameHandlers.ts`: Handles Socket.io events (`game:join`, `game:action`, etc.).
*   **Client**:
    *   `apps/client/src/components/phaser/game/scenes/RoomScene.ts`: Parses `gameZones` from layout, handles overlap, and launches mini-game.
    *   `apps/client/src/components/phaser/game/scenes/QuizScene.ts`: The mini-game UI overlay.
