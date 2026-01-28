Based on the provided `Prd2.0.pdf` (inferred context), `FRONTEND_INTEGRATION.md`, and the current codebase, I have designed a full-stack integration plan.

### Architecture Overview
- **Frontend (Next.js)**: Handles user wallet connection (Solana Wallet Adapter), signs transactions, and interacts directly with the smart contract for critical actions (betting, creating events).
- **Backend (Next.js API)**: Acts as an AI agent to generate market metadata (titles, descriptions) and potentially indexes on-chain events for faster querying (though for this hackathon demo, direct chain reads or mock data are used).
- **Contract (Solana Program)**: Stores the state of markets (events), holds the prize pool, and handles settlement.

### Implementation Plan

#### 1. Install Dependencies
Install the required Solana and Anchor libraries to interact with the program.
- `npm install @coral-xyz/anchor @solana/spl-token`

#### 2. Define Contract Interface (IDL)
Since the `target/idl/soldora.json` is not available in the frontend project, I will create a TypeScript definition `src/lib/soldora-idl.ts` based on the `FRONTEND_INTEGRATION.md` and the Rust source code. This will ensure type safety for our contract calls.

#### 3. Create Contract Hook (`useSoldoraProgram`)
I will encapsulate all Solana interactions in a custom hook `src/hooks/useSoldoraProgram.ts`. This hook will provide:
- `createEvent`: For users to publish a new prediction market on-chain.
- `placeBet`: For users to bet SOL on 'Yes' or 'No'.
- `redeemWinnings`: For winners to claim their prizes.
- `fetchEvents`: To load market data directly from the blockchain.

#### 4. Integrate "Create Market" Flow
Update `src/app/create/page.tsx`:
- Keep the AI generation feature (`api.generateChallenge`) to help users fill in the form.
- Update the "Submit" button to call `createEvent` from our new hook, triggering a wallet transaction to create the market on Solana.

#### 5. Integrate "Place Bet" Flow
Update `src/app/market/[id]/page.tsx`:
- Replace the mock `api.placeBet` call with the real `placeBet` function from our hook.
- Real-time interaction: The user will sign a transaction to transfer SOL to the program's prize pool.

### Verification
- I will verify the implementation by checking if the code compiles without type errors.
- Since I cannot run a local Solana validator node easily in this environment, I will ensure the code logic matches the integration guide exactly.
