I have analyzed the current `createEvent` implementation across the frontend, backend, and smart contract. The user wants to fully implement `createEvent` referencing the provided `idl.json`, covering the interaction from Frontend -> Backend -> Contract.

Currently:
1.  **Frontend (`useSoldoraProgram.ts`)**: Implements `createEvent` directly using the user's wallet.
2.  **Backend (`api/create/generate/route.ts`)**: Implements `createEvent` using a server-side wallet.
3.  **Frontend Page (`create/page.tsx`)**: Calls the frontend hook `createEvent` directly (client-side signing).

The user's request "from frontend to backend to contract" implies they want the Frontend to call the Backend API, and the Backend API to execute the contract interaction (server-side signing), rather than the user signing the transaction directly.

### **Plan:**

1.  **Modify Frontend Page (`src/app/create/page.tsx`)**:
    *   Change `createMarketMutation` to call the Backend API (`api.generateChallenge`) instead of the `useSoldoraProgram` hook.
    *   This shifts the responsibility of transaction creation/signing to the backend.

2.  **Modify Backend API (`src/app/api/create/generate/route.ts`)**:
    *   Ensure it correctly implements the `createEvent` logic using the `idl.json` structure (which I have already updated in a previous step, but I will double-check against the `idl.json` provided in the prompt).
    *   The `idl.json` shows `createEvent` takes `uniqueId`, `description`, `deadline`.
    *   The backend is already set up to use the server wallet (`id.json`).

3.  **Verify `src/lib/soldora-idl.ts`**:
    *   Ensure the IDL in the frontend matches the `idl.json` provided by the user, specifically the account name `Event` (PascalCase) vs `event` (camelCase) to avoid client-side errors if we still use the client for fetching.

4.  **Refactor `useSoldoraProgram.ts`**:
    *   Keep `fetchEvents` and `placeBet` as they likely still need client-side interaction (or reading).
    *   `createEvent` in the hook might become redundant if we move strictly to backend-creation, but I will leave it as a fallback or reference unless explicitly asked to remove it.

**Focus**: The main task is wiring `create/page.tsx` to call `api.generateChallenge` (which hits the backend route) instead of `createEvent` from the hook.

### **Steps:**

1.  **Update `src/app/create/page.tsx`**: Switch mutation to use `api.generateChallenge`.
2.  **Update `src/lib/api.ts`**: Ensure `generateChallenge` sends the correct payload expected by the backend (`title`, `description`, `endTime`, `creatorWallet`).
3.  **Check Backend `route.ts`**: Confirm it accepts the payload and executes the transaction using the correct IDL and Program ID.
