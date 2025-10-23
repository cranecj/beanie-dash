#!/usr/bin/env python3
"""
Generate audio files for Beanie Dash game
Creates simple synthesized sounds for jump, death, and background music
"""

import numpy as np
import wave
import struct
import os

def create_wav_file(filename, audio_data, sample_rate=44100):
    """Create a WAV file from audio data"""
    # Normalize audio to prevent clipping
    audio_data = np.clip(audio_data, -1, 1)

    # Convert to 16-bit integer
    audio_data_int = (audio_data * 32767).astype(np.int16)

    # Write WAV file
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)   # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data_int.tobytes())

    print(f"✅ Created {filename}")

def generate_jump_sound(sample_rate=44100):
    """Generate a quick upward sweep jump sound"""
    duration = 0.2  # 200ms
    t = np.linspace(0, duration, int(sample_rate * duration))

    # Frequency sweep from 200Hz to 1000Hz
    frequency = 200 + (800 * (t / duration))

    # Quick decay envelope
    envelope = np.exp(-t * 10)

    # Generate the sound (sine wave with frequency sweep)
    sound = np.sin(2 * np.pi * frequency * t) * envelope * 0.3

    # Add a second harmonic for richness
    sound += np.sin(4 * np.pi * frequency * t) * envelope * 0.1

    return sound

def generate_death_sound(sample_rate=44100):
    """Generate a descending glitchy death sound"""
    duration = 0.8  # 800ms
    t = np.linspace(0, duration, int(sample_rate * duration))

    # Exponentially decaying frequency
    frequency = 800 * np.exp(-t * 3)

    # Decay envelope
    envelope = np.exp(-t * 2)

    # Main tone
    sound = np.sin(2 * np.pi * frequency * t) * envelope * 0.3

    # Add glitch effect (random noise bursts)
    noise = np.random.random(len(t)) - 0.5
    glitch_mask = np.random.random(len(t)) < 0.1  # 10% chance of glitch
    sound += noise * glitch_mask * envelope * 0.2

    # Add sub-bass
    sound += np.sin(2 * np.pi * frequency * 0.25 * t) * envelope * 0.2

    return sound

def generate_background_music(sample_rate=44100):
    """Generate a simple synthwave-style background loop"""
    duration = 8.0  # 8 second loop
    t = np.linspace(0, duration, int(sample_rate * duration))

    bpm = 120
    beat_duration = 60 / bpm

    # Create the music
    music = np.zeros(len(t))

    # Bass line - simple pattern
    bass_frequencies = [65, 65, 69, 69, 72, 72, 65, 65]  # Hz values
    for i, time in enumerate(t):
        beat_index = int((time / beat_duration) % 8)
        bass_freq = bass_frequencies[beat_index]

        # Bass
        music[i] += np.sin(2 * np.pi * bass_freq * time) * 0.2

        # Kick drum (every half second)
        kick_envelope = np.exp(-(time % 0.5) * 20)
        music[i] += np.sin(2 * np.pi * 55 * time) * kick_envelope * 0.3

        # Hi-hat (16th notes)
        hihat_envelope = np.exp(-(time % 0.125) * 100)
        music[i] += (np.random.random() - 0.5) * hihat_envelope * 0.05

        # Simple arpeggiator
        arp_freq = bass_freq * 4 * (1 + int((time * 8) % 4) * 0.25)
        music[i] += np.sin(2 * np.pi * arp_freq * time) * 0.05

    # Soft clipping to prevent distortion
    music = np.tanh(music * 0.8)

    return music

def main():
    # Create assets/audio directory if it doesn't exist
    os.makedirs('assets/audio', exist_ok=True)

    print("🎵 Generating audio files for Beanie Dash...")
    print("-" * 40)

    # Generate jump sound
    jump_sound = generate_jump_sound()
    create_wav_file('assets/audio/jump.wav', jump_sound)

    # Generate death sound
    death_sound = generate_death_sound()
    create_wav_file('assets/audio/death.wav', death_sound)

    # Generate background music
    background_music = generate_background_music()
    create_wav_file('assets/audio/background.wav', background_music)

    print("-" * 40)
    print("🎮 All audio files generated successfully!")
    print("\nNote: The game expects .mp3 and .ogg files.")
    print("You can convert the .wav files using:")
    print("  ffmpeg -i jump.wav jump.mp3")
    print("  ffmpeg -i jump.wav jump.ogg")
    print("\nOr use online converters like:")
    print("  https://cloudconvert.com/wav-to-mp3")
    print("  https://convertio.co/wav-mp3/")

    # Try to convert with ffmpeg if available
    try:
        import subprocess

        print("\n🔄 Attempting to convert with ffmpeg...")

        for base_name in ['jump', 'death', 'background']:
            wav_file = f'assets/audio/{base_name}.wav'
            mp3_file = f'assets/audio/{base_name}.mp3'
            ogg_file = f'assets/audio/{base_name}.ogg'

            # Convert to MP3
            result = subprocess.run(['ffmpeg', '-i', wav_file, '-y', mp3_file],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Created {mp3_file}")

            # Convert to OGG
            result = subprocess.run(['ffmpeg', '-i', wav_file, '-y', ogg_file],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Created {ogg_file}")

        print("\n✨ All conversions complete!")

    except (FileNotFoundError, subprocess.SubprocessError):
        print("\n⚠️  ffmpeg not found. Please convert WAV files manually.")

if __name__ == "__main__":
    main()