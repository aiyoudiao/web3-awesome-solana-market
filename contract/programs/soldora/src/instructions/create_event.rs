use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::state::*;
use crate::errors::*;

pub fn create_event(
    ctx: Context<CreateEvent>,
    unique_id: u64,
    description: String,
    deadline: i64,
) -> Result<()> {
    let event = &mut ctx.accounts.event;

    // authorise input
    require!(description.len() <= 256, SoldoraError::DescriptionTooLong);
    require!(deadline > Clock::get()?.unix_timestamp, SoldoraError::InvalidDeadline);

    // initialize event data
    event.authority = ctx.accounts.authority.key();
    event.unique_id = unique_id;
    event.description = description;
    event.deadline = deadline;
    event.status = EventStatus::Active;
    event.result = None;
    event.yes_mint = ctx.accounts.yes_mint.key();
    event.no_mint = ctx.accounts.no_mint.key();
    event.prize_pool = ctx.accounts.prize_pool.key();
    event.yes_supply = 0;
    event.no_supply = 0;
    
    msg!("Event created with ID: {}", unique_id);
    Ok(())
}

#[derive(Accounts)]
#[instruction(unique_id: u64)]
pub struct CreateEvent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Event::LEN,
        seeds = [b"event", authority.key().as_ref(), unique_id.to_le_bytes().as_ref()],
        bump
    )]
    pub event: Account<'info, Event>,

    #[account(
        seeds = [b"prize_pool", event.key().as_ref()],
        bump
    )]
    pub prize_pool: SystemAccount<'info>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = event,
    )]
    pub yes_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = event,
    )]
    pub no_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

}