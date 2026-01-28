use anchor_lang::prelude::*;

#[error_code]
pub enum SoldoraError {
    #[msg("Description is too long (max 256 characters)")]
    DescriptionTooLong,

    #[msg("Event deadline must be in the future")]
    InvalidDeadline,

    #[msg("Event is not active")]
    EventNotActive,

    #[msg("Event has expired")]
    EventExPired,

    #[msg("Bet amount too low (minimum 0.001 SOL)")]
    BetAmountTooLow,

    #[msg("Event already resolved")]
    EventAlreadyResolved,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Deadline not reached yet")]
    DeadlineNotReached,

    #[msg("Event is not resolved yet")]
    EventNotResolved,

    #[msg("Sorry, you lost this prediction")]
    YouLost,

    #[msg("No tokens to redeem")]
    NoTokensToRedeem,

    #[msg("No winner supply (edge case)")]
    NoWinnerSupply,

    #[msg("Payout amount too small")]
    PayoutTooSmall,

    #[msg("Invalid mint provided")]
    InvalidMint,
}