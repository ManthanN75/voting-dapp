use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + TreasuryConfig:: INIT_SPACE,
        seeds = [b"treasury_config"],
        bump
    )]
    pub treasury_config_account: Account<'info, TreasuryConfig>,

    #[account(
        init,
        payer = authority,
        mint::authority = mint_authority,
        mint::decimals = 6,
        seeds = [b"x_mint"],
        bump
    )]
    pub x_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = x_mint,
        associated_token::authority = authority,

    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    ///CHECK:this is to recieve sol tokens
    #[account(mut,seeds=[b"sol_vault"], bump)]
    pub sol_vault: AccountInfo<'info>,

    ///CHECK: this is going to be the mint authority of x_mint tokens.
    #[account(seeds=[b"mint_authority"], bump)]
    pub mint_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {

        #[account(
        seeds = [b"treasury_config"],
        bump
    )]
    pub treasury_config_account: Account<'info, TreasuryConfig>,

    /// CHECK: This is a PDA vault that holds SOL.
    #[account(mut,seeds=[b"sol_vault"], bump = treasury_config_account.bump)]
    pub sol_vault: AccountInfo<'info>,

    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

        #[account(
        seeds = [b"x_mint"],
        bump
    )]
    pub x_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint= buyer_token_account.owner == buyer.key(),
        constraint = buyer_token_account.mint == x_mint.key()
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the PDA authority for the x_mint.
    #[account(seeds=[b"mint_authority"], bump)]
    pub mint_authority: AccountInfo<'info>,

    #[account(mut)]
    pub buyer:Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program:Program<'info,System>


}