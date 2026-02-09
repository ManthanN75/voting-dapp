use anchor_lang::prelude::*;
use crate::state::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct InitializeTreasury<'info>{
    #[account(mut)]
    pub authority:Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + TreasuryConfig::INIT_SPACE,
        seeds = [b"treasury-config"],
        bump
    )]
    pub treasury_config_account:Account<'info, TreasuryConfig>,

    #[account(
        init,
        payer = authority, 
        mint::authority = mint_authority,
        mint::decimals = 6,
        seeds = [b"x_mint"],
        bump
    )]
    pub x_mint:Account<'info, Mint>,

    pub treasury_token_account:Account<'info, TokenAccount>,


    #[account(mut,seeds=[b"sol_vault"], bump)]
    pub sol_vault:AccountInfo<'info>,

    #[account(seeds=[b"mint_authority"], bump)]
    pub mint_authority:AccountInfo<'info>,

    pub system_program:Program<'info, System>,
}
