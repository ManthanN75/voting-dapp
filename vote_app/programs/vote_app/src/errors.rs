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
    ProposalVotesOverflow,

    #[msg("Cannot declare winner while voting is still active")]
    VotingStillActive,

    #[msg("No votes have been cast for this proposal")]
    NoVotesCast,

    #[msg("You are not authorized to perform this action")]
    UnauthorizedAccess,
    
    #[msg("Token mint does not match the expected mint")]
    TokenMintMismatch,

    #[msg("Voter has already voted on this proposal")]
    VoterAlreadyVoted,

    #[msg("Token account is not owned by the expected wallet")]
    InvalidTokenAccountOwner,

    #[msg("Provided mint account is invalid")]
    InvalidMint,
}


