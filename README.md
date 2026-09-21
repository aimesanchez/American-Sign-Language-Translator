# ASL Alphabet Recognition using Computer Vision

A real-time American Sign Language (ASL) alphabet recognition system built using Python, MediaPipe, OpenCV, and Machine Learning.

## Features

- Real-time webcam hand tracking
- Detects 24 ASL alphabet letters (excluding J and Z)
- Uses MediaPipe Hand Landmarker
- Random Forest classifier
- Live confidence score
- Custom dataset collected and trained from scratch

## Walkthrough
[walkthrough of asl translator: https://youtu.be/F_fwjUF9CYM ]

## Technologies

- Python
- OpenCV
- MediaPipe
- NumPy
- Scikit-Learn
- Pickle

## Model Pipeline

1. Collect hand landmark data
2. Extract 21 hand landmarks
3. Train Random Forest classifier
4. Predict ASL letters in real time

## Results

- Training Accuracy: 100%
- Testing Accuracy: 100%

## Future Improvements

- Sentence recognition
- Dynamic signs (J and Z)
- Word prediction
- Deep learning model
