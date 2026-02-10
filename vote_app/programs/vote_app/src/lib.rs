use anchor_lang::prelude::*;
mod state;
mod contexts;
use contexts::*;
declare_id!("5fA22cm9bqhmkovaGjD8sG4otoJ6sPhW4JLdjrJLhy41");

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
      //1.user will transfer sol to sol_vault
      //2.token transwer from treasury token account to buyer token account
      //3. x mint token
      //4. treasury config account - sol proce and token amount to tranbsfer
      Ok(())
    }
}

