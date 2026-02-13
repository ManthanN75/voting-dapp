use anchor_lang::prelude::*;
#[error_code]
pub enum VoteError{
    #[msg("Invalid deadline passed")]
    InvalidDeadline,

    #[msg("Proposal counter is already initialized")]
    ProposalCounterAlreadyInitialized,
}


