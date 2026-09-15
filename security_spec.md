# Security Specification for CampQuest Real-Time Collaboration

## 1. Data Invariants
1. Trip ID must be a non-empty alphanumeric string matching `^[a-zA-Z0-9_-]+$` with length <= 128.
2. Trip Name must be a non-empty string with length <= 150.
3. Dates (startDate, endDate) must be valid date strings with length <= 30.
4. Trips can be read by any authorized/public viewer or collaborator.
5. All write operations must include required fields: id, tripName, startDate, endDate, and days.
6. Days must be an array with at least 1 day and at most 14 days.
7. Activities, supplies, and students arrays must be bounded to prevent denial of wallet attacks.
8. Unauthenticated or malicious actors cannot inject oversized fields (> 100KB payloads).

## 2. The "Dirty Dozen" Malicious Payloads
1. **Payload 1 (ID Poisoning / Path Traversal)**: Attempting to write with ID `../../secrets/config` to overwrite non-trip document paths.
2. **Payload 2 (Empty Trip Name)**: Write payload with `tripName: ""` or missing tripName.
3. **Payload 3 (Oversized Trip Name)**: String of 15,000 characters in `tripName` to cause storage abuse.
4. **Payload 4 (Missing Required Days)**: Payload omitting `days` array.
5. **Payload 5 (Empty Days Array)**: Payload with `days: []` causing zero-day scheduling crash.
6. **Payload 6 (Oversized Days Array)**: Payload with 5,000 day objects to exhaust client memory.
7. **Payload 7 (Invalid Date Format)**: Payload with arbitrary binary string or 2,000-character string in `startDate`.
8. **Payload 8 (Type Spoofing Expected Students)**: `expectedStudents: "unlimited"` string instead of number.
9. **Payload 9 (Shadow Admin Injection)**: Payload injecting `{ isAdmin: true, role: "superadmin" }` to escalate privileges.
10. **Payload 10 (Negative Student Count)**: `expectedStudents: -500`.
11. **Payload 11 (XSS Script Payload in Destination)**: `<script>alert('pwn')</script>` exceeding boundary checks.
12. **Payload 12 (Corrupted Activities Non-Array)**: `activities: { hacker: true }` instead of an array.

## 3. Test Runner Design
The firestore rules will ensure:
- Only valid trip IDs match the collection path.
- `isValidTrip(incoming())` helper validates all core fields, types, and length bounds.
- Catch-all rule `match /{document=**} { allow read, write: if false; }` ensures no unauthorized collections can be accessed.
