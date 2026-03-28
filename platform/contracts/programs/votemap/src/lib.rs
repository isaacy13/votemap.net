use anchor_lang::prelude::*;

declare_id!("VoteMapXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod votemap {
    use super::*;

    /// Initialize a bounty escrow PDA for an issue.
    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, issue_id: String) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.issue_id = issue_id;
        escrow.authority = ctx.accounts.authority.key();
        escrow.total_usdc = 0;
        escrow.is_active = true;
        Ok(())
    }

    /// Deposit USDC into the escrow for a specific issue.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.is_active, ErrorCode::EscrowInactive);
        escrow.total_usdc = escrow.total_usdc.checked_add(amount).unwrap();
        Ok(())
    }

    /// Release funds to entity wallet (called per-voter on individual approve).
    pub fn release_to_entity(ctx: Context<ReleaseToEntity>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.is_active, ErrorCode::EscrowInactive);
        require!(escrow.total_usdc >= amount, ErrorCode::InsufficientFunds);
        escrow.total_usdc = escrow.total_usdc.checked_sub(amount).unwrap();
        Ok(())
    }

    /// Refund voter's contribution (called on reject or pullout).
    pub fn refund_voter(ctx: Context<RefundVoter>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.is_active, ErrorCode::EscrowInactive);
        require!(escrow.total_usdc >= amount, ErrorCode::InsufficientFunds);
        escrow.total_usdc = escrow.total_usdc.checked_sub(amount).unwrap();
        Ok(())
    }

    /// Record a pullout vote on-chain.
    pub fn cast_pullout_vote(ctx: Context<CastPulloutVote>, amount_weight: u64) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        vote.voter = ctx.accounts.voter.key();
        vote.escrow = ctx.accounts.escrow.key();
        vote.amount_weight = amount_weight;
        Ok(())
    }

    /// Trigger pullout mode (called by backend when thresholds met).
    pub fn trigger_pullout(ctx: Context<TriggerPullout>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.is_active = false;
        Ok(())
    }

    /// Record a resolution decision on-chain.
    pub fn record_resolution(
        ctx: Context<RecordResolution>,
        contribution_id: String,
        decision: bool, // true = approve, false = reject
    ) -> Result<()> {
        let record = &mut ctx.accounts.resolution;
        record.voter = ctx.accounts.voter.key();
        record.contribution_id = contribution_id;
        record.approved = decision;
        Ok(())
    }
}

// Account structures

#[account]
pub struct BountyEscrow {
    #[max_len(60)]
    pub issue_id: String,
    pub authority: Pubkey,
    pub total_usdc: u64,
    pub is_active: bool,
}

#[account]
pub struct PulloutVoteAccount {
    pub voter: Pubkey,
    pub escrow: Pubkey,
    pub amount_weight: u64,
}

#[account]
pub struct ResolutionRecord {
    pub voter: Pubkey,
    #[max_len(60)]
    pub contribution_id: String,
    pub approved: bool,
}

// Context structs

#[derive(Accounts)]
#[instruction(issue_id: String)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + (4 + 60) + 32 + 8 + 1,
        seeds = [b"escrow", issue_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, BountyEscrow>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub escrow: Account<'info, BountyEscrow>,
    pub depositor: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseToEntity<'info> {
    #[account(mut, has_one = authority)]
    pub escrow: Account<'info, BountyEscrow>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RefundVoter<'info> {
    #[account(mut, has_one = authority)]
    pub escrow: Account<'info, BountyEscrow>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CastPulloutVote<'info> {
    #[account(
        init,
        payer = voter,
        space = 8 + 32 + 32 + 8
    )]
    pub vote: Account<'info, PulloutVoteAccount>,
    #[account(mut)]
    pub escrow: Account<'info, BountyEscrow>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TriggerPullout<'info> {
    #[account(mut, has_one = authority)]
    pub escrow: Account<'info, BountyEscrow>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordResolution<'info> {
    #[account(
        init,
        payer = voter,
        space = 8 + 32 + (4 + 60) + 1
    )]
    pub resolution: Account<'info, ResolutionRecord>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Error codes

#[error_code]
pub enum ErrorCode {
    #[msg("Escrow is not active")]
    EscrowInactive,
    #[msg("Insufficient funds in escrow")]
    InsufficientFunds,
}
