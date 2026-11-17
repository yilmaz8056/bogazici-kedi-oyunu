// Boğaziçi Kedi Besleme Oyunu - Ses ve Efekt Motoru (Web Audio API)
// Mobil & Masaüstü Uyumlu - Otomatik Kullanıcı Etkileşimi ile Ses Kilidi Açma (Unlock Audio)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.purrSource = null;
    this.purrGain = null;
    this.purrNodes = null;
    this.purrActive = false;
    this.bgmTimer = null;
    this.masterGain = null;
    this.unlocked = false;

    // Mobil ilk dokunuşta ses motorunu hazırla
    this.setupUnlockListeners();
  }

  setupUnlockListeners() {
    const unlock = () => {
      this.init();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().then(() => {
          this.unlocked = true;
        });
      } else {
        this.unlocked = true;
      }
      // Dinleyicileri kaldır
      ["touchstart", "touchend", "click", "keydown"].forEach(evt => {
        document.removeEventListener(evt, unlock);
      });
    };

    ["touchstart", "touchend", "click", "keydown"].forEach(evt => {
      document.addEventListener(evt, unlock, { once: true, passive: true });
    });
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio başlatılamadı:", e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.5, this.ctx.currentTime);
    }
    if (this.isMuted && this.purrActive) {
      this.stopPurr();
    }
    return this.isMuted;
  }

  playMeow(type = "normal") {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1000, t);
      filter.Q.setValueAtTime(2.5, t);

      osc.type = "sawtooth";

      if (type === "baby" || type === "kitten") {
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.exponentialRampToValueAtTime(1100, t + 0.12);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.35);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.4);
      } else if (type === "purr_chirp") {
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.linearRampToValueAtTime(620, t + 0.08);
        osc.frequency.linearRampToValueAtTime(500, t + 0.18);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.25);
      } else if (type === "hiss") {
        this.playHiss();
        return;
      } else {
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(580, t + 0.15);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.45);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.52);
      }
    } catch (e) {}
  }

  startPurr() {
    if (this.isMuted || this.purrActive) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.15;
      }

      this.purrSource = this.ctx.createBufferSource();
      this.purrSource.buffer = noiseBuffer;
      this.purrSource.loop = true;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(140, t);

      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(26, t);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(70, t);
      lfo.connect(lowpass.frequency);

      const breathLfo = this.ctx.createOscillator();
      breathLfo.frequency.setValueAtTime(0.7, t);
      const breathGain = this.ctx.createGain();
      breathGain.gain.setValueAtTime(0.08, t);

      this.purrGain = this.ctx.createGain();
      this.purrGain.gain.setValueAtTime(0.01, t);
      this.purrGain.gain.linearRampToValueAtTime(0.18, t + 0.3);

      this.purrSource.connect(lowpass);
      lowpass.connect(this.purrGain);
      this.purrGain.connect(this.masterGain);

      this.purrSource.start(t);
      lfo.start(t);
      breathLfo.start(t);

      this.purrNodes = [this.purrSource, lfo, breathLfo];
      this.purrActive = true;
    } catch (e) {
      this.purrActive = false;
    }
  }

  stopPurr() {
    if (!this.purrActive) return;
    try {
      if (this.purrGain && this.ctx) {
        this.purrGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      }
      setTimeout(() => {
        if (this.purrNodes) {
          this.purrNodes.forEach(n => { try { n.stop(); } catch(e){} });
          this.purrNodes = null;
        }
        this.purrActive = false;
      }, 250);
    } catch (e) {
      this.purrActive = false;
    }
  }

  playCrunch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const dt = t + i * 0.11;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(280 + Math.random() * 150, dt);
        osc.frequency.exponentialRampToValueAtTime(80, dt + 0.06);

        gain.gain.setValueAtTime(0.12, dt);
        gain.gain.exponentialRampToValueAtTime(0.001, dt + 0.07);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(dt);
        osc.stop(dt + 0.08);
      }
    } catch (e) {}
  }

  playSlurp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const dt = t + i * 0.14;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(450 + i * 60, dt);
        osc.frequency.exponentialRampToValueAtTime(180, dt + 0.08);

        gain.gain.setValueAtTime(0.15, dt);
        gain.gain.exponentialRampToValueAtTime(0.001, dt + 0.09);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(dt);
        osc.stop(dt + 0.1);
      }
    } catch (e) {}
  }

  playHiss() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(2800, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.26);
    } catch (e) {}
  }

  playSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const dt = t + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, dt);

        gain.gain.setValueAtTime(0.12, dt);
        gain.gain.exponentialRampToValueAtTime(0.001, dt + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(dt);
        osc.stop(dt + 0.4);
      });
    } catch (e) {}
  }

  playCoin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, t);
      osc.frequency.setValueAtTime(1318.51, t + 0.07);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.28);
    } catch (e) {}
  }

  playCameraSnap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1400, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);

      setTimeout(() => {
        if (this.isMuted || !this.ctx) return;
        const t2 = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = "sawtooth";
        osc2.frequency.setValueAtTime(220, t2);
        osc2.frequency.linearRampToValueAtTime(320, t2 + 0.2);
        gain2.gain.setValueAtTime(0.05, t2);
        gain2.gain.linearRampToValueAtTime(0.001, t2 + 0.2);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(t2);
        osc2.stop(t2 + 0.22);
      }, 80);
    } catch (e) {}
  }

  playShipHorn() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = "sawtooth";
      osc2.type = "sawtooth";
      osc1.frequency.setValueAtTime(196, t);
      osc2.frequency.setValueAtTime(247, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.3);
      gain.gain.linearRampToValueAtTime(0.07, t + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.9);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 2.0);
      osc2.stop(t + 2.0);
    } catch (e) {}
  }

  playSeagull() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";

      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.linearRampToValueAtTime(2100, t + 0.08);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.22);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.26);
    } catch (e) {}
  }

  startBgm() {
    if (this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;

    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];

    let chordIdx = 0;
    const playChordStep = () => {
      if (!this.bgmPlaying) return;
      if (!this.isMuted && this.ctx) {
        try {
          const chord = chords[chordIdx];
          const t = this.ctx.currentTime;
          chord.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, t);

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(550, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.022, t + 0.6);
            gain.gain.linearRampToValueAtTime(0.015, t + 2.4);
            gain.gain.exponentialRampToValueAtTime(0.0005, t + 3.8);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 4.0);
          });

          if (Math.random() < 0.25) {
            setTimeout(() => this.playSeagull(), 1200);
          } else if (Math.random() < 0.12) {
            setTimeout(() => this.playShipHorn(), 1800);
          }
        } catch (e) {}
      }

      chordIdx = (chordIdx + 1) % chords.length;
      this.bgmTimer = setTimeout(playChordStep, 4000);
    };

    playChordStep();
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.soundEngine = new SoundEngine();
