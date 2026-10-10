"use client";

// Sons de réponse (bonne / mauvaise), générés par le navigateur : aucun fichier à charger.
// À appeler depuis un clic (les navigateurs bloquent le son sans geste de l'utilisateur).
const KEY = "examplay:sound";
let ctx: AudioContext | null = null;

export function getSoundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSoundOn(value: boolean) {
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {}
}

function tone(ac: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, peak: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playFeedback(correct: boolean) {
  if (!getSoundOn()) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    if (correct) {
      // Deux notes qui montent
      tone(ctx, 660, t, 0.14, "sine", 0.18);
      tone(ctx, 880, t + 0.12, 0.24, "sine", 0.18);
    } else {
      // Deux notes graves qui descendent
      tone(ctx, 240, t, 0.18, "triangle", 0.2);
      tone(ctx, 170, t + 0.16, 0.3, "triangle", 0.2);
    }
  } catch {}
}
