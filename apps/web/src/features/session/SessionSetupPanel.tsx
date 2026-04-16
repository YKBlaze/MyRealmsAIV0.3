const worlds = ["Ash March", "Neon Broker", "Signal Array"];
const scenes = ["Briarwatch Gate", "Broker Booth", "Signal Array"];
const players = ["Borik Thane", "Mara Quill", "Tahl Ren"];
const voices = ["Grim Witness", "Lush Chronicler", "Clean Minimalist"];

export function SessionSetupPanel() {
  return (
    <>
      <section className="panel roster-panel">
        <div className="roster-header">
          <div>Session Setup</div>
        </div>
        <div className="selector-block">
          <label htmlFor="world-select">World</label>
          <select id="world-select" defaultValue={worlds[0]}>
            {worlds.map((world) => (
              <option key={world} value={world}>
                {world}
              </option>
            ))}
          </select>
        </div>
        <div className="selector-block">
          <label htmlFor="scene-select">Scene</label>
          <select id="scene-select" defaultValue={scenes[0]}>
            {scenes.map((scene) => (
              <option key={scene} value={scene}>
                {scene}
              </option>
            ))}
          </select>
        </div>
        <div className="selector-block">
          <label htmlFor="player-select">Player</label>
          <select id="player-select" defaultValue={players[0]}>
            {players.map((player) => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
        </div>
        <div className="selector-block">
          <label htmlFor="voice-select">Narrator Voice</label>
          <select id="voice-select" defaultValue={voices[0]}>
            {voices.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
        </div>
        <button type="button">Apply Placeholder Preset</button>
      </section>

      <section className="panel roster-panel">
        <div className="roster-header">
          <div>Rebuild Notes</div>
        </div>
        <article className="roster-card">
          <p className="roster-appearance">
            This fork intentionally preserves only the shell: layout, controls, transcript frame, debug pane, and API
            touchpoints.
          </p>
          <p className="roster-origin">
            Use it to reconnect the app one seam at a time without carrying any runtime, engine, content, or model
            assumptions forward.
          </p>
        </article>
      </section>
    </>
  );
}
