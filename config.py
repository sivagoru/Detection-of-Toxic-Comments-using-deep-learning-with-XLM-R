import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "model", "toxic_xlmr_model")

MAX_LENGTH = 128

TOXIC_THRESHOLD = 0.5