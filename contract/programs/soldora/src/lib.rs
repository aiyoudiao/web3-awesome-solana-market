use anchor_lang::prelude::*;

// declaration mods
pub mod state;
pub mod errors;
pub mod instructions;
pub const FEE_RATE: u64 = 200; // 2% = 200 basis points (200/10000)
pub const FEE_DENOMINATOR: u64 = 10000;
// import mods contnent
use instructions::*;

declare_id!("8R7TCzkhdURCAWdwEiqbZAFVnRNkXVCG4XVgHjLGhUNH");


#[program]
pub mod soldora {
    use super::*;

    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        instructions::initialize_treasury::initialize_treasury(ctx)
    }

    pub fn create_event(
        ctx: Context<CreateEvent>,
        unique_id: u64,
        description: String,
        deadline: i64,
    ) -> Result<()> {
        instructions::create_event::create_event(ctx, unique_id, description, deadline)
    }

    pub fn bet(
        ctx: Context<Bet>,
        amount: u64,
        choice: bool,
    ) -> Result<()> {
        instructions::bet::bet(ctx, amount, choice)
    }

    pub fn update_result(
        ctx: Context<UpdateResult>,
        result: bool,
    ) -> Result<()> {
        instructions::update_result::update_result(ctx, result)
    }

    pub fn redeem(
        ctx: Context<Redeem>,
        choice: bool,
    ) -> Result<()> {
        instructions::redeem::redeem(ctx, choice)
    }
}
