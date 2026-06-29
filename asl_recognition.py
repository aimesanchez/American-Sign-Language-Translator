import cv2
import mediapipe as mp
import numpy as np
import pickle
import os
import sys
import time

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

DATA_DIR = "./asl_data"
MODEL_PATH = os.path.join(DATA_DIR, "asl_model.pkl")
ENCODER_PATH = os.path.join(DATA_DIR, "label_encoder.pkl")
HAND_MODEL_PATH = "hand_landmarker.task"

# Matcha theme colors - OpenCV uses BGR
MATCHA_DARK = (45, 70, 45)
MATCHA = (95, 140, 85)
MATCHA_LIGHT = (190, 220, 170)
CREAM = (235, 245, 225)
WHITE = (255, 255, 255)
BLACK = (30, 30, 30)

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17)
]


def draw_centered_text(img, text, y, font_scale=1, color=BLACK, thickness=2):
    font = cv2.FONT_HERSHEY_DUPLEX
    text_size = cv2.getTextSize(text, font, font_scale, thickness)[0]
    x = (img.shape[1] - text_size[0]) // 2
    cv2.putText(img, text, (x, y), font, font_scale, color, thickness)


def show_instructions():
    width, height = 900, 600

    while True:
        screen = np.zeros((height, width, 3), dtype=np.uint8)
        screen[:] = CREAM

        cv2.rectangle(screen, (60, 60), (840, 540), MATCHA_LIGHT, -1)
        cv2.rectangle(screen, (60, 60), (840, 540), MATCHA_DARK, 4)

        draw_centered_text(screen, "Instructions", 145, 1.4, MATCHA_DARK, 3)

        font = cv2.FONT_HERSHEY_DUPLEX
        instructions = [
            "Hold one hand in view.",
            "Keep your fingers visible.",
            "Good lighting improves accuracy.",
            "Press C to clear the word.",
            "Press SPACE to add a space.",
            "Press Q to return to the menu."
        ]

        y = 220
        for line in instructions:
            cv2.putText(screen, f"- {line}", (170, y), font, 0.75, BLACK, 2)
            y += 42

        draw_centered_text(screen, "Press any key to go back", 510, 0.8, MATCHA_DARK, 2)

        cv2.imshow("ASL Translator", screen)
        key = cv2.waitKey(0) & 0xFF

        if key:
            return


def show_main_menu():
    width, height = 900, 600

    while True:
        screen = np.zeros((height, width, 3), dtype=np.uint8)
        screen[:] = CREAM

        cv2.rectangle(screen, (60, 60), (840, 540), MATCHA_LIGHT, -1)
        cv2.rectangle(screen, (60, 60), (840, 540), MATCHA_DARK, 4)

        draw_centered_text(screen, "ASL Translator", 155, 1.7, MATCHA_DARK, 3)
        draw_centered_text(screen, "Machine Learning + MediaPipe", 210, 0.8, BLACK, 2)

        draw_centered_text(screen, "Press SPACE to Begin Recognition", 310, 0.9, MATCHA_DARK, 2)
        draw_centered_text(screen, "Press I for Instructions", 360, 0.9, MATCHA_DARK, 2)
        draw_centered_text(screen, "Press ESC to Exit", 410, 0.9, MATCHA_DARK, 2)

        cv2.imshow("ASL Translator", screen)
        key = cv2.waitKey(1) & 0xFF

        if key == 32:  # SPACE
            cv2.destroyWindow("ASL Translator")
            return True
        elif key == ord("i"):
            show_instructions()
        elif key == 27:  # ESC
            cv2.destroyAllWindows()
            return False


def draw_prediction_panel(frame, predicted_letter, confidence, predicted_word, fps):
    h, w, _ = frame.shape

    if predicted_letter is None:
        predicted_letter = "-"
        confidence = 0

    confidence_percent = confidence * 100

    # Top bar
    cv2.rectangle(frame, (0, 0), (w, 80), MATCHA_DARK, -1)

    cv2.putText(frame, "ASL Translator", (25, 50),
                cv2.FONT_HERSHEY_DUPLEX, 1.1, WHITE, 2)

    cv2.putText(frame, f"FPS: {fps:.1f}", (w - 150, 50),
                cv2.FONT_HERSHEY_DUPLEX, 0.7, WHITE, 2)

    # Prediction card
    cv2.rectangle(frame, (20, 105), (350, 335), CREAM, -1)
    cv2.rectangle(frame, (20, 105), (350, 335), MATCHA_DARK, 3)

    cv2.putText(frame, "Detected Letter", (45, 150),
                cv2.FONT_HERSHEY_DUPLEX, 0.8, BLACK, 2)

    cv2.putText(frame, str(predicted_letter), (145, 230),
                cv2.FONT_HERSHEY_DUPLEX, 2.5, MATCHA_DARK, 4)

    cv2.putText(frame, f"Confidence: {confidence_percent:.1f}%", (45, 285),
                cv2.FONT_HERSHEY_DUPLEX, 0.65, BLACK, 2)

    # Confidence bar
    bar_x, bar_y = 45, 305
    bar_w, bar_h = 260, 20
    filled_w = int(bar_w * (confidence_percent / 100))

    cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), WHITE, -1)
    cv2.rectangle(frame, (bar_x, bar_y), (bar_x + filled_w, bar_y + bar_h), MATCHA, -1)
    cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), MATCHA_DARK, 2)

    # Word card
    cv2.rectangle(frame, (20, 355), (w - 20, 430), CREAM, -1)
    cv2.rectangle(frame, (20, 355), (w - 20, 430), MATCHA_DARK, 2)

    display_word = predicted_word if predicted_word else "(word will appear here)"
    cv2.putText(frame, f"Word: {display_word}", (40, 405),
                cv2.FONT_HERSHEY_DUPLEX, 0.85, BLACK, 2)

    # Bottom controls
    cv2.rectangle(frame, (0, h - 45), (w, h), MATCHA_DARK, -1)
    cv2.putText(frame, "C = clear  |  SPACE = space  |  Q = menu  |  ESC = exit",
                (25, h - 15), cv2.FONT_HERSHEY_DUPLEX, 0.6, WHITE, 2)


def load_model():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH):
        print("ERROR: Model files not found!")
        sys.exit(1)

    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    with open(ENCODER_PATH, "rb") as f:
        label_encoder = pickle.load(f)

    print("✓ Model loaded successfully!")
    return model, label_encoder


def extract_landmarks(hand_landmarks):
    wrist = hand_landmarks[0]
    middle_mcp = hand_landmarks[9]

    scale = (
        (middle_mcp.x - wrist.x) ** 2 +
        (middle_mcp.y - wrist.y) ** 2 +
        (middle_mcp.z - wrist.z) ** 2
    ) ** 0.5

    if scale == 0:
        scale = 1

    landmarks = []

    for landmark in hand_landmarks:
        landmarks.extend([
            (landmark.x - wrist.x) / scale,
            (landmark.y - wrist.y) / scale,
            (landmark.z - wrist.z) / scale
        ])

    return landmarks


def predict_letter(hand_landmarks, model, label_encoder):
    landmarks = extract_landmarks(hand_landmarks)
    landmarks = np.array(landmarks).reshape(1, -1)

    prediction = model.predict(landmarks)[0]
    proba = model.predict_proba(landmarks)[0]
    confidence = np.max(proba)

    letter = label_encoder.inverse_transform([prediction])[0]
    return letter, confidence


def draw_landmarks(image, hand_landmarks):
    h, w, _ = image.shape

    for start, end in HAND_CONNECTIONS:
        x1, y1 = int(hand_landmarks[start].x * w), int(hand_landmarks[start].y * h)
        x2, y2 = int(hand_landmarks[end].x * w), int(hand_landmarks[end].y * h)
        cv2.line(image, (x1, y1), (x2, y2), MATCHA_DARK, 2)

    for landmark in hand_landmarks:
        x, y = int(landmark.x * w), int(landmark.y * h)
        cv2.circle(image, (x, y), 5, MATCHA, -1)
        cv2.circle(image, (x, y), 6, WHITE, 1)


def run_recognition(model, label_encoder, landmarker):
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("ERROR: Camera failed to open.")
        sys.exit(1)

    predicted_word = ""
    last_prediction = None
    stable_frames = 0
    STABLE_THRESHOLD = 15

    previous_time = time.time()

    while cap.isOpened():
        success, image = cap.read()

        if not success:
            continue

        current_time = time.time()
        fps = 1 / (current_time - previous_time)
        previous_time = current_time

        image = cv2.flip(image, 1)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=image_rgb
        )

        timestamp_ms = int(time.time() * 1000)
        result = landmarker.detect_for_video(mp_image, timestamp_ms)

        current_prediction = None
        current_confidence = 0

        if result.hand_landmarks:
            for hand_landmarks in result.hand_landmarks:
                draw_landmarks(image, hand_landmarks)

                letter, confidence = predict_letter(hand_landmarks, model, label_encoder)
                current_prediction = letter
                current_confidence = confidence

        if current_prediction == last_prediction and current_prediction is not None:
            stable_frames += 1

            if stable_frames == STABLE_THRESHOLD:
                predicted_word += current_prediction
                print(f"Added letter: {current_prediction} | Word: {predicted_word}")
        else:
            stable_frames = 0
            last_prediction = current_prediction

        draw_prediction_panel(
            image,
            current_prediction,
            current_confidence,
            predicted_word,
            fps
        )

        cv2.imshow("ASL Recognition", image)

        key = cv2.waitKey(5) & 0xFF

        if key == ord("q"):
            cap.release()
            cv2.destroyWindow("ASL Recognition")
            return "menu"

        elif key == 27:  # ESC
            cap.release()
            cv2.destroyAllWindows()
            return "exit"

        elif key == ord("c"):
            predicted_word = ""
            print("Word cleared")

        elif key == ord(" "):
            predicted_word += " "
            print(f"Space added | Word: {predicted_word}")

    cap.release()
    cv2.destroyAllWindows()
    return "exit"


def main():
    if not os.path.exists(HAND_MODEL_PATH):
        print(f"ERROR: {HAND_MODEL_PATH} not found!")
        sys.exit(1)

    model, label_encoder = load_model()

    base_options = python.BaseOptions(model_asset_path=HAND_MODEL_PATH)

    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_hands=1,
        min_hand_detection_confidence=0.7,
        min_hand_presence_confidence=0.7,
        min_tracking_confidence=0.7
    )

    landmarker = vision.HandLandmarker.create_from_options(options)

    while True:
        start_app = show_main_menu()

        if not start_app:
            break

        result = run_recognition(model, label_encoder, landmarker)

        if result == "exit":
            break

    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()