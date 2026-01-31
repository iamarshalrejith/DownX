# Face Authentication Flow – DownX

## Purpose
Enable zero-effort, child-friendly login using facial recognition.

---

## 1. Face Enrollment

Actor: Teacher 

Steps:
1. Adult initiates face enrollment
2. Secure tokenized enrollment link generated
3. Student opens link on trusted device
4. Webcam activated
5. Multiple face frames captured
6. Face landmarks extracted (MediaPipe)
7. Embeddings normalized and averaged
8. Final vector stored securely in Student model

---

## 2. Face Login

Actor: Student

Steps:
1. Student enters Enrollment ID
2. Backend confirms face auth enabled
3. Webcam opens automatically
4. Live face landmarks extracted
5. Embedding generated
6. Cosine similarity computed vs stored vector
7. If similarity ≥ threshold:
   - Login success
   - JWT issued
   - Webcam stopped
8. If similarity < threshold:
   - Retry allowed
   - Fallback to Visual PIN

---

## 3. Failure Handling

- Camera permission denied → fallback to PIN
- No face detected → retry prompt
- Multiple failures → temporary disable face login (future)

---

## Security Considerations
- No raw images stored
- Only embeddings persisted
- No face data shared externally
- Enrollment requires adult authorization
