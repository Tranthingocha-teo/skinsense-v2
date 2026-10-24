#!/usr/bin/env python3
"""
SkinSense Routine & Product Recommendation ML Model Trainer.
Generates synthetic clinical skin telemetry data, trains a Keras neural network,
and exports an optimized TensorFlow Lite model (.tflite) for mobile on-device inference.
"""

import os
import random
import numpy as np
import tensorflow as tf

# Fix seeds for deterministic training
np.random.seed(42)
tf.random.set_seed(42)
random.seed(42)

CLASSES = [
    "acne_blemish",         # 0
    "calming_redness",      # 1
    "barrier_repair",       # 2
    "brightening_tone",     # 3
    "pore_oil_control",     # 4
    "gentle_maintenance",   # 5
]

ZONES = ["forehead", "leftCheek", "rightCheek", "nose", "chin"]

def generate_telemetry_dataset(num_samples=12000):
    """
    Synthesizes diverse skin telemetry profiles adhering to dermatological patterns:
    - Active spots (>0) strongly trigger acne_blemish (0).
    - Elevated redness (>1.5) triggers calming_redness (1).
    - High nose unevenness/oiliness triggers pore_oil_control (4).
    - High unevenness (>2.0) across cheeks/forehead triggers brightening_tone (3).
    - Dry/sensitive low redness with roughness triggers barrier_repair (2).
    - Balanced metrics trigger gentle_maintenance (5).
    """
    X = []
    y = []

    for _ in range(num_samples):
        zone_idx = random.randint(0, 4)
        zone_name = ZONES[zone_idx]
        skin_type = random.randint(0, 4) # 0: normal, 1: oily, 2: dry, 3: sensitive, 4: combo

        # Decide primary archetype
        archetype = random.choices(
            [0, 1, 2, 3, 4, 5],
            weights=[0.22, 0.22, 0.16, 0.16, 0.12, 0.12]
        )[0]

        if archetype == 0:  # acne_blemish
            spots = random.randint(1, 8)
            redness = np.random.normal(1.8, 1.2)
            unevenness = np.random.normal(1.6, 0.6)
            label = 0
        elif archetype == 1:  # calming_redness
            spots = random.choice([0, 0, 1])
            redness = np.random.uniform(1.6, 5.5)
            unevenness = np.random.normal(1.4, 0.5)
            label = 1
        elif archetype == 2:  # barrier_repair
            spots = 0
            redness = np.random.uniform(-2.5, 0.8)
            unevenness = np.random.uniform(1.5, 3.2)
            skin_type = random.choice([2, 3]) # dry/sensitive
            label = 2
        elif archetype == 3:  # brightening_tone
            spots = 0
            redness = np.random.uniform(-0.8, 1.3)
            unevenness = np.random.uniform(2.1, 4.5)
            label = 3
        elif archetype == 4:  # pore_oil_control
            zone_idx = random.choice([3, 0]) # nose or forehead
            spots = random.choice([0, 1])
            redness = np.random.uniform(-0.5, 1.8)
            unevenness = np.random.uniform(1.5, 3.5)
            skin_type = random.choice([1, 4]) # oily/combo
            label = 4
        else:  # gentle_maintenance
            spots = 0
            redness = np.random.uniform(-1.0, 1.2)
            unevenness = np.random.uniform(0.6, 1.4)
            label = 5

        # Normalize features
        feat_zone = zone_idx / 4.0
        feat_redness = np.clip((redness + 5.0) / 15.0, 0.0, 1.0)
        feat_uneven = np.clip(unevenness / 10.0, 0.0, 1.0)
        feat_spots = np.clip(spots / 10.0, 0.0, 1.0)
        feat_skintype = skin_type / 4.0

        X.append([feat_zone, feat_redness, feat_uneven, feat_spots, feat_skintype])
        y.append(label)

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)

def train_and_export():
    print("Generating telemetry training data...")
    X, y = generate_telemetry_dataset(15000)
    print(f"Dataset shape: X={X.shape}, y={y.shape}")

    # Build Keras Feed-Forward Network
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(5,), name="zone_telemetry_input"),
        tf.keras.layers.Dense(48, activation="relu"),
        tf.keras.layers.Dropout(0.15),
        tf.keras.layers.Dense(32, activation="relu"),
        tf.keras.layers.Dense(len(CLASSES), activation="softmax", name="condition_probabilities"),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.003),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    print("Training model...")
    history = model.fit(
        X, y,
        epochs=18,
        batch_size=64,
        validation_split=0.2,
        verbose=1
    )

    val_acc = history.history["val_accuracy"][-1]
    print(f"\nFinal Validation Accuracy: {val_acc * 100:.2f}%")

    # Export to TFLite
    print("\nConverting model to TensorFlow Lite (.tflite)...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    output_dir = os.path.abspath("apps/mobile/assets/models")
    os.makedirs(output_dir, exist_ok=True)
    tflite_path = os.path.join(output_dir, "routine_recommendation.tflite")

    with open(tflite_path, "wb") as f:
        f.write(tflite_model)

    print(f"Saved TFLite model to: {tflite_path} ({len(tflite_model)} bytes)")

    # Verify model with TFLite Interpreter
    interpreter = tf.lite.Interpreter(model_path=tflite_path)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    print("\nTFLite Verification:")
    print("Input details:", input_details[0]["shape"], input_details[0]["dtype"])
    print("Output details:", output_details[0]["shape"], output_details[0]["dtype"])

    # Test sample inference (Forehead with 2 spots)
    test_input = np.array([[0.0, (2.0 + 5.0) / 15.0, 1.8 / 10.0, 2.0 / 10.0, 0.25]], dtype=np.float32)
    interpreter.set_tensor(input_details[0]["index"], test_input)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]["index"])[0]

    predicted_class = CLASSES[np.argmax(output)]
    print(f"Test Sample (Forehead with 2 spots): Predicted '{predicted_class}' with confidence {np.max(output):.2%}")
    assert predicted_class == "acne_blemish", f"Expected acne_blemish but got {predicted_class}"
    print("TFLite Model Verified Successfully!")

if __name__ == "__main__":
    train_and_export()
