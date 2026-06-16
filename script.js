// Map keyboard keys to xylophone note names and frequencies. Beginners can add
// another bar by adding a matching button in HTML and a new entry here.
const xylophoneNotes = {
  A: { name: 'C4', frequency: 261.63 },
  S: { name: 'D4', frequency: 293.66 },
  D: { name: 'E4', frequency: 329.63 },
  F: { name: 'G4', frequency: 392.00 },
  G: { name: 'A4', frequency: 440.00 },
  H: { name: 'C5', frequency: 523.25 },
};

// The AudioContext is created lazily on the first keypress or click so the
// browser allows sound playback without showing any autoplay errors.
let audioContext;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

// A xylophone sound starts with a quick mallet hit, then rings out briefly.
// This helper builds that shape with a fast attack and a natural fade.
function createMalletEnvelope(context, peakVolume, ringTime) {
  const gain = context.createGain();
  const now = context.currentTime;

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(peakVolume, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, now + ringTime);
  gain.connect(context.destination);

  return gain;
}

function addTone(context, destination, frequency, startVolume, ringTime) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(startVolume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + ringTime);

  oscillator.connect(gain).connect(destination);
  oscillator.start(now);
  oscillator.stop(now + ringTime);
}

function addMalletClick(context, destination) {
  // A tiny burst of filtered noise creates the wooden "tick" of the mallet.
  const noiseLength = Math.floor(context.sampleRate * 0.018);
  const buffer = context.createBuffer(1, noiseLength, context.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < noiseLength; i += 1) {
    samples[i] = Math.random() * 2 - 1;
  }

  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const now = context.currentTime;

  noise.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

  noise.connect(filter).connect(gain).connect(destination);
  noise.start(now);
}

function playXylophoneNote(note) {
  const context = getAudioContext();
  const masterGain = createMalletEnvelope(context, 0.85, 1.15);

  // Xylophones are bright because the main note is mixed with quieter overtones.
  addTone(context, masterGain, note.frequency, 0.8, 1.15);
  addTone(context, masterGain, note.frequency * 3.01, 0.22, 0.55);
  addTone(context, masterGain, note.frequency * 4.95, 0.10, 0.35);
  addMalletClick(context, masterGain);
}

function lightPad(key) {
  const pad = document.querySelector(`[data-key="${key}"]`);

  if (!pad) {
    return;
  }

  pad.classList.add('is-active');
  window.setTimeout(() => {
    pad.classList.remove('is-active');
  }, 160);
}

function triggerNote(key) {
  const upperKey = key.toUpperCase();
  const note = xylophoneNotes[upperKey];

  if (!note) {
    return;
  }

  playXylophoneNote(note);
  lightPad(upperKey);
}

// Keyboard events make the xylophone playable immediately without clicking a bar.
document.addEventListener('keydown', (event) => {
  // Ignore held-down repeats so one press creates one clean note.
  if (event.repeat) {
    return;
  }

  triggerNote(event.key);
});

// Clicking is optional, but it helps mouse and touch users try the app too.
document.querySelectorAll('.pad').forEach((pad) => {
  pad.addEventListener('click', () => {
    triggerNote(pad.dataset.key);
  });
});
