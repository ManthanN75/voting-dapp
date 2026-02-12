use anchor_lang::prelude::*;
#[account]
#[derive(InitSpace)]
pub struct TreasuryConfig {
    pub authority: Pubkey,
    pub x_mint: Pubkey,
    pub treasury_token_account: Pubkey,
    pub sol_price: u64,
    pub tokens_per_purchase: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]

pub struct Voter{
    pub voter_id: Pubkey,
    pub proposal_voted: u8,
}