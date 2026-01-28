The error `TypeError: Cannot read properties of undefined (reading '_bn')` when initializing the `Program` class is likely due to an invalid `PROGRAM_ID` or how it's being passed. In the current implementation, `PROGRAM_ID` is a `PublicKey` object. However, `new Program(IDL, PROGRAM_ID, provider)` in older Anchor versions expected `PROGRAM_ID` to be an address, but in newer versions (which we are using, `0.32.1`), the constructor signature is `new Program(idl, provider)`.

The error specifically happens at `new Program(...)`.

If I look at the `TypeError: Cannot read properties of undefined (reading '_bn')`, this usually happens when a `PublicKey` is expected but `undefined` or something else is passed, and the code tries to access `_bn` (the internal BN of the public key).

If I am using `new Program(IDL as any, PROGRAM_ID, provider)`, and Anchor 0.32 expects `new Program(idl, provider)`, then `PROGRAM_ID` is being treated as the `provider` argument. The `Program` constructor tries to access `provider.connection` or similar. If it tries to use the second argument as a Provider, it will fail.

BUT, if I use `new Program(IDL as any, provider)`, I previously got `Account not found: event`.

The `Account not found: event` error suggests the Program was initialized, but it failed to build the account namespace because of the IDL.

The `TypeError: Cannot read properties of undefined (reading '_bn')` suggests it failed even earlier, likely when parsing the `address` from the IDL if I provided it, or when validating the arguments.

Wait, I removed `address` from the IDL in the previous step. So `idl.address` is undefined.

If I call `new Program(idl, provider)`, and `idl.address` is undefined, Anchor 0.30+ throws an error because it needs the address.

So I MUST provide the address.

In Anchor 0.30+, if `idl.address` is missing, you can pass the address as the second argument? No, the signature changed.

The correct way in Anchor 0.30+ is to ensure `idl.address` is present.

So the plan is:
1.  Restore `address` in `soldora-idl.ts`.
2.  Revert `useSoldoraProgram.ts` to use `new Program(IDL as any, provider)`.
3.  Ensure `IDL` has the `event` account definition (which I already did).

Wait, I already tried `new Program(IDL, provider)` with `address` in IDL, and I got `Account not found: event`. That was because of the casing issue (`Event` vs `event`). I fixed the casing but THEN I removed the address and switched to `new Program(IDL, PROGRAM_ID, provider)`, which caused the `TypeError`.

So, the combination of "Fix Casing" + "Restore Address in IDL" + "Use new Program(IDL, provider)" should work.

I will:
1.  Add `address` back to `soldora-idl.ts`.
2.  Update `useSoldoraProgram.ts` to `new Program(IDL as any, provider)`.
