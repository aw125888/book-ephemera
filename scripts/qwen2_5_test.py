from pathlib import Path
import torch
from transformers import AutoProcessor, Qwen3VLForConditionalGeneration

ROOT = Path(__file__).resolve().parent.parent

# Use the exact filename that exists on disk.
# If your file has a weird name with punctuation, rename it to something normal like 0001.jpeg.
image_path = ROOT / "data" / "images" / "images:0001.jpeg"

model_id = "Qwen/Qwen3-VL-8B-Thinking"

prompt = """
Analyze this image and output its semantic fingerprint in around 50 words.
Use only keywords and short descriptive phrases (1–6 words each).
Focus on semantic concepts, colors, atmosphere, objects, emotions, themes,
symbolism, textures, and artistic style. Use unique and specific vocabulary when possible. Example: input of a blonde woman smelling flowers, output: "Feminine chic, pink silk headscarf, perched sunglasses, vibrant tulip bouquet, sensory enjoyment, outdoor cafe setting, soft daylight, blonde waves, glass vase, urban romance, candid snapshot, pastel palette, social atmosphere, background figures, floral appreciation, effortless style, springtime vibe, intimate moment, city living, nostalgic aesthetic, delicate fragrance, relaxed elegance, blurred background depth, warm interaction, iconic pop culture style.", Example 2: input of a cat, output: "Abyssinian cat portrait, surprised expression, wide golden-yellow eyes, open mouth, shocked look, ruddy ticked coat, warm brown fur, alert pointed ears, prominent white whiskers, stark white background, studio photography, clean isolation, direct frontal gaze, comical startled expression, fine fur texture, symmetrical composition, feline close-up, expressive face, warm amber tones, professional pet portrait, dumbfounded cat, humorous animal expression, crisp detail, minimalist backdrop"
"""

model = Qwen3VLForConditionalGeneration.from_pretrained(
    model_id,
    torch_dtype="auto",
    device_map="auto",
    # attn_implementation="sdpa",
)
processor = AutoProcessor.from_pretrained(model_id)

messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": str(image_path)},
            {"type": "text", "text": prompt},
        ],
    }
]

inputs = processor.apply_chat_template(
    messages,
    tokenize=True,
    add_generation_prompt=True,
    return_dict=True,
    return_tensors="pt",
)

inputs.pop("token_type_ids", None)
inputs = inputs.to(model.device)

generated_ids = model.generate(**inputs, max_new_tokens=96, temperature=0.9)

trimmed = [
    out_ids[len(in_ids):]
    for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
]

print(
    processor.batch_decode(
        trimmed,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=False,
    )[0]
)