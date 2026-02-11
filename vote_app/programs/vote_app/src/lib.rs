use anchor_lang::prelude::*;
mod state;
mod contexts;
use contexts::*;
declare_id!("5fA22cm9bqhmkovaGjD8sG4otoJ6sPhW4JLdjrJLhy41");
use anchor_spl::token::{mint_to, transfer, MintTo, Transfer};
use anchor_lang::system_program;

#[program]
pub mod vote_app {
    use anchor_spl::token;

    use super::*;

    pub fn initialize_treasury(ctx: Context<InitializeTreasury>,sol_price:u64,tokens_per_purchase:u64) -> Result<()> {
        let treasury_config_account = &mut ctx.accounts.treasury_config_account;
        treasury_config_account.authority = ctx.accounts.authority.key();
        treasury_config_account.bump = ctx.bumps.sol_vault;
        treasury_config_account.sol_price = sol_price;
        treasury_config_account.tokens_per_purchase = tokens_per_purchase;
        treasury_config_account.x_mint = ctx.accounts.x_mint.key();
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
}

