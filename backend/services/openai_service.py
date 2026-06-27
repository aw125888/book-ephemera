from pathlib import Path
import base64
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

IMAGE_PROMPT = """
Analyze this image and output its semantic fingerprint in around 50 words.
Use only keywords and short descriptive phrases (1–6 words each).
Focus on semantic concepts, colors, atmosphere, objects, emotions, themes,
symbolism, textures, and artistic style.
Use unique and specific vocabulary when possible.

One good output example is this:
Luminous screen-glow, circadian melancholy, frosted-glass UI, translucent layering, deep-space obsidian, bioluminescent accents, algorithmic precision, tactile haptic illusion, serene digital minimalism, ephemeral notifications, soft-focus bokeh, velvet shadows, crystalline typography, quiet technological solitude, ambient cybernetic hum, pastel gradient horizons, wistful connectivity, sterile yet intimate, pixel-perfect rendering, nocturnal introspection."

Notice the style.
Do not copy the content.
Your output must be based only on the input image.
"""


def _image_to_data_url(image_path: str) -> str:
    path = Path(image_path)
    suffix = path.suffix.lower()

    mime = "image/jpeg"
    if suffix == ".png":
        mime = "image/png"
    elif suffix == ".webp":
        mime = "image/webp"
    elif suffix == ".gif":
        mime = "image/gif"

    encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:{mime};base64,{encoded}"


def describe_image_semantic_fingerprint(image_path: str) -> str:
    data_url = _image_to_data_url(image_path)

    response = client.responses.create(
        model="gpt-5-mini",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": IMAGE_PROMPT},
                    {"type": "input_image", "image_url": data_url},
                ],
            }
        ],
    )

    return response.output_text.strip()