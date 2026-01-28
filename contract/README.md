# Soldora - 去中心化预测市场

基于 Solana 的预测市场智能合约，支持用户对未来事件进行预测和下注。

## 🎯 核心功能

- ✅ **事件创建**：管理员创建预测事件（Active 状态）
- ✅ **用户下注**：用户使用 SOL 下注 Yes/No
- ✅ **结果公布**：管理员在 deadline 后公布结果
- ✅ **兑换奖金**：赢家按比例分配奖池（扣除 2% 手续费）
- ✅ **手续费系统**：2% 手续费归入 Treasury

## 📦 项目结构
```
soldora/
├── programs/soldora/src/
│   ├── lib.rs                    # 程序入口
│   ├── state.rs                  # 账户结构定义
│   ├── errors.rs                 # 错误定义
│   └── instructions/
│       ├── create_event.rs       # 创建事件
│       ├── bet.rs                # 用户下注
│       ├── update_result.rs      # 公布结果
│       ├── redeem.rs             # 兑换奖金
│       └── initialize_treasury.rs # 初始化 Treasury
├── tests/soldora.ts              # 测试用例
└── target/idl/soldora.json       # IDL 文件（前端对接）
```

## 🚀 快速开始

### 环境要求

- Rust 1.75+
- Solana CLI 1.18+
- Anchor 0.30.1+
- Node.js 16+

### 安装依赖
```bash
# 克隆仓库
git clone https://github.com/你的用户名/soldora.git
cd soldora

# 安装 npm 依赖
yarn install

# 构建程序
anchor build
```

### 运行测试
```bash
anchor test
```

### 部署到 Devnet
```bash
# 切换到 devnet
solana config set --url devnet

# 创建钱包（如果没有）
solana-keygen new -o ~/.config/solana/devnet-wallet.json

# 空投测试 SOL
solana airdrop 2

# 部署
anchor deploy
```

## 📝 合约接口说明

### 1. Initialize Treasury（部署后首次调用）
```typescript
await program.methods
  .initializeTreasury()
  .accounts({
    authority: adminWallet.publicKey,
  })
  .rpc();
```

### 2. Create Event（管理员创建事件）
```typescript
const uniqueId = new BN(Date.now());
const description = "Will BTC reach $100k by 2025?";
const deadline = new BN(Math.floor(Date.now() / 1000) + 86400); // 24小时后

// 生成 mint keypairs
const yesMint = Keypair.generate();
const noMint = Keypair.generate();

// 计算 PDA
const [eventPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("event"),
    adminWallet.publicKey.toBuffer(),
    uniqueId.toArrayLike(Buffer, "le", 8),
  ],
  program.programId
);

const [prizePoolPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("prize_pool"), eventPda.toBuffer()],
  program.programId
);

await program.methods
  .createEvent(uniqueId, description, deadline)
  .accounts({
    authority: adminWallet.publicKey,
    event: eventPda,
    prizePool: prizePoolPda,
    yesMint: yesMint.publicKey,
    noMint: noMint.publicKey,
  })
  .signers([yesMint, noMint])
  .rpc();
```

**返回数据：**
- `eventPda`: 事件账户地址
- `yesMint`: Yes token mint 地址
- `noMint`: No token mint 地址
- `prizePoolPda`: 奖池地址

### 3. Bet（用户下注）
```typescript
const betAmount = new BN(1_000_000_000); // 1 SOL
const choice = true; // true = Yes, false = No

// 获取用户 ATA
const userYesAta = await getAssociatedTokenAddress(
  yesMint,
  userWallet.publicKey
);
const userNoAta = await getAssociatedTokenAddress(
  noMint,
  userWallet.publicKey
);

await program.methods
  .bet(betAmount, choice)
  .accounts({
    user: userWallet.publicKey,
    event: eventPda,
    prizePool: prizePoolPda,
    yesMint: yesMint,
    noMint: noMint,
    userYesAta: userYesAta,
    userNoAta: userNoAta,
  })
  .rpc();
```

**参数：**
- `amount`: 下注金额（单位：lamports，1 SOL = 1,000,000,000 lamports）
- `choice`: true = 下注 Yes，false = 下注 No

**效果：**
- 用户 SOL 转入奖池
- 用户获得对应数量的 Yes/No tokens

### 4. Update Result（管理员公布结果）
```typescript
const result = true; // true = Yes 赢, false = No 赢

await program.methods
  .updateResult(result)
  .accounts({
    authority: adminWallet.publicKey,
    event: eventPda,
    yesMint: yesMint,
    noMint: noMint,
  })
  .rpc();
```

**限制：**
- 只能在 deadline 之后调用
- 只有事件创建者可以调用

### 5. Redeem（用户兑换奖金）
```typescript
const choice = true; // 兑换 Yes tokens（true）或 No tokens（false）

// 获取对应的 mint 和 ATA
const winnerMint = choice ? yesMint : noMint;
const userTokenAccount = await getAssociatedTokenAddress(
  winnerMint,
  userWallet.publicKey
);

const [treasuryPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("treasury")],
  program.programId
);

await program.methods
  .redeem(choice)
  .accounts({
    user: userWallet.publicKey,
    event: eventPda,
    prizePool: prizePoolPda,
    treasury: treasuryPda,
    yesMint: yesMint,
    noMint: noMint,
    winnerMint: winnerMint,
    userTokenAccount: userTokenAccount,
  })
  .rpc();
```

**计算公式：**
```
用户应得 = (用户持有 tokens / 赢方总 supply) * 奖池余额 * 98%
手续费 = 用户应得 * 2%
```

**限制：**
- 只能兑换赢方的 tokens
- 输家调用会报错：`YouLost`

## 📊 数据结构

### Event 账户
```rust
pub struct Event {
    pub authority: Pubkey,      // 创建者地址
    pub unique_id: u64,         // 唯一 ID
    pub description: String,    // 事件描述
    pub deadline: i64,          // 截止时间（Unix timestamp）
    pub status: EventStatus,    // Active | Resolved
    pub result: Option<bool>,   // None | Some(true/false)
    pub yes_mint: Pubkey,       // Yes token mint
    pub no_mint: Pubkey,        // No token mint
    pub prize_pool: Pubkey,     // 奖池 PDA
    pub yes_supply: u64,        // Yes token 总量
    pub no_supply: u64,         // No token 总量
}
```

### Treasury 账户
```rust
pub struct Treasury {
    pub authority: Pubkey,      // 管理员地址
    pub total_fees: u64,        // 累计手续费
    pub bump: u8,
}
```

## 🔑 PDA Seeds
```rust
// Event PDA
seeds: [b"event", authority, unique_id.to_le_bytes()]

// Prize Pool PDA
seeds: [b"prize_pool", event_pda]

// Treasury PDA
seeds: [b"treasury"]
```

## 🎨 前端对接示例

### 查询事件列表
```typescript
// 获取所有事件账户
const events = await program.account.event.all();

// 过滤 Active 状态的事件
const activeEvents = events.filter(e => e.account.status.active !== undefined);

// 过滤 Resolved 状态的事件
const resolvedEvents = events.filter(e => e.account.status.resolved !== undefined);
```

### 查询奖池余额
```typescript
const prizePoolBalance = await connection.getBalance(prizePoolPda);
console.log("奖池余额:", prizePoolBalance / LAMPORTS_PER_SOL, "SOL");
```

### 查询用户持仓
```typescript
const userYesAta = await getAssociatedTokenAddress(yesMint, userWallet.publicKey);
const userYesBalance = await connection.getTokenAccountBalance(userYesAta);
console.log("Yes tokens:", userYesBalance.value.uiAmount);
```

### 计算当前赔率
```typescript
const event = await program.account.event.fetch(eventPda);
const prizePoolBalance = await connection.getBalance(prizePoolPda);

// Yes 赔率 = 奖池 / Yes supply
const yesOdds = prizePoolBalance / event.yesSupply.toNumber();

// No 赔率 = 奖池 / No supply
const noOdds = prizePoolBalance / event.noSupply.toNumber();

console.log("Yes 赔率:", yesOdds);
console.log("No 赔率:", noOdds);
```

## 🐛 常见错误

| 错误代码 | 说明 | 解决方法 |
|---------|------|---------|
| `EventNotActive` | 事件未激活 | 确保事件状态为 Active |
| `EventExpired` | 事件已过期 | 无法再下注 |
| `DeadlineNotReached` | 未到截止时间 | 等待 deadline 后再公布结果 |
| `YouLost` | 你输了 | 只能兑换赢方 tokens |
| `NoTokensToRedeem` | 没有 tokens | 确保持有对应 tokens |

## 📄 License

MIT

## 📞 联系方式

有问题请提 Issue 或联系 [@你的联系方式]
