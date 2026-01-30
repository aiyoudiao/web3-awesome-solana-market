/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/soldora.json`.
 */
export type Soldora = {
  "address": "42MGvXQ8uDAYaoMYezkQw6dDr3RYtWNNKc5JGCB3Jp99",
  "metadata": {
    "name": "soldora",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "bet",
      "discriminator": [
        94,
        203,
        166,
        126,
        20,
        243,
        169,
        82
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "event",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event.authority",
                "account": "event"
              },
              {
                "kind": "account",
                "path": "event.unique_id",
                "account": "event"
              }
            ]
          }
        },
        {
          "name": "prizePool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  105,
                  122,
                  101,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          },
          "relations": [
            "event"
          ]
        },
        {
          "name": "yesMint",
          "writable": true,
          "relations": [
            "event"
          ]
        },
        {
          "name": "noMint",
          "writable": true,
          "relations": [
            "event"
          ]
        },
        {
          "name": "userYesAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "yesMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userNoAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "noMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "choice",
          "type": "bool"
        }
      ]
    },
    {
      "name": "createEvent",
      "discriminator": [
        49,
        219,
        29,
        203,
        22,
        98,
        100,
        87
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "event",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "uniqueId"
              }
            ]
          }
        },
        {
          "name": "prizePool",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  105,
                  122,
                  101,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          }
        },
        {
          "name": "yesMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "noMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "uniqueId",
          "type": "u64"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "deadline",
          "type": "i64"
        }
      ]
    },
    {
      "name": "initializeTreasury",
      "discriminator": [
        124,
        186,
        211,
        195,
        85,
        165,
        129,
        166
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "redeem",
      "discriminator": [
        184,
        12,
        86,
        149,
        70,
        196,
        97,
        225
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "event",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event.authority",
                "account": "event"
              },
              {
                "kind": "account",
                "path": "event.unique_id",
                "account": "event"
              }
            ]
          }
        },
        {
          "name": "prizePool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  105,
                  122,
                  101,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          },
          "relations": [
            "event"
          ]
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "yesMint",
          "relations": [
            "event"
          ]
        },
        {
          "name": "noMint",
          "relations": [
            "event"
          ]
        },
        {
          "name": "winnerMint",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "choice",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateResult",
      "discriminator": [
        145,
        72,
        9,
        94,
        61,
        97,
        126,
        106
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "event"
          ]
        },
        {
          "name": "event",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event.authority",
                "account": "event"
              },
              {
                "kind": "account",
                "path": "event.unique_id",
                "account": "event"
              }
            ]
          }
        },
        {
          "name": "yesMint",
          "writable": true,
          "relations": [
            "event"
          ]
        },
        {
          "name": "noMint",
          "writable": true,
          "relations": [
            "event"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "result",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "event",
      "discriminator": [
        125,
        192,
        125,
        158,
        9,
        115,
        152,
        233
      ]
    },
    {
      "name": "treasury",
      "discriminator": [
        238,
        239,
        123,
        238,
        89,
        1,
        168,
        253
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "descriptionTooLong",
      "msg": "Description is too long (max 256 characters)"
    },
    {
      "code": 6001,
      "name": "invalidDeadline",
      "msg": "Event deadline must be in the future"
    },
    {
      "code": 6002,
      "name": "eventNotActive",
      "msg": "Event is not active"
    },
    {
      "code": 6003,
      "name": "eventExPired",
      "msg": "Event has expired"
    },
    {
      "code": 6004,
      "name": "betAmountTooLow",
      "msg": "Bet amount too low (minimum 0.001 SOL)"
    },
    {
      "code": 6005,
      "name": "eventAlreadyResolved",
      "msg": "Event already resolved"
    },
    {
      "code": 6006,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6007,
      "name": "deadlineNotReached",
      "msg": "Deadline not reached yet"
    },
    {
      "code": 6008,
      "name": "eventNotResolved",
      "msg": "Event is not resolved yet"
    },
    {
      "code": 6009,
      "name": "youLost",
      "msg": "Sorry, you lost this prediction"
    },
    {
      "code": 6010,
      "name": "noTokensToRedeem",
      "msg": "No tokens to redeem"
    },
    {
      "code": 6011,
      "name": "noWinnerSupply",
      "msg": "No winner supply (edge case)"
    },
    {
      "code": 6012,
      "name": "payoutTooSmall",
      "msg": "Payout amount too small"
    },
    {
      "code": 6013,
      "name": "invalidMint",
      "msg": "Invalid mint provided"
    }
  ],
  "types": [
    {
      "name": "event",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "uniqueId",
            "type": "u64"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "eventStatus"
              }
            }
          },
          {
            "name": "result",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "yesMint",
            "type": "pubkey"
          },
          {
            "name": "noMint",
            "type": "pubkey"
          },
          {
            "name": "prizePool",
            "type": "pubkey"
          },
          {
            "name": "yesSupply",
            "type": "u64"
          },
          {
            "name": "noSupply",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "eventStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "resolved"
          }
        ]
      }
    },
    {
      "name": "treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalFees",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
