use anchor_lang::prelude::*;
mod state;
mod contexts;
use contexts::*
declare_id!("5fA22cm9bqhmkovaGjD8sG4otoJ6sPhW4JLdjrJLhy41");

#[program]
pub mod vote_app {
    use super::*;

    pub fn initialize_treasury(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

