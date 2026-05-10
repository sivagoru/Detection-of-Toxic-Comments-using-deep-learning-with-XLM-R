from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from utils.predictor import predict_toxicity
from deep_translator import GoogleTranslator
import time
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

comment_results = []

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
# NORMALIZE LABEL
# --------------------------
def normalize_label(label):

    if label is None:
        return "safe"

    label = str(label).strip().lower()

    if label in ["1", "true", "toxic", "offensive", "hate"]:
        return "toxic"

    if label in ["0", "false", "safe", "non-toxic", "nontoxic"]:
        return "safe"

    return "safe"


# --------------------------
# RESET
# --------------------------
@app.route("/reset", methods=["POST"])
def reset():
    global comment_results
    comment_results = []
    return jsonify({"status": "success"})


# --------------------------
# HOME
# --------------------------
@app.route("/")
def home():
    return render_template("index.html")


# --------------------------
# SINGLE PREDICT
# --------------------------
@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"label": "error", "error": "No text provided"}), 400

    text = data["text"].strip()
    context = data.get("context", "")

    if not text:
        return jsonify({"label": "error", "error": "Empty text"}), 400

    # Translate comment
    translated_text = translate_to_english(text)

    # Run model prediction on translated text
    result = predict_toxicity(translated_text, context)

    raw_label = result.get("label", "safe")
    scores = result.get("scores", {})

    label = normalize_label(raw_label)

    probability = 0.0
    if isinstance(scores, dict) and scores:
        try:
            probability = float(max(scores.values()))
        except:
            probability = 0.0

    response = {
        "comment": text,
        "translated_comment": translated_text,
        "label": label,
        "probability": probability,
        "scores": scores,
        "timestamp": time.time()
    }

    comment_results.append(response)

    return jsonify(response)


# --------------------------
# STATS (DASHBOARD)
# --------------------------
@app.route("/comment_stats")
def comment_stats():

    toxic = sum(1 for c in comment_results if c["label"] == "toxic")
    safe = len(comment_results) - toxic

    return jsonify({
        "total_comments": len(comment_results),
        "toxic": toxic,
        "safe": safe
    })


# --------------------------
# CHART DATA
# --------------------------
@app.route("/chart_data")
def chart_data():

    toxic = sum(1 for c in comment_results if c["label"] == "toxic")
    safe = len(comment_results) - toxic

    return jsonify({
        "labels": ["Safe", "Toxic"],
        "values": [safe, toxic]
    })


# --------------------------
# COMMENTS LIST
# --------------------------
@app.route("/comments")
def comments():
    return jsonify(comment_results)


# --------------------------
# BATCH PREDICTION
# --------------------------
@app.route("/predict_batch", methods=["POST"])
def predict_batch():

    data = request.get_json()
    texts = data.get("texts", [])
    context = data.get("context", "")

    results = []

    for text in texts:

        if not text:
            continue

        # Translate comment
        translated_text = translate_to_english(text)

        result = predict_toxicity(translated_text, context)

        label = normalize_label(result.get("label", "safe"))
        scores = result.get("scores", {})

        probability = 0.0
        if isinstance(scores, dict) and scores:
            try:
                probability = float(max(scores.values()))
            except:
                probability = 0.0

        response = {
            "comment": text,
            "translated_comment": translated_text,
            "label": label,
            "probability": probability,
            "scores": scores
        }

        comment_results.append(response)
        results.append(response)

    return jsonify({
        "count": len(results),
        "results": results
    })


# --------------------------
# SAVE COMMENT TO LOCAL FILE
# --------------------------
COMMENT_LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "comment_logs.json")

@app.route("/save_comment", methods=["POST"])
def save_comment():
    data = request.get_json()

    if not data or "comment" not in data:
        return jsonify({"status": "error", "error": "No comment provided"}), 400

    entry = {
        "comment": data.get("comment", ""),
        "label": data.get("label", "unknown"),
        "scores": data.get("scores", {}),
        "platform": data.get("platform", ""),
        "page_title": data.get("page_title", ""),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    # Load existing logs
    logs = []
    if os.path.exists(COMMENT_LOG_FILE):
        try:
            with open(COMMENT_LOG_FILE, "r", encoding="utf-8") as f:
                logs = json.load(f)
        except:
            logs = []

    logs.append(entry)

    # Save back
    with open(COMMENT_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2, ensure_ascii=False)

    return jsonify({"status": "saved", "total_logs": len(logs)})


# --------------------------
# RUN SERVER
# --------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)