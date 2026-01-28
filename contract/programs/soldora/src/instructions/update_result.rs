use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, set_authority, SetAuthority};
use anchor_spl::token::spl_token::instruction::AuthorityType;

use crate::state::*;
use crate::errors::*;

pub fn update_result(
    ctx: Context<UpdateResult>,
    result: bool,  // true = Yes wins, false = No wins
) -> Result<()> {
    let event = &mut ctx.accounts.event;
    
    // 1. 验证调用者是管理员
    require!(
        ctx.accounts.authority.key() == event.authority,
        SoldoraError::Unauthorized
    );
    
    // 2. 验证事件状态为 Active
    require!(
        event.status == EventStatus::Active,
        SoldoraError::EventNotActive
    );
    
    // 3. 验证已过 deadline（关键！）
    let current_time = Clock::get()?.unix_timestamp;
    require!(
        current_time >= event.deadline,
        SoldoraError::DeadlineNotReached
    );
    
    // 4. 更新事件结果和状态
    event.result = Some(result);
    event.status = EventStatus::Resolved;
    
    // 5. 锁定 mint authority（防止后续再 mint token）
    // 准备 PDA 签名
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
    
    // 将 Yes mint authority 设为 None
    let cpi_accounts_yes = SetAuthority {
        account_or_mint: ctx.accounts.yes_mint.to_account_info(),
        current_authority: event.to_account_info(),
    };
    let cpi_ctx_yes = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts_yes,
        signer,
    );
    set_authority(cpi_ctx_yes, AuthorityType::MintTokens, None)?;
    
    // 将 No mint authority 设为 None
    let cpi_accounts_no = SetAuthority {
        account_or_mint: ctx.accounts.no_mint.to_account_info(),
        current_authority: event.to_account_info(),
    };
    let cpi_ctx_no = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts_no,
        signer,
    );
    set_authority(cpi_ctx_no, AuthorityType::MintTokens, None)?;
    
    msg!(
        "Event {} resolved: {} wins (Yes supply: {}, No supply: {})",
        event.unique_id,
        if result { "Yes" } else { "No" },
        event.yes_supply,
        event.no_supply
    );
    
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateResult<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,  // 管理员
    
    #[account(
        mut,
        seeds = [b"event", event.authority.as_ref(), event.unique_id.to_le_bytes().as_ref()],
        bump,
        has_one = authority @ SoldoraError::Unauthorized,  // 验证调用者是创建者
        has_one = yes_mint,
        has_one = no_mint,
    )]
    pub event: Account<'info, Event>,
    
    #[account(mut)]
    pub yes_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub no_mint: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
}