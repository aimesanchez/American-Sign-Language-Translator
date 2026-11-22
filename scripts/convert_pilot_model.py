
import json
from pathlib import Path

import joblib

ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = ROOT / "models" / "asl_pilot_ab.pkl"
OUTPUT_PATH = ROOT / "frontend" / "public" / "models" / "asl_pilot_ab_browser.json"

# Load the model we just trained
model = joblib.load(MODEL_PATH)

browser_model = {
    "features": int(model.n_features_in_),
    "classes": model.classes_.tolist(),
    "trees": []
}

# Convert every Random Forest decision tree
for estimator in model.estimators_:
    tree = estimator.tree_

    browser_model["trees"].append({
        "left": tree.children_left.tolist(),
        "right": tree.children_right.tolist(),
        "feature": tree.feature.tolist(),
        "threshold": tree.threshold.tolist(),
        "value": [
            [
                float(v) / sum(node_values) if sum(node_values) else 0.0
                for v in node_values
            ]
            for node_values in tree.value[:, 0, :]
        ]
    })

# Save browser-compatible JSON
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

with open(OUTPUT_PATH, "w", encoding="utf-8") as file:
    json.dump(browser_model, file)

print("Conversion completed!")
print("Saved to:", OUTPUT_PATH)
print("Supported letters:", browser_model["classes"])
print("Number of trees:", len(browser_model["trees"]))
