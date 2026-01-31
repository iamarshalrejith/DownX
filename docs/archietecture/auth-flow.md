# Authentication Flow – DownX

## Actors
- Teacher
- Parent
- Student (Child)

## Authentication Methods
- Email + Password (Teacher, Parent)
- Enrollment ID + Visual PIN (Student)
- Enrollment ID + Face Authentication (Student – optional)

---

## Teacher / Parent Login Flow

1. User enters email and password
2. Backend validates credentials
3. JWT access token issued
4. Role attached to token (`teacher` or `parent`)
5. User redirected to respective dashboard

### Failure Cases
- Invalid email/password → error message
- Account disabled → access denied
- Token expired → forced logout

---

## Student Login Entry Flow

1. Student enters Enrollment ID
2. Backend checks:
   - Does student exist?
   - Is face authentication enabled?

3. Backend responds with allowed login methods:
   - Face Login
   - Visual PIN
   - Both

4. Frontend dynamically shows valid login UI only

---

## Student PIN Login Flow

1. Student selects visual icons (PIN)
2. PIN is hashed and sent to backend
3. Backend verifies PIN
4. Student JWT token issued
5. Redirect to student dashboard

### Failure Cases
- Wrong PIN → retry allowed
- Too many failures → temporary lock (future rate limiting)

---

## Student Face Login Flow

(See `face-auth-flow.md` for full details)

---

## Security Notes
- Students never access email/password auth
- Parents cannot log in as students
- Tokens are role-scoped
- No sensitive error messages shown to children
