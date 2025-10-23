#!/usr/bin/env python3
"""
Generate simple placeholder icons for the PWA
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create assets directories
os.makedirs('assets/icons', exist_ok=True)
os.makedirs('assets/screenshots', exist_ok=True)

# Icon sizes needed for PWA
icon_sizes = [32, 72, 96, 128, 144, 152, 192, 384, 512]

# Neon colors
bg_color = (10, 10, 10)  # Dark background
neon_cyan = (0, 255, 255)
neon_pink = (255, 0, 255)

def create_icon(size):
    """Create a simple icon with neon colors"""
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    # Draw a neon square (player representation)
    margin = size // 4
    square_size = size - (margin * 2)

    # Outer glow effect (multiple rectangles with decreasing opacity)
    for i in range(5, 0, -1):
        glow_margin = margin - (i * 2)
        if glow_margin >= 0:
            glow_color = tuple(int(c * (0.2 * i)) for c in neon_pink)
            draw.rectangle(
                [glow_margin, glow_margin, size - glow_margin, size - glow_margin],
                outline=glow_color,
                width=2
            )

    # Main square
    draw.rectangle(
        [margin, margin, size - margin, size - margin],
        outline=neon_pink,
        fill=None,
        width=3
    )

    # Inner cross for detail
    center = size // 2
    cross_size = size // 6
    draw.line([center - cross_size, center, center + cross_size, center], fill=neon_cyan, width=2)
    draw.line([center, center - cross_size, center, center + cross_size], fill=neon_cyan, width=2)

    return img

def create_screenshot(width, height, title):
    """Create a simple screenshot mockup"""
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # Draw grid pattern
    grid_size = 50
    for x in range(0, width, grid_size):
        draw.line([(x, 0), (x, height)], fill=(0, 255, 255, 30), width=1)
    for y in range(0, height, grid_size):
        draw.line([(0, y), (width, y)], fill=(0, 255, 255, 30), width=1)

    # Draw ground line
    ground_y = height - 100
    draw.line([(0, ground_y), (width, ground_y)], fill=neon_cyan, width=3)

    # Draw some obstacles
    for x in range(200, width, 200):
        # Spike
        draw.polygon([
            (x, ground_y),
            (x + 15, ground_y - 30),
            (x + 30, ground_y)
        ], outline=neon_pink, width=2)

    # Draw player
    player_x = 100
    player_y = ground_y - 30
    draw.rectangle(
        [player_x - 15, player_y - 30, player_x + 15, player_y],
        outline=neon_pink,
        width=3
    )

    # Add title text
    try:
        # Try to use a better font if available
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
    except:
        font = ImageFont.load_default()

    text_bbox = draw.textbbox((0, 0), title, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    text_x = (width - text_width) // 2
    text_y = 50

    # Draw text with glow effect
    for offset in [(2, 2), (-2, -2), (2, -2), (-2, 2)]:
        draw.text((text_x + offset[0], text_y + offset[1]), title, fill=(0, 100, 100), font=font)
    draw.text((text_x, text_y), title, fill=neon_cyan, font=font)

    return img

# Generate icons
print("Generating icons...")
for size in icon_sizes:
    icon = create_icon(size)
    icon.save(f'assets/icons/icon-{size}.png')
    print(f"Created icon-{size}.png")

# Special case for icon-32 (favicon)
icon_32 = create_icon(32)
icon_32.save('assets/icons/icon-32.png')

# Generate play button icon
play_icon = create_icon(96)
play_icon.save('assets/icons/play.png')

# Generate screenshots
print("\nGenerating screenshots...")
gameplay_screenshot = create_screenshot(1280, 720, "BEANIE DASH")
gameplay_screenshot.save('assets/screenshots/gameplay.png')
print("Created gameplay.png")

menu_screenshot = create_screenshot(1280, 720, "MAIN MENU")
menu_screenshot.save('assets/screenshots/menu.png')
print("Created menu.png")

print("\nAll assets generated successfully!")