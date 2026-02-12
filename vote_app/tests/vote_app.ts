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

  let treasuryTokenAccount: anchor.web3.PublicKey;
  beforeEach(async() => {
    treasuryConfigPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.TREASURY_CONFIG)]);
    xMintPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.X_MINT)]);
    voterPda= findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.VOTER),
      voterWallet.publicKey.toBuffer(),
    ]);

    solVaultPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.SOL_VAULT)]);
    mintAuthorityPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.MINT_AUTHORITY)]);

    console.log("transferring sol tokens ...");
    await airDropSol(connection, proposalCreatorWallet.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await airDropSol(connection, voterWallet.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);

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
    it("2.1 buys tokens!", async () => {
      const tokenBalanceBefore = (await getAccount(connection, proposalCreatorTokenAccount)).amount;
      await program.methods.buyTokens().accounts({
        buyer: proposalCreatorWallet.publicKey,
        treasuryConfigAccount: treasuryConfigPda,
        solVault: solVaultPda,
        treasuryTokenAccount: treasuryTokenAccount, // Pass manually
        xMint: xMintPda,
        buyerTokenAccount: proposalCreatorTokenAccount,
        mintAuthority: mintAuthorityPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).signers([proposalCreatorWallet]).rpc();

      const tokenBalanceAfter = (await getAccount(connection, proposalCreatorTokenAccount)).amount;
      expect(tokenBalanceAfter-tokenBalanceBefore).to.equal(BigInt(1000_000_000));

    });
 })

   describe("3. Voter",()=>{
    it("3.1 registers voter!", async () => {
      await program.methods.registerVoter(PROPOSAL_ID).accounts({
        authority: voterWallet.publicKey,
      }).signers([voterWallet]).rpc();
       const voterAccountData = await program.account.voter.fetch(voterPda);
      expect(voterAccountData.voterId.toBase58).to.equal(voterWallet.publicKey.toBase58);
      expect(voterAccountData.proposalVoted).to.equal(PROPOSAL_ID);
    });
  });
})
    
