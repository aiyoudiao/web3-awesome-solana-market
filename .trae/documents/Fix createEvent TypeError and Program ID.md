I will fix the `createEvent` error by hardening the `useSoldoraProgram` hook. The error "Received type undefined" confirms that an argument passed to the instruction encoding is undefined, likely the string argument (`title` mapping to `description`). I will also fix the incorrect `tokenProgram` ID.

### Plan
1.  **Modify `src/hooks/useSoldoraProgram.ts`**:
    *   **Fix `tokenProgram`**: Change `tokenProgram: PROGRAM_ID` back to `tokenProgram: TOKEN_PROGRAM_ID` (from `@solana/spl-token`) in the `createEvent` accounts. Using the wrong program ID here is a critical bug.
    *   **Ensure Safe Arguments**: Explicitly use `safeTitle` (guaranteed string) instead of `title` in the `program.methods.createEvent(...)` call. This prevents `undefined` from reaching Anchor's encoder.
    *   **Add Type Checks**: Add explicit runtime checks to ensure `safeTitle` is a string and `Buffer` is available before proceeding.
    *   **Keep Buffer Polyfill**: Retain the runtime Buffer check/recovery logic I added previously, as it's a good safety net.

2.  **Verify**:
    *   The user will need to refresh the page after these changes.
    *   The explicit use of `safeTitle` ("Untitled Event") ensures that even if the input is somehow missing, the transaction construction won't crash with a TypeError.

This approach addresses the root cause (undefined argument) and a critical logic error (wrong program ID).