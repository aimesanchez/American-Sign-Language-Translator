import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import os

# Paths
DATA_DIR = './asl_data'
DATASET_PATH = os.path.join(DATA_DIR, 'asl_dataset.csv')
MODEL_PATH = os.path.join(DATA_DIR, 'asl_model.pkl')
ENCODER_PATH = os.path.join(DATA_DIR, 'label_encoder.pkl')

def load_dataset():
    """Load the collected ASL dataset from CSV"""
    print("Loading dataset...")
    df = pd.read_csv(DATASET_PATH)
    
    # Separate features and labels
    # All columns except 'label' are features
    feature_columns = [col for col in df.columns if col != 'label']
    X = df[feature_columns].values
    y = df['label'].values
    
    print(f"Dataset loaded successfully!")
    print(f"Total samples: {len(X)}")
    print(f"Feature dimensions: {X.shape}")
    
    return X, y

def train_model(X, y):
    """Train a Random Forest classifier on the ASL data"""
    
    # Encode labels (A, B, C... -> 0, 1, 2...)
    print("\nEncoding labels...")
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    print(f"Classes: {label_encoder.classes_}")
    
    # Split data into training and testing sets
    print("\nSplitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    
    # Train Random Forest Classifier
    print("\nTraining Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    print("✓ Training complete!")
    
    # Evaluate the model
    print("\n" + "="*50)
    print("MODEL EVALUATION")
    print("="*50)
    
    # Training accuracy
    y_train_pred = model.predict(X_train)
    train_accuracy = accuracy_score(y_train, y_train_pred)
    print(f"Training Accuracy: {train_accuracy*100:.2f}%")
    
    # Testing accuracy
    y_test_pred = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    print(f"Testing Accuracy: {test_accuracy*100:.2f}%")

        # Per-letter accuracy summary
    letter_accuracies = {}

    for letter in label_encoder.classes_:
        letter_encoded = label_encoder.transform([letter])[0]
        letter_indexes = np.where(y_test == letter_encoded)[0]

        if len(letter_indexes) > 0:
            correct = np.sum(y_test_pred[letter_indexes] == y_test[letter_indexes])
            accuracy = (correct / len(letter_indexes)) * 100
            letter_accuracies[letter] = accuracy

    sorted_letters = sorted(letter_accuracies.items(), key=lambda x: x[1])

    print(f"\nOverall Accuracy: {test_accuracy*100:.1f}%")

    print("\nWorst Performing Letters:")
    for letter, accuracy in sorted_letters[:3]:
        print(f"{letter}: {accuracy:.0f}%")

    print("\nBest Performing Letters:")
    for letter, accuracy in sorted_letters[-3:][::-1]:
        print(f"{letter}: {accuracy:.0f}%")
    
    # Detailed classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_test_pred, 
                                target_names=label_encoder.classes_))
    
    # Confusion matrix
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_test_pred)
    print(cm)
    
    return model, label_encoder

def save_model(model, label_encoder):
    """Save the trained model and label encoder"""
    print("\n" + "="*50)
    print("Saving model and encoder...")
    
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    
    with open(ENCODER_PATH, 'wb') as f:
        pickle.dump(label_encoder, f)
    
    print(f"✓ Model saved to: {MODEL_PATH}")
    print(f"✓ Encoder saved to: {ENCODER_PATH}")
    print("="*50)

def main():
    # Check if dataset exists
    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        print("Please run 'asl_data_collection.py' first to collect training data.")
        return
    
    # Load data
    X, y = load_dataset()
    
    # Train model
    model, label_encoder = train_model(X, y)
    
    # Save model
    save_model(model, label_encoder)
    
    print("\n✓ Model training complete!")
    print("You can now use 'asl_recognition.py' for real-time ASL letter recognition.")

if __name__ == "__main__":
    main()


