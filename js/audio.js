/* SCAM OS - tiny WebAudio synth for retro system sounds (no assets needed). */
(function () {
  const SO = window.SO;
  let ctx = null;
  let ringTimer = null;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function vol() {
    const s = SO.save.d.settings;
    return s.muted ? 0 : s.volume;
  }
  // notes: [freq, startOffset, duration, type, gain]
  function tone(notes) {
    const a = ac();
    const v = vol();
    if (!a || v <= 0) return;
    const t0 = a.currentTime;
    notes.forEach(([f, off, dur, type, g]) => {
      const o = a.createOscillator();
      const gn = a.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(f, t0 + off);
      const peak = (g == null ? 0.15 : g) * v;
      gn.gain.setValueAtTime(0.0001, t0 + off);
      gn.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + off + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, t0 + off + dur);
      o.connect(gn); gn.connect(a.destination);
      o.start(t0 + off); o.stop(t0 + off + dur + 0.02);
    });
  }

  const SOUNDS = {
    click: () => tone([[880, 0, 0.04, 'square', 0.06]]),
    error: () => tone([[220, 0, 0.12, 'square', 0.15], [165, 0.12, 0.2, 'square', 0.15]]),
    ding: () => tone([[1175, 0, 0.12, 'triangle', 0.2], [1568, 0.1, 0.3, 'triangle', 0.2]]),
    notify: () => tone([[784, 0, 0.1, 'triangle', 0.2], [988, 0.1, 0.1, 'triangle', 0.2], [1319, 0.2, 0.25, 'triangle', 0.2]]),
    cash: () => tone([[1568, 0, 0.07, 'square', 0.1], [2093, 0.07, 0.07, 'square', 0.1], [2637, 0.14, 0.2, 'square', 0.1]]),
    win: () => tone([[523, 0, 0.12, 'square', 0.12], [659, 0.12, 0.12, 'square', 0.12], [784, 0.24, 0.12, 'square', 0.12], [1047, 0.36, 0.35, 'square', 0.12]]),
    lose: () => tone([[392, 0, 0.18, 'sawtooth', 0.12], [330, 0.18, 0.18, 'sawtooth', 0.12], [262, 0.36, 0.4, 'sawtooth', 0.12]]),
    hang: () => tone([[480, 0, 0.12, 'square', 0.1], [380, 0.14, 0.12, 'square', 0.1]]),
    boot: () => tone([[392, 0, 0.3, 'triangle', 0.2], [523, 0.25, 0.3, 'triangle', 0.2], [659, 0.5, 0.3, 'triangle', 0.2], [784, 0.75, 0.3, 'triangle', 0.2], [1047, 1.0, 0.7, 'triangle', 0.2]]),
    ring: () => tone([[440, 0, 0.18, 'sine', 0.2], [480, 0, 0.18, 'sine', 0.2], [440, 0.25, 0.18, 'sine', 0.2], [480, 0.25, 0.18, 'sine', 0.2]]),
    alarm: () => tone([[880, 0, 0.15, 'sawtooth', 0.15], [660, 0.15, 0.15, 'sawtooth', 0.15], [880, 0.3, 0.15, 'sawtooth', 0.15], [660, 0.45, 0.15, 'sawtooth', 0.15]]),
    blip: () => tone([[1200, 0, 0.03, 'square', 0.05]])
  };

  SO.audio = {
    play(name) { try { (SOUNDS[name] || SOUNDS.click)(); } catch (e) {} },
    unlock() { ac(); },
    startRing() {
      this.stopRing();
      this.play('ring');
      ringTimer = setInterval(() => this.play('ring'), 1600);
    },
    stopRing() { if (ringTimer) { clearInterval(ringTimer); ringTimer = null; } },
    setVolume(v) { SO.save.d.settings.volume = v; SO.save.save(); },
    toggleMute() { const s = SO.save.d.settings; s.muted = !s.muted; SO.save.save(); return s.muted; }
  };
  document.addEventListener('pointerdown', () => ac(), { once: true });
})();
