#!/usr/bin/env python3
"""
Generate audio files for Beanie Dash game (no external dependencies)
Creates simple synthesized sounds for jump, death, and background music
"""

import wave
import struct
import math
import random
import os

def create_wav_file(filename, audio_data, sample_rate=44100):
    """Create a WAV file from audio data"""
    # Open WAV file
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)   # 16-bit
        wav_file.setframerate(sample_rate)

        # Convert float audio data to 16-bit integers
        frames = []
        for sample in audio_data:
            # Clip to [-1, 1] range
            sample = max(-1, min(1, sample))
            # Convert to 16-bit integer
            int_sample = int(sample * 32767)
            # Pack as bytes
            frames.append(struct.pack('<h', int_sample))

        wav_file.writeframes(b''.join(frames))

    print(f"✅ Created {filename}")

def generate_jump_sound(sample_rate=44100):
    """Generate a quick upward sweep jump sound"""
    duration = 0.2  # 200ms
    num_samples = int(sample_rate * duration)
    audio_data = []

    for i in range(num_samples):
        t = i / sample_rate

        # Frequency sweep from 200Hz to 1000Hz
        frequency = 200 + (800 * (i / num_samples))

        # Quick decay envelope
        envelope = math.exp(-t * 10)

        # Generate the sound (sine wave with frequency sweep)
        sample = math.sin(2 * math.pi * frequency * t) * envelope * 0.3

        # Add a second harmonic for richness
        sample += math.sin(4 * math.pi * frequency * t) * envelope * 0.1

        audio_data.append(sample)

    return audio_data

def generate_death_sound(sample_rate=44100):
    """Generate a descending glitchy death sound"""
    duration = 0.8  # 800ms
    num_samples = int(sample_rate * duration)
    audio_data = []

    for i in range(num_samples):
        t = i / sample_rate

        # Exponentially decaying frequency
        frequency = 800 * math.exp(-t * 3)

        # Decay envelope
        envelope = math.exp(-t * 2)

        # Main tone
        sample = math.sin(2 * math.pi * frequency * t) * envelope * 0.3

        # Add glitch effect (random noise bursts)
        if random.random() < 0.1:  # 10% chance of glitch
            sample += (random.random() - 0.5) * envelope * 0.2

        # Add sub-bass
        sample += math.sin(2 * math.pi * frequency * 0.25 * t) * envelope * 0.2

        audio_data.append(sample)

    return audio_data

def generate_background_music(sample_rate=44100):
    """Generate a simple synthwave-style background loop"""
    duration = 8.0  # 8 second loop
    num_samples = int(sample_rate * duration)
    audio_data = []

    bpm = 120
    beat_duration = 60 / bpm

    # Bass line pattern (frequencies in Hz)
    bass_frequencies = [65, 65, 69, 69, 72, 72, 65, 65]

    for i in range(num_samples):
        time = i / sample_rate

        # Determine current beat
        beat_index = int((time / beat_duration) % 8)
        bass_freq = bass_frequencies[beat_index]

        # Bass
        sample = math.sin(2 * math.pi * bass_freq * time) * 0.2

        # Kick drum (every half second)
        kick_envelope = math.exp(-(time % 0.5) * 20)
        sample += math.sin(2 * math.pi * 55 * time) * kick_envelope * 0.3

        # Hi-hat (16th notes)
        hihat_envelope = math.exp(-(time % 0.125) * 100)
        sample += (random.random() - 0.5) * hihat_envelope * 0.05

        # Simple arpeggiator
        arp_freq = bass_freq * 4 * (1 + int((time * 8) % 4) * 0.25)
        sample += math.sin(2 * math.pi * arp_freq * time) * 0.05

        # Soft clipping to prevent distortion
        sample = math.tanh(sample * 0.8)

        audio_data.append(sample)

    return audio_data

def convert_to_web_audio_formats():
    """Try to convert WAV files to MP3 and OGG using ffmpeg"""
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
            else:
                print(f"⚠️  Failed to create {mp3_file}")

            # Convert to OGG
            result = subprocess.run(['ffmpeg', '-i', wav_file, '-y', ogg_file],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Created {ogg_file}")
            else:
                print(f"⚠️  Failed to create {ogg_file}")

        print("\n✨ Conversion complete!")
        return True

    except FileNotFoundError:
        print("\n⚠️  ffmpeg not found.")
        return False

def main():
    # Create assets/audio directory if it doesn't exist
    os.makedirs('assets/audio', exist_ok=True)

    print("🎵 Generating audio files for Beanie Dash...")
    print("-" * 40)

    # Generate jump sound
    print("Creating jump sound...")
    jump_sound = generate_jump_sound()
    create_wav_file('assets/audio/jump.wav', jump_sound)

    # Generate death sound
    print("Creating death sound...")
    death_sound = generate_death_sound()
    create_wav_file('assets/audio/death.wav', death_sound)

    # Generate background music
    print("Creating background music...")
    background_music = generate_background_music()
    create_wav_file('assets/audio/background.wav', background_music)

    print("-" * 40)
    print("🎮 All WAV files generated successfully!")

    # Try to convert to web-friendly formats
    if not convert_to_web_audio_formats():
        print("\nTo convert WAV files to MP3/OGG, you can:")
        print("1. Install ffmpeg: brew install ffmpeg")
        print("2. Run the conversion commands:")
        print("   ffmpeg -i assets/audio/jump.wav assets/audio/jump.mp3")
        print("   ffmpeg -i assets/audio/jump.wav assets/audio/jump.ogg")
        print("\n3. Or use online converters:")
        print("   https://cloudconvert.com/wav-to-mp3")
        print("   https://convertio.co/wav-mp3/")

        print("\n💡 Note: The game will still work with WAV files,")
        print("   but MP3/OGG files are smaller and load faster.")

if __name__ == "__main__":
    main()