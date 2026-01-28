use anchor_lang::prelude::*;

#[account]
pub struct Event {
    pub authority: Pubkey,
    pub unique_id: u64,
    pub description: String,
    pub deadline: i64,
    pub status: EventStatus,
    pub result: Option<bool>,
    pub yes_mint: Pubkey,
    pub no_mint: Pubkey,
    pub prize_pool: Pubkey,
    pub yes_supply: u64,
    pub no_supply: u64,
}

impl Event {
    pub const LEN: usize = 8 + // Anchor discriminator
        32 + // authority
        8 + // unique_id
        4 + 256 + // description (max 256 bytes)
        8 + // deadline
        1 + // status
        1 + 1 + // result (Option<bool>)
        32 + // yes_mint
        32 + // no_mint
        32 + // prize_pool
        8 + // yes_supply
        8; // no_supply
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EventStatus {
    Active,
    Resolved,
}


#[account]
pub struct Treasury {
    pub authority: Pubkey, // admin's address
    pub total_fees: u64,
    pub bump: u8,
}

impl Treasury {
    pub const LEN: usize = 8 + 32 + 8 + 1;
}