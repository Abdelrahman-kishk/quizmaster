// Sound toggles + effects, using Howler.js. Files are optional — if you don't
// have audio assets yet, swap these src arrays for your own hosted mp3/ogg files.
const Sound = (() => {
  let enabled = localStorage.getItem('qm_sound') !== 'off';
  const sounds = {
    correct: new Howl({ src: ['assets/sfx/correct.mp3'], volume: 0.6 }),
    incorrect: new Howl({ src: ['assets/sfx/incorrect.mp3'], volume: 0.6 }),
    victory: new Howl({ src: ['assets/sfx/victory.mp3'], volume: 0.7 }),
    tick: new Howl({ src: ['assets/sfx/tick.mp3'], volume: 0.3 }),
  };
  function play(name) { if (enabled && sounds[name]) sounds[name].play(); }
  function toggle() { enabled = !enabled; localStorage.setItem('qm_sound', enabled ? 'on' : 'off'); return enabled; }
  function isEnabled() { return enabled; }
  return { play, toggle, isEnabled };
})();
