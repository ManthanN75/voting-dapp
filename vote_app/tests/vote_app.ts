import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Program, Wallet } from "@coral-xyz/anchor";
import { VoteApp } from "../target/types/vote_app";
import { expect } from "chai";
import{
  getOrCreateAssociatedTokenAccount, 
  getAccount,
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";


const SEEDS = {
  TREASURY_CONFIG: "treasury_config",
  X_MINT: "x_mint",
  SOL_VAULT: "sol_vault",
  MINT_AUTHORITY: "mint_authority",
  VOTER: "voter",
  PROPOSAL_COUNTER: "proposal_counter",
  PROPOSAL: "proposal",
  WINNER: "winner",
}as const;

const PROPOSAL_ID = 1;

const findPda = (programId:anchor.web3.PublicKey, seeds:(Buffer | Uint8Array)[]): anchor.web3.PublicKey =>{
    const [pda,bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, programId);
    return pda;
}



const airDropSol = async (connection: anchor.web3.Connection, publicKey: anchor.web3.PublicKey, sol: number) => {
  const signature = await connection.requestAirdrop(publicKey, sol);
  await connection.confirmTransaction(signature);
}

const getBlockTime = async(connection:anchor.web3.Connection) : Promise<number> => {
  const slot = await connection.getSlot();
  const getBlockTime = await connection.getBlockTime(slot);

  if(getBlockTime === null){
    throw new Error("failed to fetch block time");
  }
  return getBlockTime;

}

const expectAnchorErrorCode = (error: unknown, expectedCode: string) => {
  const anyErr = error as any;
  const actualCode = 
    anyErr?.error?.errorCode?.code ??
    anyErr?.errorCode?.code ??
    anyErr?.code;
  expect(actualCode).to.equal(expectedCode);
}

describe("testing the voting app", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);
  const program = anchor.workspace.voteApp as Program<VoteApp>;
  
  const adminWallet = (provider.wallet as Wallet).payer;
  
  let proposalCreatorWallet = anchor.web3.Keypair.generate();
  let voterWallet = anchor.web3.Keypair.generate();

  let proposalCreatorTokenAccount:anchor.web3.PublicKey;

  let treasuryConfigPda: anchor.web3.PublicKey;
  let xMintPda: anchor.web3.PublicKey;
  let solVaultPda: anchor.web3.PublicKey;
  let mintAuthorityPda: anchor.web3.PublicKey;
  let voterPda: anchor.web3.PublicKey;
  let proposalCounterPda: anchor.web3.PublicKey;
  let proposalPda: anchor.web3.PublicKey;
  let treasuryTokenAccount: anchor.web3.PublicKey;
  let voterTokenAccount: anchor.web3.PublicKey;
  let winnerPda: anchor.web3.PublicKey;

  beforeEach(async() => {
    treasuryConfigPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.TREASURY_CONFIG)]);

    proposalCounterPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.PROPOSAL_COUNTER)]);

    proposalPda = findPda(program.programId, 
      [anchor.utils.bytes.utf8.encode(SEEDS.PROPOSAL),Buffer.from([PROPOSAL_ID])
    ]); 
    
    winnerPda = findPda(program.programId, 
      [anchor.utils.bytes.utf8.encode(SEEDS.WINNER)]);

    xMintPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.X_MINT)]);
    voterPda= findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.VOTER), voterWallet.publicKey.toBuffer(),]);
    
     

    solVaultPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.SOL_VAULT)]);
    mintAuthorityPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.MINT_AUTHORITY)]);

    console.log("transferring sol tokens ...");
      await Promise.all([
        airDropSol(connection, proposalCreatorWallet.publicKey, 20 * anchor.web3.LAMPORTS_PER_SOL),
        airDropSol(connection, voterWallet.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
      ]);
    console.log("transfer of SOL successful"); 
  });
  const createTokenAccounts = async()=>{
    console.log("initialization of token accounts");
    const treasuryATA = await spl.getOrCreateAssociatedTokenAccount(
      connection,
      adminWallet,
      xMintPda,
      adminWallet.publicKey
    );
    treasuryTokenAccount = treasuryATA.address;

    const creatorATA = await getOrCreateAssociatedTokenAccount(
      connection,
      proposalCreatorWallet,
      xMintPda,
      proposalCreatorWallet.publicKey
    );
    proposalCreatorTokenAccount = creatorATA.address;

    voterTokenAccount = (await getOrCreateAssociatedTokenAccount(
      connection,
      voterWallet,
      xMintPda,
      voterWallet.publicKey
    )).address;
 
  }
  describe("1. Initialization",()=>{
    it("1.1 initializes treasury!", async () => {
    const solPrice = new anchor.BN(1000_000_000);
    const tokensPerPurchase = new anchor.BN(1000_000_000); // 1 SOL = 100
    
    await program.methods.initializeTreasury(solPrice,tokensPerPurchase).accounts({
      authority: adminWallet.publicKey,
    }).rpc();

    const treasuryAccountData = await program.account.treasuryConfig.fetch(treasuryConfigPda);
      expect(treasuryAccountData.authority.toBase58()).to.equal(adminWallet.publicKey.toBase58());
      expect(treasuryAccountData.solPrice.toNumber()).to.equal(solPrice.toNumber());
      expect(treasuryAccountData.tokensPerPurchase.toNumber()).to.equal(tokensPerPurchase.toNumber());
      expect(treasuryAccountData.xMint.toBase58()).to.equal(xMintPda.toBase58());
      await createTokenAccounts();

  });
  })

  describe("2. Buy Tokens",()=>{
    it("2.1 buys tokens for proposal creator!", async () => {
      const tokenBalanceBefore = (await getAccount(connection, proposalCreatorTokenAccount)).amount;
      await program.methods.buyTokens().accounts({
        buyer: proposalCreatorWallet.publicKey,
        treasuryTokenAccount: treasuryTokenAccount, // Pass manually
        xMint: xMintPda,
        buyerTokenAccount: proposalCreatorTokenAccount,
      }).signers([proposalCreatorWallet]).rpc();

      const tokenBalanceAfter = (await getAccount(connection, proposalCreatorTokenAccount)).amount;
      expect(tokenBalanceAfter-tokenBalanceBefore).to.equal(BigInt(1000_000_000));

    });

    it("2.2 buys tokens for voter!", async () => {
      const tokenBalanceBefore = (await getAccount(connection, voterTokenAccount)).amount;
      await program.methods.buyTokens().accounts({
        buyer: voterWallet.publicKey,
        treasuryTokenAccount: treasuryTokenAccount, // Pass manually
        xMint: xMintPda,
        buyerTokenAccount: voterTokenAccount,
      }).signers([voterWallet]).rpc();

      const tokenBalanceAfter = (await getAccount(connection, voterTokenAccount)).amount;
      expect(tokenBalanceAfter-tokenBalanceBefore).to.equal(BigInt(1000_000_000));

    });
 })

  describe("3. Voter",()=>{
    it("3.1 registers voter!", async () => {
      await program.methods.registerVoter().accounts({
        authority: voterWallet.publicKey,
      }).signers([voterWallet]).rpc();
      const voterAccountData = await program.account.voter.fetch(voterPda);
      expect(voterAccountData.voterId.toBase58()).to.equal(voterWallet.publicKey.toBase58());
    });
  });

  describe("4.Proposal Registration ",()=>{
    it("4.1 registers proposal!", async () => {
      const currentBlockTime = await getBlockTime(connection);

      const deadlineTime = new anchor.BN(currentBlockTime + 10);
      const proposalInfo = "Build a layer 2 solution";
      const stakeAmount = new anchor.BN(1000); 
      const tokenBalanceBefore = (await getAccount(connection, voterTokenAccount)).amount;


      await program.methods.registerProposal(proposalInfo, deadlineTime, stakeAmount).accounts({
        authority: proposalCreatorWallet.publicKey,
        proposalTokenAccount: proposalCreatorTokenAccount,
        proposalCounterAccount: proposalCounterPda,
        treasuryTokenAccount: treasuryTokenAccount,
        xMint: xMintPda,
        proposalAccount: proposalPda, 
        tokenProgram: spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).signers([proposalCreatorWallet]).rpc();
      const proposalAccountData = await program.account.proposal.fetch(proposalPda);
      const proposalCounterAccountData = await program.account.proposalCounter.fetch(proposalCounterPda);

      expect(proposalCounterAccountData.proposalCount).to.equal(2);
      expect(proposalAccountData.authority.toBase58()).to.equal(proposalCreatorWallet.publicKey.toBase58());
      expect(proposalAccountData.deadline.toString()).to.equal(deadlineTime.toString());
      expect(proposalAccountData.numberOfVotes.toString()).to.equal("0");
      expect(proposalAccountData.proposalId.toString()).to.equal("1");
      expect(proposalAccountData.proposalInfo.toString()).to.equal("Build a layer 2 solution");
      
    });
  });


  describe("5.Casting Vote ",()=>{
    it("5.1 casts vote!", async () => {

      const stakeAmount = new anchor.BN(1000); 

      await program.methods.proposalToVote(PROPOSAL_ID, stakeAmount).accounts({
        authority: voterWallet.publicKey,
        voterTokenAccount: voterTokenAccount,
        treasuryTokenAccount: treasuryTokenAccount,
        xMint: xMintPda,
      }).signers([voterWallet]).rpc();
      
      
    });
  });

  describe("6.Pick Winner ",()=>{
    it("6.1 should fail to pick winner before deadline!", async () => {
      try{
      await program.methods.pickWinner(PROPOSAL_ID)
      .accounts({
        authority: adminWallet.publicKey,
      }).rpc();
      }catch(error){
        expectAnchorErrorCode(error, "VotingStillActive");
      }

    
      
      
    });
    it("6.2 should pick winner after deadline passes!", async () => {
      console.log("waiting for deadline...");
      await new Promise(resolve => setTimeout(resolve, 12000)); // wait for 12 seconds
      await program.methods
        .pickWinner(PROPOSAL_ID)
        .accounts({
          authority: adminWallet.publicKey,
        })
        .rpc();

      const winnerData = await program.account.winner.fetch(winnerPda);
      expect(winnerData.winningProposalId).to.equal(PROPOSAL_ID);
      expect(winnerData.winningVotes).to.equal(1);
    });

  })
});
    
