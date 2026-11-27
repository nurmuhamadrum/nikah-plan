import type { InvitationMusicPreset } from "@/types/database";

export interface MusicPresetMeta {
  id: InvitationMusicPreset;
  name: string;
  subtitle: string;
  mood: string;
}

export const INVITATION_MUSIC_PRESETS: MusicPresetMeta[] = [
  {
    id: "ROMANTIC_PIANO",
    name: "Romantic Piano & Pad",
    subtitle: "Arpeggio piano lembut & pad hangat bernuansa romantis",
    mood: "Cocok untuk semua tema",
  },
  {
    id: "MUSIC_BOX",
    name: "Celesta Music Box",
    subtitle: "Dentingan kotak musik manis & syahdu",
    mood: "Sakura, Polaroid & Editorial",
  },
  {
    id: "HARP_GARDEN",
    name: "Botanical Harp & Breeze",
    subtitle: "Petikan harpa pentatonik lembut yang menenangkan",
    mood: "Botanical Sage & Terracotta",
  },
  {
    id: "JAVANESE_AMBIENT",
    name: "Soft Pelog Heritage",
    subtitle: "Nuansa gamelan pelog lembut modern & khidmat",
    mood: "Javanese Heritage & Classic Gold",
  },
  {
    id: "CUSTOM",
    name: "URL Audio Kustom (.mp3)",
    subtitle: "Gunakan tautan file musik pilihan Anda sendiri",
    mood: "Lagu pilihan pribadi",
  },
  {
    id: "OFF",
    name: "Tanpa Musik",
    subtitle: "Undangan tampil hening tanpa backsound",
    mood: "Minimalis",
  },
];

export function getMusicPresetMeta(
  preset: InvitationMusicPreset | null | undefined
): MusicPresetMeta {
  return (
    INVITATION_MUSIC_PRESETS.find((p) => p.id === preset) ??
    INVITATION_MUSIC_PRESETS[0]
  );
}

export interface AudioUrlInspection {
  status: "empty" | "ok" | "convertible" | "unsupported";
  convertedUrl?: string;
  provider?: "Dropbox" | "Google Drive";
  message?: string;
}

/**
 * Menganalisis URL audio kustom yang ditempel pengguna:
 * - Mendeteksi link streaming halaman web (YouTube/Spotify/SoundCloud/TikTok) yang tidak bisa diputar langsung
 * - Mendeteksi link share Dropbox (?dl=0) & Google Drive (/file/d/ID/view) agar bisa dikonversi 1-klik ke direct URL
 */
export function inspectDirectAudioUrl(rawUrl: string): AudioUrlInspection {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { status: "empty" };

  const lower = trimmed.toLowerCase();
  if (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("spotify.com") ||
    lower.includes("soundcloud.com") ||
    lower.includes("tiktok.com")
  ) {
    return {
      status: "unsupported",
      message:
        "Tautan YouTube, Spotify, SoundCloud, atau TikTok adalah halaman web (bukan file audio langsung) sehingga tidak bisa diputar oleh browser. Gunakan file .mp3 dari Dropbox atau Catbox.moe.",
    };
  }

  // Dropbox: ubah dl=0 / dl=1 atau tambahkan raw=1
  if (lower.includes("dropbox.com/") && !lower.includes("raw=1")) {
    let converted = trimmed;
    if (/[?&]dl=[01]/.test(converted)) {
      converted = converted.replace(/([?&])dl=[01]/, "$1raw=1");
    } else {
      converted += converted.includes("?") ? "&raw=1" : "?raw=1";
    }
    return {
      status: "convertible",
      provider: "Dropbox",
      convertedUrl: converted,
      message:
        "Tautan Dropbox terdeteksi masih dalam mode pratinjau (dl=0). Ubah ke raw=1 agar bisa diputar langsung.",
    };
  }

  // Google Drive: ekstrak FILE_ID dari /file/d/ID atau ?id=ID
  if (lower.includes("drive.google.com/")) {
    const matchPath = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const matchQuery = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = matchPath?.[1] ?? matchQuery?.[1];
    if (fileId) {
      return {
        status: "convertible",
        provider: "Google Drive",
        convertedUrl: `https://docs.google.com/uc?export=open&id=${fileId}`,
        message:
          "Tautan Google Drive terdeteksi dalam mode pratinjau. Ubah ke tautan langsung (pastikan akses file sudah 'Siapa saja yang memiliki tautan').",
      };
    }
  }

  return { status: "ok" };
}

// Frekuensi nada (Hz)
const NOTE: Record<string, number> = {
  C3: 130.81,
  D3: 146.83,
  Eb3: 155.56,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  Bb3: 233.08,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  Eb5: 622.25,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  Bb5: 932.33,
  B5: 987.77,
  C6: 1046.5,
};

interface Composition {
  stepMs: number;
  chords: string[][];
  melody: (string | null)[];
  oscType: OscillatorType;
  padType: OscillatorType;
  filterHz: number;
  noteDecay: number;
  noteAttack: number;
  overtoneRatio?: number;
  overtoneGain?: number;
}

const COMPOSITIONS: Record<
  Exclude<InvitationMusicPreset, "OFF" | "CUSTOM">,
  Composition
> = {
  ROMANTIC_PIANO: {
    stepMs: 620,
    chords: [
      ["F3", "A3", "C4"],
      ["D3", "A3", "F4"],
      ["Bb3", "D4", "F4"],
      ["C3", "G3", "E4"],
    ],
    melody: [
      "C5", "A4", "F4", "A4", "C5", "D5", "C5", null,
      "A4", "F4", "D4", "F4", "A4", "C5", "A4", null,
      "Bb4", "F4", "D4", "F4", "Bb4", "C5", "D5", null,
      "C5", "G4", "E4", "G4", "B4", "C5", "G4", null,
    ],
    oscType: "triangle",
    padType: "sine",
    filterHz: 1500,
    noteDecay: 2.4,
    noteAttack: 0.035,
    overtoneRatio: 2,
    overtoneGain: 0.14,
  },
  MUSIC_BOX: {
    stepMs: 540,
    chords: [
      ["C3", "G3", "E4"],
      ["A3", "E4", "C5"],
      ["F3", "C4", "A4"],
      ["G3", "D4", "B4"],
    ],
    melody: [
      "E5", "G5", "C6", "B5", "G5", "E5", "G5", null,
      "E5", "A5", "C6", "A5", "E5", "C5", "E5", null,
      "F5", "A5", "C6", "A5", "F5", "C5", "A5", null,
      "G5", "B5", "D5", "G5", "B5", "A5", "G5", null,
    ],
    oscType: "sine",
    padType: "sine",
    filterHz: 2400,
    noteDecay: 2.8,
    noteAttack: 0.015,
    overtoneRatio: 3,
    overtoneGain: 0.12,
  },
  HARP_GARDEN: {
    stepMs: 560,
    chords: [
      ["G3", "B3", "D4"],
      ["E3", "B3", "G4"],
      ["C3", "G3", "E4"],
      ["D3", "A3", "F4"],
    ],
    melody: [
      "D5", "G5", "B5", "G5", "D5", "B4", "G4", "B4",
      "E5", "G5", "B5", "A5", "G5", "E5", "B4", null,
      "C5", "E5", "G5", "A5", "G5", "E5", "C5", "E5",
      "D5", "G5", "A5", "G5", "D5", "A4", "D5", null,
    ],
    oscType: "triangle",
    padType: "sine",
    filterHz: 1850,
    noteDecay: 2.6,
    noteAttack: 0.02,
    overtoneRatio: 2,
    overtoneGain: 0.18,
  },
  JAVANESE_AMBIENT: {
    stepMs: 780,
    chords: [
      ["D3", "A3", "D4"],
      ["Eb3", "Bb3", "Eb4"],
      ["G3", "D4", "G4"],
      ["A3", "D4", "A4"],
    ],
    // Skala Pelog Nem: D - Eb - G - A - Bb
    melody: [
      "D5", null, "Eb5", "D5", "Bb4", null, "A4", null,
      "G4", "A4", "Bb4", null, "Eb5", "D5", "Bb4", null,
      "G4", null, "Bb4", "A4", "G4", "Eb4", "D4", null,
      "A4", "Bb4", "D5", null, "A4", "G4", "D4", null,
    ],
    oscType: "sine",
    padType: "sine",
    filterHz: 1450,
    noteDecay: 3.4,
    noteAttack: 0.03,
    overtoneRatio: 2.756, // karakteristik chime / metalofon lembut
    overtoneGain: 0.08,
  },
};

/**
 * Engine pemutar musik ambient pernikahan:
 * - Mendukung 4 preset instrumen romantis berbasis Web Audio API (0 dependency, 100% offline-ready)
 * - Mendukung custom audio URL (.mp3/.m4a/.ogg) dengan fade-in halus
 */
export class AmbientMusicPlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private stepIdx = 0;

  private audioEl: HTMLAudioElement | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;

  private playing = false;
  private activePreset: InvitationMusicPreset = "ROMANTIC_PIANO";
  private activeUrl: string | null = null;

  public isPlaying(): boolean {
    return this.playing;
  }

  public async start(
    preset: InvitationMusicPreset,
    customUrl?: string | null
  ): Promise<boolean> {
    if (preset === "OFF") {
      this.stop();
      return false;
    }

    // Jika preset berubah saat sedang berputar, hentikan dulu
    if (
      this.playing &&
      (this.activePreset !== preset || this.activeUrl !== (customUrl ?? null))
    ) {
      this.stop();
    }

    if (this.playing) return true;

    this.activePreset = preset;
    this.activeUrl = customUrl ?? null;

    if (preset === "CUSTOM" && customUrl?.trim()) {
      return this.startCustomAudio(customUrl.trim());
    }

    const synthPreset: Exclude<InvitationMusicPreset, "OFF" | "CUSTOM"> =
      preset === "CUSTOM" ? "ROMANTIC_PIANO" : preset;

    return this.startWebAudio(synthPreset);
  }

  private async startCustomAudio(url: string): Promise<boolean> {
    try {
      if (typeof window === "undefined") return false;
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.02;
      await audio.play();

      this.audioEl = audio;
      this.playing = true;

      // Fade-in volume halus ke 0.55
      let vol = 0.02;
      this.fadeTimer = setInterval(() => {
        if (!this.audioEl) return;
        vol = Math.min(0.55, vol + 0.04);
        this.audioEl.volume = vol;
        if (vol >= 0.55 && this.fadeTimer) {
          clearInterval(this.fadeTimer);
          this.fadeTimer = null;
        }
      }, 90);

      return true;
    } catch {
      // Fallback ke preset piano romantis jika URL kustom gagal dimuat
      return this.startWebAudio("ROMANTIC_PIANO");
    }
  }

  private async startWebAudio(
    preset: Exclude<InvitationMusicPreset, "OFF" | "CUSTOM">
  ): Promise<boolean> {
    if (typeof window === "undefined") return false;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      if (!this.ctx || this.ctx.state === "closed") {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }

      const comp = COMPOSITIONS[preset];
      const now = this.ctx.currentTime;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(comp.filterHz, now);
      filter.Q.setValueAtTime(0.7, now);

      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.linearRampToValueAtTime(0.24, now + 1.4);

      // Subtle warm delay untuk efek ruang aula lembut
      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.setValueAtTime(0.36, now);
      const feedback = this.ctx.createGain();
      feedback.gain.setValueAtTime(0.25, now);
      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = "lowpass";
      delayFilter.frequency.setValueAtTime(1100, now);

      filter.connect(master);
      filter.connect(delay);
      delay.connect(delayFilter);
      delayFilter.connect(feedback);
      feedback.connect(delay);
      delayFilter.connect(master);
      master.connect(this.ctx.destination);

      this.filterNode = filter;
      this.masterGain = master;
      this.stepIdx = 0;
      this.playing = true;

      const triggerStep = () => {
        if (!this.ctx || !this.filterNode || !this.playing) return;
        const t = this.ctx.currentTime;

        // Setiap 8 ketukan, mainkan pad akor hangat
        if (this.stepIdx % 8 === 0) {
          const chordIdx = Math.floor(this.stepIdx / 8) % comp.chords.length;
          const chord = comp.chords[chordIdx];
          for (const noteName of chord) {
            const freq = NOTE[noteName];
            if (!freq) continue;
            this.playPadVoice(freq, t, (comp.stepMs * 8) / 1000, comp.padType);
          }
        }

        // Mainkan melodi utama
        const melNote = comp.melody[this.stepIdx % comp.melody.length];
        if (melNote && NOTE[melNote]) {
          this.playMelodyVoice(NOTE[melNote], t, comp);
        }

        this.stepIdx += 1;
      };

      triggerStep();
      this.timer = setInterval(triggerStep, comp.stepMs);
      return true;
    } catch {
      this.playing = false;
      return false;
    }
  }

  private playPadVoice(
    freq: number,
    startTime: number,
    durationSec: number,
    type: OscillatorType
  ) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.075, startTime + 1.1);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + durationSec + 0.9
    );

    osc.connect(gain);
    gain.connect(this.filterNode);
    osc.start(startTime);
    osc.stop(startTime + durationSec + 1.0);
  }

  private playMelodyVoice(
    freq: number,
    startTime: number,
    comp: Composition
  ) {
    if (!this.ctx || !this.filterNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = comp.oscType;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.18, startTime + comp.noteAttack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + comp.noteDecay);

    osc.connect(gain);
    gain.connect(this.filterNode);
    osc.start(startTime);
    osc.stop(startTime + comp.noteDecay + 0.08);

    // Tambahan overtone tipis agar suara lebih organik
    if (comp.overtoneRatio && comp.overtoneGain) {
      const over = this.ctx.createOscillator();
      const overGain = this.ctx.createGain();
      over.type = "sine";
      over.frequency.setValueAtTime(freq * comp.overtoneRatio, startTime);

      overGain.gain.setValueAtTime(0.0001, startTime);
      overGain.gain.linearRampToValueAtTime(
        comp.overtoneGain,
        startTime + comp.noteAttack
      );
      overGain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + comp.noteDecay * 0.65
      );

      over.connect(overGain);
      overGain.connect(this.filterNode);
      over.start(startTime);
      over.stop(startTime + comp.noteDecay * 0.7);
    }
  }

  public stop(): void {
    this.playing = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }

    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = "";
      this.audioEl = null;
    }

    if (this.masterGain && this.ctx && this.ctx.state !== "closed") {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(
          Math.max(0.0001, this.masterGain.gain.value),
          now
        );
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      } catch {
        // abaikan jika context sudah ditutup
      }
    }
    this.masterGain = null;
    this.filterNode = null;
  }

  public destroy(): void {
    this.stop();
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}
