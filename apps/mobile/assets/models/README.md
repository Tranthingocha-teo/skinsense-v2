MediaPipe models, Apache-2.0 (google-ai-edge/mediapipe), downloaded 2026-09-13:

- face_landmark.tflite — https://storage.googleapis.com/mediapipe-assets/face_landmark.tflite (468 points, input 192×192×3 float [0,1])
- selfie_multiclass_256x256.tflite — https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite (input 256×256×3 float [0,1], output 256×256×6 class confidences: bg, hair, body-skin, face-skin, clothes, other). selfie_segmentation.tflite was tried first and rejected: it needs MediaPipe's custom Convolution2DTransposeBias op, which plain TFLite (react-native-fast-tflite) does not register.
