# 前端对接指南

## 📦 安装依赖
```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

## 🔧 初始化配置
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import idl from "./idl/soldora.json"; // 从 target/idl/ 复制

// 配置连接
const connection = new Connection("https://api.devnet.solana.com");
const wallet = /* 你的钱包适配器 */;
const provider = new AnchorProvider(connection, wallet, {});
const programId = new PublicKey("你的 Program ID");
const program = new Program(idl, programId, provider);
```

## 🎯 核心功能实现

### 1. 获取事件列表
```typescript
async function fetchEvents() {
  const events = await program.account.event.all();
  
  return events.map(e => ({
    publicKey: e.publicKey.toString(),
    authority: e.account.authority.toString(),
    uniqueId: e.account.uniqueId.toString(),
    description: e.account.description,
    deadline: new Date(e.account.deadline.toNumber() * 1000),
    status: e.account.status.active ? "Active" : "Resolved",
    result: e.account.result,
    yesMint: e.account.yesMint.toString(),
    noMint: e.account.noMint.toString(),
    yesSupply: e.account.yesSupply.toString(),
    noSupply: e.account.noSupply.toString(),
  }));
}
```

### 2. 用户下注
```typescript
import { getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

async function placeBet(
  eventPda: PublicKey,
  yesMint: PublicKey,
  noMint: PublicKey,
  amount: number, // SOL 数量
  choice: boolean // true = Yes, false = No
) {
  const user = provider.wallet.publicKey;
  
  // 计算 PDA
  const [prizePoolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("prize_pool"), eventPda.toBuffer()],
    programId
  );
  
  // 获取或创建 ATA
  const userYesAta = await getAssociatedTokenAddress(yesMint, user);
  const userNoAta = await getAssociatedTokenAddress(noMint, user);
  
  const tx = await program.methods
    .bet(new anchor.BN(amount * 1e9), choice)
    .accounts({
      user,
      event: eventPda,
      prizePool: prizePoolPda,
      yesMint,
      noMint,
      userYesAta,
      userNoAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
    
  return tx;
}
```

### 3. 查询用户持仓
```typescript
async function getUserPosition(
  yesMint: PublicKey,
  noMint: PublicKey,
  userPubkey: PublicKey
) {
  const userYesAta = await getAssociatedTokenAddress(yesMint, userPubkey);
  const userNoAta = await getAssociatedTokenAddress(noMint, userPubkey);
  
  try {
    const yesBalance = await connection.getTokenAccountBalance(userYesAta);
    const noBalance = await connection.getTokenAccountBalance(noMint);
    
    return {
      yes: yesBalance.value.uiAmount || 0,
      no: noBalance.value.uiAmount || 0,
    };
  } catch {
    return { yes: 0, no: 0 };
  }
}
```

### 4. 兑换奖金
```typescript
async function redeemWinnings(
  eventPda: PublicKey,
  yesMint: PublicKey,
  noMint: PublicKey,
  choice: boolean // true = 兑换 Yes, false = 兑换 No
) {
  const user = provider.wallet.publicKey;
  
  const [prizePoolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("prize_pool"), eventPda.toBuffer()],
    programId
  );
  
  const [treasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    programId
  );
  
  const winnerMint = choice ? yesMint : noMint;
  const userTokenAccount = await getAssociatedTokenAddress(winnerMint, user);
  
  const tx = await program.methods
    .redeem(choice)
    .accounts({
      user,
      event: eventPda,
      prizePool: prizePoolPda,
      treasury: treasuryPda,
      yesMint,
      noMint,
      winnerMint,
      userTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
    
  return tx;
}
```

### 5. 实时计算赔率
```typescript
async function calculateOdds(eventPda: PublicKey) {
  const event = await program.account.event.fetch(eventPda);
  
  const [prizePoolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("prize_pool"), eventPda.toBuffer()],
    programId
  );
  
  const prizePoolBalance = await connection.getBalance(prizePoolPda);
  
  const yesSupply = event.yesSupply.toNumber();
  const noSupply = event.noSupply.toNumber();
  
  return {
    yes: yesSupply > 0 ? prizePoolBalance / yesSupply : 0,
    no: noSupply > 0 ? prizePoolBalance / noSupply : 0,
    prizePool: prizePoolBalance / 1e9, // 转换为 SOL
  };
}
```

## 🎨 UI 组件示例

### 事件卡片
```tsx
function EventCard({ event }) {
  const [odds, setOdds] = useState(null);
  
  useEffect(() => {
    calculateOdds(new PublicKey(event.publicKey)).then(setOdds);
  }, [event]);
  
  return (
    <div className="event-card">
      <h3>{event.description}</h3>
      <p>截止时间: {event.deadline.toLocaleString()}</p>
      <p>状态: {event.status}</p>
      {odds && (
        <div>
          <p>Yes 赔率: {odds.yes.toFixed(2)}</p>
          <p>No 赔率: {odds.no.toFixed(2)}</p>
          <p>奖池: {odds.prizePool.toFixed(2)} SOL</p>
        </div>
      )}
    </div>
  );
}
```

## 📝 注意事项

1. **金额单位**：Solana 使用 lamports（1 SOL = 1,000,000,000 lamports）
2. **PDA 计算**：确保 seeds 顺序和类型正确
3. **错误处理**：捕获交易错误并展示友好提示
4. **钱包连接**：使用 @solana/wallet-adapter-react

## 🔗 完整示例

参考 `tests/soldora.ts` 中的测试代码，里面有所有接口的完整调用示例。
