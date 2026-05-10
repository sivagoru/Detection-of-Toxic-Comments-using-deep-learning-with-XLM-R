import torch
import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from deep_translator import GoogleTranslator

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model", "toxic_xlmr_model")

# Load tokenizer and model
tokenizer = AutoTokenizer.from_pretrained("xlm-roberta-base")
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

LABELS = [
    "toxic",
    "severe_toxic",
    "obscene",
    "threat",
    "insult",
    "identity_hate"
]


# --------------------------
# TRANSLATE COMMENT
# --------------------------
def translate_to_english(text):

    try:
        translated = GoogleTranslator(source="auto", target="en").translate(text)
        return translated
    except:
        return text


# --------------------------
# PREDICT TOXICITY
# --------------------------
def predict_toxicity(text, context=""):

    # Step 1: Translate comment
    translated_text = translate_to_english(text)

    # Step 2: Tokenize translated text (with context if provided)
    if context:
        inputs = tokenizer(
            context,
            translated_text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=128
        )
    else:
        inputs = tokenizer(
            translated_text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=128
        )

    # Step 3: Model inference
    with torch.no_grad():
        outputs = model(**inputs)

    scores = torch.sigmoid(outputs.logits)[0].tolist()

    results = {LABELS[i]: float(scores[i]) for i in range(len(LABELS))}

    label = "toxic" if max(results.values()) > 0.5 else "safe"

    return {
        "original_comment": text,
        "translated_comment": translated_text,
        "label": label,
        "scores": results
    }