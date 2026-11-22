
import json
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib

# Locate the project folders
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "training-data"
OUTPUT_DIR = ROOT / "models"

OUTPUT_DIR.mkdir(exist_ok=True)

features = []
labels = []

# Load A and B training samples
for letter in ["A", "B", "C", "D", 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']:
    folder = DATA_DIR / letter

    for file in folder.glob("*.json"):
        with open(file, "r", encoding="utf-8") as f:
            dataset = json.load(f)

        if dataset.get("featureFormat") != "wrist-relative-scale-normalized-xyz":
            raise ValueError(f"Unexpected format in {file}")

        for sample in dataset["samples"]:
            if sample["label"] != letter:
                raise ValueError(f"Incorrect label in {file}")

            vector = sample["features"]

            if len(vector) != 63:
                raise ValueError(f"Invalid feature count in {file}")

            features.append(vector)
            labels.append(letter)

X = np.array(features, dtype=float)
y = np.array(labels)

print(f"Loaded {len(X)} samples")
print(f"A samples: {sum(y == 'A')}")
print(f"B samples: {sum(y == 'B')}")
print(f"C samples: {sum(y == 'C')}")
print(f"D samples: {sum(y == 'D')}")
print(f"E samples: {sum(y == 'E')}")
print(f"F samples: {sum(y == 'F')}")
print(f"G samples: {sum(y == 'G')}")
print(f"H samples: {sum(y == 'H')}")
print(f"I samples: {sum(y == 'I')}")
print(f"K samples: {sum(y == 'K')}")
print(f"L samples: {sum(y == 'L')}")
print(f"M samples: {sum(y == 'M')}")
print(f"N samples: {sum(y == 'N')}")
print(f"O samples: {sum(y == 'O')}")
print(f"P samples: {sum(y == 'P')}")
print(f"Q samples: {sum(y == 'Q')}")
print(f"R samples: {sum(y == 'R')}")
print(f"S samples: {sum(y == 'S')}")
print(f"T samples: {sum(y == 'T')}")
print(f"U samples: {sum(y == 'U')}")
print(f"V samples: {sum(y == 'V')}")
print(f"W samples: {sum(y == 'W')}")
print(f"X samples: {sum(y == 'X')}")
print(f"Y samples: {sum(y == 'Y')}")
print(f"Z samples: {sum(y == 'Z')}")

# Train the pilot classifier
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)

model.fit(X, y)

# Save the trained Python model
output_path = OUTPUT_DIR / "asl_pilot_ab.pkl"
joblib.dump(model, output_path)

print(f"\nModel saved to: {output_path}")
print("Pilot training completed!")
