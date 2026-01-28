export type Soldora = {
  "version": "0.1.0",
  "name": "soldora",
  "address": string,
  "instructions": [
    {
      "name": "initializeTreasury",
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "treasury", "writable": true, "signer": false },
        { "name": "systemProgram", "writable": false, "signer": false }
      ],
      "args": []
    },
    {
      "name": "createEvent",
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "event", "writable": true, "signer": false },
        { "name": "prizePool", "writable": false, "signer": false },
        { "name": "yesMint", "writable": true, "signer": false },
        { "name": "noMint", "writable": true, "signer": false },
        { "name": "tokenProgram", "writable": false, "signer": false },
        { "name": "systemProgram", "writable": false, "signer": false }
      ],
      "args": [
        { "name": "uniqueId", "type": "u64" },
        { "name": "description", "type": "string" },
        { "name": "deadline", "type": "i64" }
      ]
    },
    {
      "name": "bet",
      "accounts": [
        { "name": "user", "writable": true, "signer": true },
        { "name": "event", "writable": true, "signer": false },
        { "name": "prizePool", "writable": true, "signer": false },
        { "name": "yesMint", "writable": true, "signer": false },
        { "name": "noMint", "writable": true, "signer": false },
        { "name": "userYesAta", "writable": true, "signer": false },
        { "name": "userNoAta", "writable": true, "signer": false },
        { "name": "tokenProgram", "writable": false, "signer": false },
        { "name": "associatedTokenProgram", "writable": false, "signer": false },
        { "name": "systemProgram", "writable": false, "signer": false }
      ],
      "args": [
        { "name": "amount", "type": "u64" },
        { "name": "choice", "type": "bool" }
      ]
    },
    {
      "name": "updateResult",
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "event", "writable": true, "signer": false }
      ],
      "args": [
        { "name": "result", "type": "bool" }
      ]
    },
    {
      "name": "redeem",
      "accounts": [
        { "name": "user", "writable": true, "signer": true },
        { "name": "event", "writable": true, "signer": false },
        { "name": "prizePool", "writable": true, "signer": false },
        { "name": "treasury", "writable": true, "signer": false },
        { "name": "yesMint", "writable": true, "signer": false },
        { "name": "noMint", "writable": true, "signer": false },
        { "name": "winnerMint", "writable": true, "signer": false },
        { "name": "userTokenAccount", "writable": true, "signer": false },
        { "name": "tokenProgram", "writable": false, "signer": false },
        { "name": "systemProgram", "writable": false, "signer": false }
      ],
      "args": [
        { "name": "choice", "type": "bool" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Event",
      "discriminator": number[]
    }
  ],
  "types": [
    {
      "name": "Event",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "pubkey" },
          { "name": "uniqueId", "type": "u64" },
          { "name": "description", "type": "string" },
          { "name": "deadline", "type": "i64" },
          { "name": "status", "type": "u8" },
          { "name": "result", "type": { "option": "bool" } },
          { "name": "yesMint", "type": "pubkey" },
          { "name": "noMint", "type": "pubkey" },
          { "name": "prizePool", "type": "pubkey" },
          { "name": "yesSupply", "type": "u64" },
          { "name": "noSupply", "type": "u64" }
        ]
      }
    },
    {
      "name": "EventStatus",
      "type": {
        "kind": "enum",
        "variants": [
          { "name": "Active" },
          { "name": "Resolved" }
        ]
      }
    }
  ]
};

export const IDL: any = {
  "version": "0.1.0",
  "name": "soldora",
  "address": "9QNtBQoCwRhrAGjgzqL27SXzuATSD31FciUzaspX76w3",
  "instructions": [
    {
      "name": "initializeTreasury",
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "treasury", "writable": true, "signer": false },
        { "name": "systemProgram", "writable": false, "signer": false }
      ],
      "args": []
    },
    {
      "name": "createEvent",
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "event", "writable": true, "signer": false },
        { "name": "prizePool", "writable": false, "signer": false },
        { "name": "yesMint", "writable": true, "signer": false },
        { "name": "noMint", "writable": true, "signer": false },
        { "name": "tokenProgram", "writable": false, "signer": false },
        { "name": "systemProgram", "writable": false, "signer": false }
      ],
      "args": [
        { "name": "uniqueId", "type": "u64" },
        { "name": "description", "type": "string" },
        { "name": "deadline", "type": "i64" }
      ]
    },
    {
      "name": "bet",
      "accounts": [
        { "name": "user", "writable": true, "signer": true },
        { "name": "event", "writable": true, "signer": false },
        { "name": "prizePool", "writable": true, "signer": false },
        { "name": "yesMint", "writable": true, "signer": false },
        { "name": "noMint", "writable": true, "signer": false },
        { "name": "userYesAta", "writable": true, "signer": false },
        { "name": "userNoAta", "writable": true, "signer": false },
        { "name": "tokenProgram", "writable": false, "signer": false },
        { "name": "associatedTokenProgram", "writable": false, "signer": false },
        { "name": "systemProgram", "writable": false, "signer": false }
      ],
      "args": [
        { "name": "amount", "type": "u64" },
        { "name": "choice", "type": "bool" }
      ]
    },
    {
      "name": "updateResult",
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "event", "writable": true, "signer": false }
      ],
      "args": [
        { "name": "result", "type": "bool" }
      ]
    },
    {
      "name": "redeem",
      "accounts": [
        { "name": "user", "writable": true, "signer": true },
        { "name": "event", "writable": true, "signer": false },
        { "name": "prizePool", "writable": true, "signer": false },
        { "name": "treasury", "writable": true, "signer": false },
        { "name": "yesMint", "writable": true, "signer": false },
        { "name": "noMint", "writable": true, "signer": false },
        { "name": "winnerMint", "writable": true, "signer": false },
        { "name": "userTokenAccount", "writable": true, "signer": false },
        { "name": "tokenProgram", "writable": false, "signer": false },
        { "name": "systemProgram", "writable": false, "signer": false }
      ],
      "args": [
        { "name": "choice", "type": "bool" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Event",
      "discriminator": [125, 192, 125, 158, 9, 115, 152, 233]
    }
  ],
  "types": [
    {
      "name": "Event",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "pubkey" },
          { "name": "uniqueId", "type": "u64" },
          { "name": "description", "type": "string" },
          { "name": "deadline", "type": "i64" },
          { "name": "status", "type": "u8" },
          { "name": "result", "type": { "option": "bool" } },
          { "name": "yesMint", "type": "pubkey" },
          { "name": "noMint", "type": "pubkey" },
          { "name": "prizePool", "type": "pubkey" },
          { "name": "yesSupply", "type": "u64" },
          { "name": "noSupply", "type": "u64" }
        ]
      }
    },
    {
      "name": "EventStatus",
      "type": {
        "kind": "enum",
        "variants": [
          { "name": "Active" },
          { "name": "Resolved" }
        ]
      }
    }
  ]
};
