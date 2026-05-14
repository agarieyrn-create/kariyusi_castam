# Security Specification for Kariyushi Design Studio

## 1. Data Invariants
- A design must belong to a valid authenticated user.
- A design's status transitions from 'draft' -> 'proposed' -> 'finalized'.
- Only the owner of a design can read/write/update it.
- User profile data is only accessible to the authenticated user themselves.

## 2. The "Dirty Dozen" Payloads
1. **Identity Theft**: Creating a design with someone else's `userId`.
2. **Access Breach**: Reading another user's design by guessing the `designId`.
3. **Shadow Update**: Updating a design with extra fields (e.g., `adminOnly: true`).
4. **ID Poisoning**: Using a 2KB string as a `designId`.
5. **PII Leak**: Querying the `users` collection to get all emails.
6. **Integrity Violation**: Updating a 'finalized' design's core conditions.
7. **Type Mismatch**: Setting `quantity` to a large string instead of a number.
8. **Orphaned Record**: Creating a design without a referencing a valid user.
9. **Denial of Wallet**: Sending massive arrays in `materials`.
10. **Role Escalation**: Trying to modify `userId` after creation.
11. **Timestamp Spoofing**: Providing a backdated `createdAt`.
12. **Malicious Enum**: Setting `status` to 'deleted_system' (not in enum).

## 3. The Test Runner (Mock representation)
The `firestore.rules.test.ts` will verify that:
- `get` on a design not owned by the user returns `PERMISSION_DENIED`.
- `create` with mismatching `request.auth.uid` and `data.userId` returns `PERMISSION_DENIED`.
- `update` modifying `userId` returns `PERMISSION_DENIED`.
- `list` on designs where `userId != request.auth.uid` returns `PERMISSION_DENIED`.
