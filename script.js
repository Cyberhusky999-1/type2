// This beginner-friendly drum machine uses the Web Audio API.
// Every sound is generated in the browser, so there are no audio files to download.
const pads = document.querySelectorAll('.pad');
const padByKey = new Map([...pads].map((pad) => [pad.dataset.key, pad]));

let audioContext;

// Browsers require audio to start after a user gesture. A keypress or click is enough.
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

// A helper that creates a short volume envelope so sounds do not click or pop.
function createEnvelope(context, startVolume, duration) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(startVolume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  gain.connect(context.destination);
  return gain;
}

function playKick(context) {
  const oscillator = context.createOscillator();
  const envelope = createEnvelope(context, 1, 0.45);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(150, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(45, context.currentTime + 0.45);
  oscillator.connect(envelope);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.45);
}

function playSnare(context) {
  playNoise(context, 0.22, 900, 0.85);

  const oscillator = context.createOscillator();
  const envelope = createEnvelope(context, 0.35, 0.16);
  oscillator.type = 'triangle';
  oscillator.frequency.value = 180;
  oscillator.connect(envelope);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.16);
}

function playNoise(context, duration, filterFrequency, volume) {
  const bufferSize = context.sampleRate * duration;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = createEnvelope(context, volume, duration);

  noise.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.value = filterFrequency;
  noise.connect(filter);
  filter.connect(envelope);
  noise.start();
}

function playClosedHat(context) {
  playNoise(context, 0.08, 7000, 0.45);
}

function playOpenHat(context) {
  playNoise(context, 0.45, 6000, 0.38);
}

function playTom(context) {
  const oscillator = context.createOscillator();
  const envelope = createEnvelope(context, 0.75, 0.35);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(220, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(95, context.currentTime + 0.35);
  oscillator.connect(envelope);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.35);
}

function playClap(context) {
  // Three tiny noise bursts make a hand-clap style sound.
  [0, 0.045, 0.09].forEach((delay) => {
    const duration = 0.08;
    const bufferSize = context.sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = createEnvelope(context, 0.35, duration + delay);

    noise.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    noise.connect(filter);
    filter.connect(envelope);
    noise.start(context.currentTime + delay);
  });
}

const sounds = {
  a: playKick,
  s: playSnare,
  d: playClosedHat,
  f: playOpenHat,
  g: playTom,
  h: playClap,
};

function flashPad(pad) {
  pad.classList.add('active');
  window.setTimeout(() => pad.classList.remove('active'), 120);
}

function playPad(key) {
  const normalizedKey = key.toLowerCase();
  const pad = padByKey.get(normalizedKey);
  const sound = sounds[normalizedKey];

  if (!pad || !sound) {
    return;
  }

  sound(getAudioContext());
  flashPad(pad);
}

window.addEventListener('keydown', (event) => {
  // Ignore repeated keydown events while a key is held down.
  if (event.repeat) {
    return;
  }

  playPad(event.key);
});

pads.forEach((pad) => {
  pad.addEventListener('click', () => playPad(pad.dataset.key));
});
