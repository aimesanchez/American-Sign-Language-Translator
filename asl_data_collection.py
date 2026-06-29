import cv2
import mediapipe as mp
import os
import pandas as pd
import time

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

DATA_DIR = "./asl_data"
HAND_MODEL_PATH = "hand_landmarker.task"

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

LETTERS = [
    "S"
]

SAMPLES_PER_LETTER = 150

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17)
]

def draw_landmarks(image, hand_landmarks):
    h, w, _ = image.shape

    for start, end in HAND_CONNECTIONS:
        x1, y1 = int(hand_landmarks[start].x * w), int(hand_landmarks[start].y * h)
        x2, y2 = int(hand_landmarks[end].x * w), int(hand_landmarks[end].y * h)
        cv2.line(image, (x1, y1), (x2, y2), (255, 0, 0), 2)

    for landmark in hand_landmarks:
        x, y = int(landmark.x * w), int(landmark.y * h)
        cv2.circle(image, (x, y), 5, (0, 255, 0), -1)

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

def collect_data_for_letter(letter, landmarker, cap):
    data = []
    labels = []
    sample_count = 0
    collecting = False

    print(f"\n{'=' * 50}")
    print(f"Collecting data for letter: {letter}")
    print(f"Target samples: {SAMPLES_PER_LETTER}")
    print("Press SPACE to start/stop collecting")
    print("Press Q to skip this letter")
    print(f"{'=' * 50}\n")

    while sample_count < SAMPLES_PER_LETTER:
        success, image = cap.read()

        if not success:
            continue

        image = cv2.flip(image, 1)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=image_rgb
        )

        timestamp_ms = int(time.time() * 1000)
        result = landmarker.detect_for_video(mp_image, timestamp_ms)

        if result.hand_landmarks:
            hand_landmarks = result.hand_landmarks[0]
            draw_landmarks(image, hand_landmarks)

            if collecting:
                data.append(extract_landmarks(hand_landmarks))
                labels.append(letter)
                sample_count += 1

                cv2.putText(
                    image,
                    f"Captured: {sample_count}/{SAMPLES_PER_LETTER}",
                    (10, 110),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2
                )

        status = "COLLECTING" if collecting else "READY (Press SPACE)"
        cv2.putText(image, f"Letter: {letter}", (10, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

        cv2.putText(image, status, (10, 75),
                    cv2.FONT_HERSHEY_SIMPLEX, 1,
                    (0, 255, 255) if collecting else (255, 255, 255), 2)

        cv2.imshow("ASL Data Collection", image)

        key = cv2.waitKey(5) & 0xFF

        if key == ord(" "):
            collecting = not collecting
        elif key == ord("q"):
            print(f"Skipped letter {letter}")
            return [], []

    print(f"✓ Completed collecting {sample_count} samples for letter {letter}")
    return data, labels

def main():
    if not os.path.exists(HAND_MODEL_PATH):
        print(f"ERROR: {HAND_MODEL_PATH} not found!")
        return

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("ERROR: Camera failed to open.")
        return

    print("SUCCESS: Camera opened. Starting ASL data collection...")
    print(f"You will collect {SAMPLES_PER_LETTER} samples for each letter.")
    print("Press ENTER to begin...")
    input()

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

    all_data = []
    all_labels = []

    for letter in LETTERS:
        data, labels = collect_data_for_letter(letter, landmarker, cap)
        all_data.extend(data)
        all_labels.extend(labels)
        time.sleep(1)

    feature_columns = []
    for i in range(21):
        feature_columns.extend([
            f"landmark_{i}_x",
            f"landmark_{i}_y",
            f"landmark_{i}_z"
        ])

    new_df = pd.DataFrame(all_data, columns=feature_columns)
    new_df["label"] = all_labels

    save_path = os.path.join(DATA_DIR, "asl_dataset.csv")

    if os.path.exists(save_path):
        print("\nExisting dataset found. Appending new samples...")

        existing_df = pd.read_csv(save_path)
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)

        combined_df.to_csv(save_path, index=False)

        print(f"Added {len(new_df)} new samples.")
        print(f"Dataset now contains {len(combined_df)} total samples.")

    else:
        new_df.to_csv(save_path, index=False)

        print("\nNo existing dataset found.")
        print(f"Created dataset with {len(new_df)} samples.")

    print(f"\n{'=' * 50}")
    print("Data collection complete!")
    print(f"New samples collected: {len(new_df)}")
    print(f"Saved to: {save_path}")
    print(f"{'=' * 50}")

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()