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
pub struct Voter {
    pub voter_id: Pubkey,
    pub proposal_voted: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub proposal_id: u8,
    pub number_of_votes: u8,
    pub deadline: i64,
    #[max_len(50)]
    pub proposal_info: String,
    pub authority: Pubkey,
}

#[account]
#[derive(InitSpace)]

pub struct ProposalCounter {
    pub proposal_count: u8,
    pub authority: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct Winner {
    pub winning_proposal_id: u8,
    pub winning_votes: u8,
    #[max_len(50)]
    pub proposal_info: String,
    pub declared_at: i64,
}
