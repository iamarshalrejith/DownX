# Student Lifecycle – DownX

## 1. Student Creation

Actor: Teacher or Parent

Steps:
1. Adult creates a student profile
2. System generates:
   - Unique Enrollment ID
   - Default Visual PIN (or setup flow)
3. Student record stored with guardian linkage

---

## 2. Student Linking

### Parent Linking
- Parent links student using Enrollment ID
- Backend verifies ownership permissions
- Parent gains read/write access based on role

### Teacher Linking
- Teacher links student under class or institution
- Teacher gains task creation and monitoring rights

---

## 3. Student Daily Usage

Student can:
- Log in using Enrollment ID
- View assigned tasks
- Interact with simplified instructions
- Mark tasks as completed

Student cannot:
- Modify account settings
- Access analytics
- Change authentication methods

---

## 4. Student Updates

Allowed via Adult Roles:
- Name updates
- PIN reset
- Face auth enable/disable
- Task reassignment

---

## 5. Student Deactivation

Actor: Teacher or Parent

Steps:
1. Student marked inactive
2. Login blocked
3. Historical data preserved
4. Analytics remain available to adults
