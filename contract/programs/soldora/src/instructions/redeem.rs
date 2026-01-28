use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token::{burn, Burn, Mint, Token, TokenAccount};

use crate::state::*;
use crate::errors::*;

pub fn redeem(
    ctx: Context<Redeem>,
    choice: bool,  // true = 兑换 Yes tokens, false = 兑换 No tokens
) -> Result<()> {
    let event = &ctx.accounts.event;
    
    // 1. 验证事件已经 Resolved
    require!(
        event.status == EventStatus::Resolved,
        SoldoraError::EventNotResolved
    );
    
    // 2. 验证事件有结果
    let result = event.result.ok_or(SoldoraError::EventNotResolved)?;
    
    // 3. 验证用户选择的 token 是否是赢方
    require!(
        choice == result,
        SoldoraError::YouLost
    );
    
    // 4. 获取用户持有的 token 数量
    let user_token_balance = ctx.accounts.user_token_account.amount;
    require!(
        user_token_balance > 0,
        SoldoraError::NoTokensToRedeem
    );
    
    // 5. 计算赢方总供应量
    let winner_supply = if result {
        event.yes_supply
    } else {
        event.no_supply
    };
    
    // 防止除以 0
    require!(
        winner_supply > 0,
        SoldoraError::NoWinnerSupply
    );
    
    // 6. 获取奖池余额
    let prize_pool_balance = ctx.accounts.prize_pool.lamports();
    
    // 7. 计算用户应得的 SOL
    // payout = (user_balance / winner_supply) * prize_pool_balance
    let payout = (user_token_balance as u128)
        .checked_mul(prize_pool_balance as u128)
        .unwrap()
        .checked_div(winner_supply as u128)
        .unwrap() as u64;
    
    require!(payout > 0, SoldoraError::PayoutTooSmall);

    let fee = payout
        .checked_mul(crate::FEE_RATE)
        .unwrap()
        .checked_div(crate::FEE_DENOMINATOR)
        .unwrap();

    let user_payout = payout.checked_sub(fee).unwrap();

    // prepare PDA signer
    let prize_pool_seed = event.key();
    let bump = ctx.bumps.prize_pool;
    let seeds = &[
        b"prize_pool".as_ref(),
        prize_pool_seed.as_ref(),
        &[bump],
    ];
    let signer = &[&seeds[..]];

    // transfer fee to treasury first
    if fee > 0 {
        let cpi_context_fee = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.prize_pool.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
            signer,
        );
        transfer(cpi_context_fee, fee)?;

        // update treasury statistics
        let treasury = &mut ctx.accounts.treasury;
        treasury.total_fees = treasury.total_fees.checked_add(fee).unwrap();
    }
    
    // 8. 从奖池转账 SOL 到用户
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.prize_pool.to_account_info(),
            to: ctx.accounts.user.to_account_info(),
        },
        signer,
    );
    transfer(cpi_context, user_payout)?;
    
    // 9. Burn 用户的 winner tokens
    let cpi_accounts = Burn {
        mint: ctx.accounts.winner_mint.to_account_info(),
        from: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );
    burn(cpi_ctx, user_token_balance)?;
    
    msg!(
        "Redeemed {} {} tokens for {} SOL ({} lamports)",
        user_token_balance,
        if choice { "Yes" } else { "No" },
        payout as f64 / 1_000_000_000.0,
        payout
    );
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(choice: bool)]
pub struct Redeem<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        seeds = [b"event", event.authority.as_ref(), event.unique_id.to_le_bytes().as_ref()],
        bump,
        has_one = yes_mint,
        has_one = no_mint,
        has_one = prize_pool,
    )]
    pub event: Account<'info, Event>,
    
    #[account(
        mut,
        seeds = [b"prize_pool", event.key().as_ref()],
        bump,
    )]
    /// CHECK: Prize pool PDA
    pub prize_pool: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"treasury"],
        bump,
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub yes_mint: Account<'info, Mint>,
    pub no_mint: Account<'info, Mint>,
    
    // 根据 choice 决定是哪个 mint
    #[account(
        mut,
        constraint = winner_mint.key() == if choice { yes_mint.key() } else { no_mint.key() }
            @ SoldoraError::InvalidMint
    )]
    pub winner_mint: Account<'info, Mint>,
    
    // 用户的 token 账户（Yes 或 No）
    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ SoldoraError::Unauthorized,
        constraint = user_token_account.mint == winner_mint.key() @ SoldoraError::InvalidMint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}