use anchor_lang::prelude::*;
use crate::state::*;

pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    
    treasury.authority = ctx.accounts.authority.key();
    treasury.total_fees = 0;
    treasury.bump = ctx.bumps.treasury;
    
    msg!("Treasury initialized with authority: {}", treasury.authority);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,  // 部署者/管理员
    
    #[account(
        init,
        payer = authority,
        space = Treasury::LEN,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub system_program: Program<'info, System>,
}