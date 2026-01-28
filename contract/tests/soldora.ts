import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Soldora } from "../target/types/soldora";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

describe("soldora", () => {
  // 配置 provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Soldora as Program<Soldora>;
  const authority = provider.wallet as anchor.Wallet;

  // 测试账户
  let userA: Keypair;
  let userB: Keypair;
  
  // Event 相关 PDA
  let eventPda: PublicKey;
  let prizePoolPda: PublicKey;
  let treasuryPda: PublicKey;
  let yesMint: Keypair;
  let noMint: Keypair;
  
  // 事件参数
  const uniqueId = new anchor.BN(Date.now());
  const description = "Will BTC reach $100k by 2026?";
  const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 5); // 5 秒钟后

  before(async () => {
    // 创建测试用户
    userA = Keypair.generate();
    userB = Keypair.generate();

    // 空投 SOL 给测试用户
    const airdropA = await provider.connection.requestAirdrop(
      userA.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropA);

    const airdropB = await provider.connection.requestAirdrop(
      userB.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropB);

    console.log("✅ Airdropped SOL to test users");
    console.log("  User A:", userA.publicKey.toString());
    console.log("  User B:", userB.publicKey.toString());

    // 初始化 mint keypairs
    yesMint = Keypair.generate();
    noMint = Keypair.generate();

    // 计算 PDA 地址
    [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );

    [eventPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("event"),
        authority.publicKey.toBuffer(),
        uniqueId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    [prizePoolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("prize_pool"), eventPda.toBuffer()],
      program.programId
    );
  });

  it("初始化 Treasury", async () => {
    const tx = await program.methods
      .initializeTreasury()
      .accounts({
        authority: authority.publicKey,
        treasury: treasuryPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Treasury initialized:", tx);

    // 验证 treasury 账户
    const treasuryAccount = await program.account.treasury.fetch(treasuryPda);
    assert.equal(treasuryAccount.authority.toString(), authority.publicKey.toString());
    assert.equal(treasuryAccount.totalFees.toNumber(), 0);
  });

  it("创建事件", async () => {
    const tx = await program.methods
      .createEvent(uniqueId, description, deadline)
      .accounts({
        authority: authority.publicKey,
        event: eventPda,
        prizePool: prizePoolPda,
        yesMint: yesMint.publicKey,
        noMint: noMint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([yesMint, noMint])
      .rpc();

    console.log("✅ Event created:", tx);

    // 验证事件账户
    const eventAccount = await program.account.event.fetch(eventPda);
    assert.equal(eventAccount.description, description);
    assert.equal(eventAccount.status.active !== undefined, true); // EventStatus::Active
    assert.equal(eventAccount.yesSupply.toNumber(), 0);
    assert.equal(eventAccount.noSupply.toNumber(), 0);

    console.log("  Event PDA:", eventPda.toString());
    console.log("  Yes Mint:", yesMint.publicKey.toString());
    console.log("  No Mint:", noMint.publicKey.toString());
  });

  it("用户 A 下注 Yes (1 SOL)", async () => {
    const betAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);

    // 计算用户 A 的 ATA 地址
    const userYesAta = await getAssociatedTokenAddress(
      yesMint.publicKey,
      userA.publicKey
    );
    const userNoAta = await getAssociatedTokenAddress(
      noMint.publicKey,
      userA.publicKey
    );

    const tx = await program.methods
      .bet(betAmount, true) // true = Yes
      .accounts({
        user: userA.publicKey,
        event: eventPda,
        prizePool: prizePoolPda,
        yesMint: yesMint.publicKey,
        noMint: noMint.publicKey,
        userYesAta: userYesAta,
        userNoAta: userNoAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([userA])
      .rpc();

    console.log("✅ User A bet 1 SOL on Yes:", tx);

    // 验证事件状态
    const eventAccount = await program.account.event.fetch(eventPda);
    assert.equal(eventAccount.yesSupply.toNumber(), 1 * LAMPORTS_PER_SOL);

    // 验证奖池余额
    const prizePoolBalance = await provider.connection.getBalance(prizePoolPda);
    console.log("  Prize Pool Balance:", prizePoolBalance / LAMPORTS_PER_SOL, "SOL");
  });

  it("用户 B 下注 No (2 SOL)", async () => {
    const betAmount = new anchor.BN(2 * LAMPORTS_PER_SOL);

    const userYesAta = await getAssociatedTokenAddress(
      yesMint.publicKey,
      userB.publicKey
    );
    const userNoAta = await getAssociatedTokenAddress(
      noMint.publicKey,
      userB.publicKey
    );

    const tx = await program.methods
      .bet(betAmount, false) // false = No
      .accounts({
        user: userB.publicKey,
        event: eventPda,
        prizePool: prizePoolPda,
        yesMint: yesMint.publicKey,
        noMint: noMint.publicKey,
        userYesAta: userYesAta,
        userNoAta: userNoAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([userB])
      .rpc();

    console.log("✅ User B bet 2 SOL on No:", tx);

    const eventAccount = await program.account.event.fetch(eventPda);
    assert.equal(eventAccount.noSupply.toNumber(), 2 * LAMPORTS_PER_SOL);

    const prizePoolBalance = await provider.connection.getBalance(prizePoolPda);
    console.log("  Prize Pool Balance:", prizePoolBalance / LAMPORTS_PER_SOL, "SOL");
    assert.approximately(
      prizePoolBalance / LAMPORTS_PER_SOL, 
      3, 
      0.02  // 允许 0.02 SOL 误差
      );
  });

  it("等待 deadline（跳过，使用模拟时间）", async () => {
    console.log("⏰ Waiting 6 seconds for deadline to pass...");

    await new Promise(resolve => setTimeout(resolve, 6000)); // 等待6秒

    console.log(" Deadline should be passed.")
  });

  it("管理员公布结果 (Yes 赢)", async () => {
    const tx = await program.methods
      .updateResult(true) // Yes wins
      .accounts({
        authority: authority.publicKey,
        event: eventPda,
        yesMint: yesMint.publicKey,
        noMint: noMint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("✅ Result updated: Yes wins:", tx);

    const eventAccount = await program.account.event.fetch(eventPda);
    assert.equal(eventAccount.status.resolved !== undefined, true);
    assert.equal(eventAccount.result, true);
  });

  it("用户 A 兑换奖金 (赢家)", async () => {
    const userYesAta = await getAssociatedTokenAddress(
      yesMint.publicKey,
      userA.publicKey
    );

    const userBalanceBefore = await provider.connection.getBalance(userA.publicKey);
    const treasuryBalanceBefore = await provider.connection.getBalance(treasuryPda);

    const tx = await program.methods
      .redeem(true) // 兑换 Yes tokens
      .accounts({
        user: userA.publicKey,
        event: eventPda,
        prizePool: prizePoolPda,
        treasury: treasuryPda,
        yesMint: yesMint.publicKey,
        noMint: noMint.publicKey,
        winnerMint: yesMint.publicKey,
        userTokenAccount: userYesAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([userA])
      .rpc();

    console.log("✅ User A redeemed:", tx);

    const userBalanceAfter = await provider.connection.getBalance(userA.publicKey);
    const treasuryBalanceAfter = await provider.connection.getBalance(treasuryPda);

    const userGain = (userBalanceAfter - userBalanceBefore) / LAMPORTS_PER_SOL;
    const treasuryFee = (treasuryBalanceAfter - treasuryBalanceBefore) / LAMPORTS_PER_SOL;

    console.log("  User A gained:", userGain.toFixed(4), "SOL");
    console.log("  Treasury fee:", treasuryFee.toFixed(4), "SOL");

    // 验证：用户应该得到 ~2.94 SOL（3 * 0.98）
    assert.approximately(userGain, 2.94, 0.01);
    // 验证：手续费应该是 ~0.06 SOL（3 * 0.02）
    assert.approximately(treasuryFee, 0.06, 0.01);
  });

  it("用户 B 尝试兑换奖金 (输家)", async () => {
    const userNoAta = await getAssociatedTokenAddress(
      noMint.publicKey,
      userB.publicKey
    );

    try {
      await program.methods
        .redeem(false) // 兑换 No tokens
        .accounts({
          user: userB.publicKey,
          event: eventPda,
          prizePool: prizePoolPda,
          treasury: treasuryPda,
          yesMint: yesMint.publicKey,
          noMint: noMint.publicKey,
          winnerMint: noMint.publicKey,
          userTokenAccount: userNoAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([userB])
        .rpc();

      assert.fail("应该报错：You lost");
    } catch (error) {
      console.log("✅ User B (loser) correctly rejected:", error.error.errorMessage);
      assert.include(error.error.errorMessage, "you lost");
    }
  });
});