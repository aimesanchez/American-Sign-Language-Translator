
import pickle
from pathlib import Path

# Locate the original trained model files
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "asl_data"

MODEL_PATH = DATA_DIR / "asl_model.pkl"
ENCODER_PATH = DATA_DIR / "label_encoder.pkl"

try:
    # Only load pickle files you trust.
    with open(MODEL_PATH, "rb") as file:
        model = pickle.load(file)

    with open(ENCODER_PATH, "rb") as file:
        encoder = pickle.load(file)

    print("Model loaded successfully!")
    print("Model type:", type(model).__name__)
    print("Number of trees:", len(model.estimators_))
    print("Input features:", model.n_features_in_)
    print("Supported letters:", encoder.classes_)

except Exception as error:
    print("Unable to load model:")
    print(type(error).__name__, str(error))
