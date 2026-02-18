use anchor_lang::prelude::*;

use crate::state::ProposalCounter;
#[error_code]
pub enum VoteError{
    #[msg("Invalid deadline passed")]
    InvalidDeadline,

    #[msg("Proposal counter is already initialized")]
    ProposalCounterAlreadyInitialized,

    #[msg("Proposal Counter overflow")]
    ProposalCounterOverflow,
    
    #[msg("Proposal Ended")]
    ProposalEnded,
    
    #[msg("Proposal Ended")]
    ProposalVotesOverflow
}


