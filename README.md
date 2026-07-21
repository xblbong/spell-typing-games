# Spell Typing Game

A web-based typing game built with Phaser 3, where players cast spells by typing words. Designed for the CrazyGames platform.

## Tech Stack

- **Game Engine:** Phaser 3
- **Bundler:** Vite
- **Language:** JavaScript (ES Modules)
- **Platform Target:** CrazyGames

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

## Project Structure

```
spell-typing-games/
├── public/                  # Static assets (served as-is)
├── src/
│   ├── scenes/
│   │   ├── MenuScene.js     # Main menu scene
│   │   └── GameScene.js     # Core gameplay scene
│   ├── config.js            # Phaser game configuration
│   ├── main.js              # Application entry point
│   └── style.css            # Global styles
├── index.html               # HTML entry point
├── jsconfig.json            # JavaScript language service config
├── package.json             # Dependencies and scripts
└── vite.config.js           # Vite bundler configuration
```

## Setup

1. Clone the repository.

```
git clone <repo-url>
cd spell-typing-games
```

2. Install dependencies.

```
npm install
```

3. Start the development server.

```
npx vite
```

4. Open `http://localhost:5173` in your browser.

## Development

### Available Commands

| Command | Description |
|---------|-------------|
| `npx vite` | Start development server with hot reload |
| `npx vite build` | Build for production |
| `npx vite preview` | Preview production build locally |

### Code Conventions

- Use ES Modules (`import` / `export`) for all JavaScript files.
- Use `PascalCase` for class names.
- Use `camelCase` for variables, functions, and methods.
- Use `UPPER_SNAKE_CASE` for constants.
- Place scene classes in `src/scenes/` and name them `<Name>Scene.js`.
- Always extend `Phaser.Scene` when creating a new scene.

### Adding a New Scene

1. Create a new file in `src/scenes/`.
2. Export a class that extends `Phaser.Scene`.
3. Register the scene in `src/config.js` under the `scene` array.

## Build for Production

```
npx vite build
```

The output will be in the `dist/` folder. This build is ready for deployment to CrazyGames.

## Deployment (CrazyGames)

1. Run `npx vite build`.
2. Upload the contents of the `dist/` folder to the CrazyGames developer portal.
3. Ensure all assets are bundled and paths are relative.

## License

ISC
