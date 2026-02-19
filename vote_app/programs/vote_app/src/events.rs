use anchor_lang::prelude::*;
#[event]
pub struct ProposalCounterInitialized {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VoterRegistered {
    pub voter: Pubkey,
    pub voter_account: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProposalCreated {
    pub proposal_id: u8,
    pub creator: Pubkey,
    pub proposal_info: String,
    pub deadline: i64,
    pub timestamp: i64,
}

#[event]
pub struct VoteCast {
    pub voter: Pubkey,
    pub proposal_id: u8,
    pub total_votes: u8,
    pub timestamp: i64,
}

#[event]
pub struct WinnerDeclared {
    pub winning_proposal_id: u8,
    pub proposal_info: String,
    pub total_votes: u8,
    pub declared_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProposalClosed {
    pub proposal_id: u8,
    pub rent_recovered: u64,
    pub recovered_to: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VoterAccountClosed {
    pub voter: Pubkey,
    pub rent_recovered_to: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TreasuryInitialized {
    pub authority: Pubkey,
    pub x_mint: Pubkey,
    pub sol_price: u64,
    pub tokens_per_purchase: u64,
    pub timestamp: i64,
}

#[event]
pub struct TokensPurchased {
    pub buyer: Pubkey,
    pub sol_paid: u64,
    pub tokens_received: u64,
    pub timestamp: i64,
}

#[event]
pub struct SolWithdrawn {
    pub authority: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
