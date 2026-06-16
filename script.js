// Map keyboard keys to drum sound names. Beginners can add new pads by
// adding a matching button in HTML and a new entry in this object.
const drumSounds = {
  A: 'kick',
  S: 'snare',
  D: 'hiHat',
  F: 'lowTom',
  G: 'clap',
  H: 'cymbal',
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

// Helper function that creates a quick volume envelope. Envelopes keep sounds
// smooth by fading them out instead of stopping them abruptly.
function createEnvelope(context, startVolume, endTime) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(startVolume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + endTime);
  gain.connect(context.destination);
  return gain;
}

function playKick(context) {
  const oscillator = context.createOscillator();
  const gain = createEnvelope(context, 1, 0.5);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(140, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(45, context.currentTime + 0.5);
  oscillator.connect(gain);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.5);
}

function playSnare(context) {
  const noiseLength = context.sampleRate * 0.2;
  const buffer = context.createBuffer(1, noiseLength, context.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < noiseLength; i += 1) {
    samples[i] = Math.random() * 2 - 1;
  }

  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = createEnvelope(context, 0.55, 0.18);

  noise.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.value = 1200;
  noise.connect(filter).connect(gain);
  noise.start();
}

function playHiHat(context) {
  const noiseLength = context.sampleRate * 0.08;
  const buffer = context.createBuffer(1, noiseLength, context.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < noiseLength; i += 1) {
    samples[i] = Math.random() * 2 - 1;
  }

  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = createEnvelope(context, 0.35, 0.06);

  noise.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.value = 7000;
  noise.connect(filter).connect(gain);
  noise.start();
}

function playLowTom(context) {
  const oscillator = context.createOscillator();
  const gain = createEnvelope(context, 0.75, 0.38);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(180, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(80, context.currentTime + 0.38);
  oscillator.connect(gain);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.38);
}

function playClap(context) {
  // A clap is simulated with three very short filtered noise bursts.
  [0, 0.035, 0.07].forEach((delay) => {
    const noiseLength = context.sampleRate * 0.06;
    const buffer = context.createBuffer(1, noiseLength, context.sampleRate);
    const samples = buffer.getChannelData(0);

    for (let i = 0; i < noiseLength; i += 1) {
      samples[i] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = createEnvelope(context, 0.22, delay + 0.09);

    noise.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    noise.connect(filter).connect(gain);
    noise.start(context.currentTime + delay);
  });
}

function playCymbal(context) {
  const noiseLength = context.sampleRate * 0.9;
  const buffer = context.createBuffer(1, noiseLength, context.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < noiseLength; i += 1) {
    samples[i] = Math.random() * 2 - 1;
  }

  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = createEnvelope(context, 0.28, 0.85);

  noise.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.value = 4500;
  noise.connect(filter).connect(gain);
  noise.start();
}

const soundPlayers = {
  kick: playKick,
  snare: playSnare,
  hiHat: playHiHat,
  lowTom: playLowTom,
  clap: playClap,
  cymbal: playCymbal,
};

function lightPad(key) {
  const pad = document.querySelector(`[data-key="${key}"]`);

  if (!pad) {
    return;
  }

  pad.classList.add('is-active');
  window.setTimeout(() => {
    pad.classList.remove('is-active');
  }, 140);
}

function triggerDrum(key) {
  const upperKey = key.toUpperCase();
  const soundName = drumSounds[upperKey];

  if (!soundName) {
    return;
  }

  const context = getAudioContext();
  soundPlayers[soundName](context);
  lightPad(upperKey);
}

// Keyboard events make the drums playable immediately without clicking a pad.
document.addEventListener('keydown', (event) => {
  // Ignore held-down repeats so one press creates one clean drum hit.
  if (event.repeat) {
    return;
  }

  triggerDrum(event.key);
});

// Clicking is optional, but it helps mouse and touch users try the app too.
document.querySelectorAll('.pad').forEach((pad) => {
  pad.addEventListener('click', () => {
    triggerDrum(pad.dataset.key);
  });
});
