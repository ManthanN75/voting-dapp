use anchor_lang::prelude::*;
mod state;
mod contexts;
use contexts::*;
mod errors;
use errors::*;
mod events;
use events::*;
declare_id!("5fA22cm9bqhmkovaGjD8sG4otoJ6sPhW4JLdjrJLhy41");
use anchor_spl::token::{mint_to, transfer, MintTo, Transfer};
use anchor_lang::system_program;

#[program]
pub mod vote_app {
  use anchor_spl::token;

  use crate::state::ProposalCounter;

use super::*;

    pub fn initialize_treasury(ctx: Context<InitializeTreasury>,sol_price:u64,tokens_per_purchase:u64) -> Result<()> {
      let treasury_config_account = &mut ctx.accounts.treasury_config_account;
      treasury_config_account.authority = ctx.accounts.authority.key();
      treasury_config_account.bump = ctx.bumps.sol_vault;
      treasury_config_account.sol_price = sol_price;
      treasury_config_account.tokens_per_purchase = tokens_per_purchase;
      treasury_config_account.x_mint = ctx.accounts.x_mint.key();
      
      let Proposal_counter_account = &mut ctx.accounts.proposal_counter_account;
      require!(Proposal_counter_account.proposal_count == 0, VoteError::ProposalCounterAlreadyInitialized);
      Proposal_counter_account.proposal_count = 1;
      Proposal_counter_account.authority = ctx.accounts.authority.key();
      Ok(())
    }

    pub fn buy_tokens(ctx: Context<BuyTokens>) -> Result<()> {
      //1.user will transfer sol from buyer to sol_vault
      let treasury_config_account = &mut ctx.accounts.treasury_config_account;
        let sol = treasury_config_account.sol_price;
        let token_amount = treasury_config_account.tokens_per_purchase;
        let transfer_ix = anchor_lang::system_program::Transfer {
          from: ctx.accounts.buyer.to_account_info(),
          to: ctx.accounts.sol_vault.to_account_info(),
        };
        system_program::transfer(
          CpiContext::new(ctx.accounts.system_program.to_account_info(), transfer_ix),
          sol,
        )?;
      
        //2.mint tokens to buyer token account
        let mint_authority_seeds = &[b"mint_authority".as_ref(), &[ctx.bumps.mint_authority]];
        let signer_seeds = &[&mint_authority_seeds[..]];

        let cpi_accounts = MintTo {
          mint: ctx.accounts.x_mint.to_account_info(),
          to: ctx.accounts.buyer_token_account.to_account_info(),
          authority: ctx.accounts.mint_authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds
        );
      //3. x mint token
        mint_to(cpi_ctx, token_amount)?;
      
        Ok(())
    }

    pub fn register_voter(ctx: Context<RegisterVoter>) -> Result<()> {
      let voter_account = &mut ctx.accounts.voter_account;
      voter_account.voter_id = ctx.accounts.authority.key();
      Ok(())
    }
    
    pub fn register_proposal(ctx: Context<RegisterProposal>,proposal_info: String,deadline: i64,token_amount: u64) -> Result<()> {
      
      let clock = Clock::get()?;

      require!(clock.unix_timestamp < deadline, VoteError::InvalidDeadline);
      let proposal_account = &mut ctx.accounts.proposal_account;
      //transfer tokens from proposal_token_account to treasury_token_account


      let cpi_accounts = Transfer {
        from: ctx.accounts.proposal_token_account.to_account_info(),
        to: ctx.accounts.treasury_token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
      };

      let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
      );
      //transfer of tokens 
      transfer(cpi_ctx, token_amount)?;
    
      proposal_account.deadline = deadline;
      proposal_account.proposal_info = proposal_info;
      proposal_account.authority = ctx.accounts.authority.key();

      let proposal_counter_account = &mut ctx.accounts.proposal_counter_account;

      proposal_account.proposal_id = proposal_counter_account.proposal_count;
      proposal_counter_account.proposal_count = proposal_counter_account.proposal_count.checked_add(1).ok_or(VoteError::ProposalCounterOverflow)?;
      Ok(())
    }

}