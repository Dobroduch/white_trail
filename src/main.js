// THE WHITE TRAIL — bootstrap.
import { TEST } from './engine/testMode.js'; // first: seeds Math.random in ?test=1 mode
import { Display, toggleFullscreen } from './engine/display.js';
import { Input } from './engine/input.js';
import { Loop } from './engine/loop.js';
import { loadSprites, loadNativeSheets, assetErrors } from './engine/assets.js';
import { Game } from './engine/game.js';
import { loadStationArt } from './world/stationArt.js';
import { loadTownArt } from './world/townArt.js';
import { loadNativeSceneArt } from './world/nativeArt.js';
import { Audio } from './audio/audio.js';
import { loadSettings } from './systems/save.js';
import { PauseMenu } from './ui/menus.js';
import { loadMapArt } from './ui/mapView.js';
import { loadHudIcons } from './ui/hud.js';
import { loadItemIcons } from './ui/itemIcons.js';
import { loadLevels, reloadLevel, levelStatus } from './world/tiled/levels.js';
import { loadAudioBank } from './audio/samples.js';

async function boot() {
  const canvas = document.getElementById('game');
  const bootEl = document.getElementById('boot');
  const display = new Display(canvas);
  const input = new Input(canvas);
  input.onFullscreen = () => toggleFullscreen();
  const settings = loadSettings();
  const audio = new Audio(settings);

  await loadSprites();
  await loadNativeSheets(); // Pixelorama native-density characters override the legacy sprites
  await loadStationArt();
  await loadTownArt();
  await loadNativeSceneArt();
  await Promise.all([loadMapArt(), loadHudIcons(), loadItemIcons(), loadLevels(), loadAudioBank(audio)]);
  if (assetErrors().length) console.warn(`[boot] ${assetErrors().length} asset problem(s); see errors above. The game will continue with fallbacks.`);

  const game = new Game({ display, input, audio, settings });
  // Exposed for debugging and automated play-testing only.
  window.TWT = game;
  game.levels = { reload: async (id = game.scene && game.scene.id) => { const ok = await reloadLevel(id); if (ok && game.scene && game.scene.id === id) game.reloadScene(); return ok; }, status: levelStatus };
  if (TEST.scene) game.startAt(TEST.scene, { phase: TEST.phase, spawn: TEST.spawn });

  const loop = new Loop((dt) => game.update(dt), (a) => game.render(a));
  if (TEST.manual) {
    // Deterministic stepping for automated tests: nothing moves unless the test advances it.
    window.TWT_TEST = {
      step(n = 1) { for (let i = 0; i < n; i++) game.update(1 / 60); game.render(); return n; },
      render() { game.render(); },
      seed: TEST.seed,
    };
    game.render();
  } else loop.start();
  bootEl.dataset.done = '1';
  bootEl.style.display = 'none';
  canvas.focus();
  document.documentElement.dataset.ready = '1'; // tests wait for this

  // Pause safely on focus loss; never let story timers advance while hidden.
  const pauseForFocus = () => {
    if (TEST.noAutoPause) return;
    if (game.mode === 'play' && !game.overlay) game.pushOverlay(new PauseMenu(game));
    audio.suspend();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseForFocus();
    else { loop.last = performance.now(); }
  });
  window.addEventListener('blur', pauseForFocus);
  window.addEventListener('focus', () => { loop.last = performance.now(); });
  // Resume audio on the next interaction after returning.
  input.onKey(() => audio.resume());
}

boot().catch((err) => {
  console.error('[boot] fatal:', err);
  const b = document.getElementById('boot');
  if (b) { b.className = 'error'; b.style.display = 'flex'; document.getElementById('boot-msg').textContent = 'Failed to start: ' + err.message; }
});
