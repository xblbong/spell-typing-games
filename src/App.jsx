import React from 'react'
import PhaserGame from './components/PhaserGame'

function App() {
    return (
        <div className="app-container">
            {/* <div className="overlay-ui">
                <div className="title-section">
                    <div className="crystal left-crystal"></div>
                    <h1>SPELL TYPER</h1>
                    <div className="crystal left-crystal"></div>
                </div>
            </div> */}

            <PhaserGame />
        </div>
    )
}

export default App