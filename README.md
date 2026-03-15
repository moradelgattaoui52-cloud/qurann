# Sign Language Recognition — Setup

## Requirements

```
opencv-python>=4.8
mediapipe>=0.10
numpy>=1.24
```

Install with:
```bash
pip install opencv-python mediapipe numpy
```

## Run

```bash
python sign_language_recognition.py
```

Press **Q** or **ESC** to quit.

---

## Recognised Gestures

| Gesture | ASL Letter / Sign |
|---------|------------------|
| Fist, thumb side | **A** |
| Four fingers up, thumb tucked | **B** |
| Curved C-shape | **C** |
| Index + thumb (D-shape) | **D** |
| All curled | **E** |
| Index+thumb pinch, others up | **F** |
| Index pointing sideways + thumb | **G** |
| Pinky only | **I** |
| Index + thumb L-shape | **L** |
| All fingers curl to thumb | **O** |
| Index + middle up | **V ✌️** |
| Index + middle + ring up | **W** |
| Thumb + pinky out | **Y** |
| All five fingers open | **OPEN HAND ✋** |
| All fingers closed | **FIST ✊** |
| Index pointing up | **POINT ☝️** |
| Thumb up | **THUMBS UP 👍** |
| Thumb down | **THUMBS DOWN 👎** |
| Index + pinky up | **ROCK ON 🤘** |

---

## How It Works

1. **MediaPipe Hands** detects 21 3D landmarks on each hand in real-time.
2. A **rule-based classifier** analyses relative finger positions (tip vs. PIP joint y-coordinates, inter-landmark distances) to identify gestures.
3. A **smoothing buffer** (5 consecutive frames) prevents flickering.
4. An **OpenCV HUD** overlays the gesture label, signal-strength indicator, FPS, and a recent-gesture ribbon.

> **Extending with TensorFlow**: Replace the `classify_gesture()` function with a TFLite model loaded via `tf.lite.Interpreter`. Feed the 63-element landmark vector (21 × xyz) through the model and take the `argmax` of the output probabilities.
