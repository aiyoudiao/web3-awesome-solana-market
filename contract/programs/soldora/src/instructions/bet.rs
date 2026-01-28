use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token::{mint_to, Mint, MintTo, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

use crate::state::*;
use crate::errors::*;

pub fn bet(
    ctx: Context<Bet>,
    amount: u64,
    choice: bool, // true = Yes, false = No
) -> Result<()> {
    let event = &mut ctx.accounts.event;

    // 1. authorise event status
    require!(event.status == EventStatus::Active, SoldoraError::EventNotActive);

    // 2. authorise deadline
    let current_time = Clock::get()?.unix_timestamp;
    require!(current_time < event.deadline, SoldoraError::EventExPired);

    // 3. authorise bet amount (min 0.001SOL)
    require!(amount >= 1_000_000, SoldoraError::BetAmountTooLow);

    // 4. transfer SOL to Prize pool
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.prize_pool.to_account_info(),
        },
    );
    transfer(cpi_context, amount)?;

    // 5. compute SPL-token amount to mint (1:1 for simple implement)
    let mint_amount = amount;

    // 6. Mint Tokens to user's ATA
    let (mint_account, token_account) = if choice {
        (ctx.accounts.yes_mint.to_account_info(), ctx.accounts.user_yes_ata.to_account_info())
    } else {
        (ctx.accounts.no_mint.to_account_info(), ctx.accounts.user_no_ata.to_account_info())
    };

    // 7. prepare PDA signment
    let authority_key = event.authority;
    let unique_id_bytes = event.unique_id.to_le_bytes();
    let bump = ctx.bumps.event;

    let seeds = &[
        b"event".as_ref(),
        authority_key.as_ref(),
        unique_id_bytes.as_ref(),
        &[bump],
    ];
    let signer = &[&seeds[..]];
    
    // 8. Mint tokens
    let cpi_accounts = MintTo {
        mint: mint_account,
        to: token_account,
        authority: event.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    mint_to(cpi_ctx, mint_amount)?;
    
    // 9. update supply statistics
    if choice {
        event.yes_supply = event.yes_supply.checked_add(mint_amount).unwrap();
    } else {
        event.no_supply = event.no_supply.checked_add(mint_amount).unwrap();
    }
    
    msg!(
        "Bet placed: {} SOL ({} lamports) on {}",
        amount as f64 / 1_000_000_000.0,
        amount,
        if choice { "Yes" } else { "No" }
    );
    
    Ok(())
}

#[derive(Accounts)]
pub struct Bet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
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
    /// CHECK: Prize pool PDA，接收 SOL
    pub prize_pool: AccountInfo<'info>,
    
    #[account(mut)]
    pub yes_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub no_mint: Account<'info, Mint>,
    
    // user's Yes token ATA（if don't exist will autimatically create）
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = yes_mint,
        associated_token::authority = user,
    )]
    pub user_yes_ata: Account<'info, TokenAccount>,
    
    // user's No token ATA（if don't exist will autimatically create）
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = no_mint,
        associated_token::authority = user,
    )]
    pub user_no_ata: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}