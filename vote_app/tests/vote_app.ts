import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VoteApp } from "../target/types/vote_app";

import{ expect } from "chai";
import{
  getOrCreateAssociatedTokenAccount,
  getAccount,
} from "@solana/spl-token";
import NodeWallet from "@project-serum/anchor/dist/cjs/node-wallet";


const SEEDS = {
  TREASURY_CONFIG: "treasury_config",
  X_MINT: "x_mint",
  SOL_VAULT: "sol_vault",
  MINT_AUTHORITY: "mint_authority",
}as const;

const findPda = (programId:anchor.web3.PublicKey, seeds:(Buffer | Uint8Array)[]): anchor.web3.PublicKey =>{
    const [pda,bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, programId);
    return pda;
}

describe("vote_app", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.voteApp as Program<VoteApp>;

  const adminWallet = (provider.wallet as NodeWallet).payer;
  let treasuryConfigPda: anchor.web3.PublicKey;
  let xMintPda: anchor.web3.PublicKey;
  let solVaultPda: anchor.web3.PublicKey;
  let mintAuthorityPda: anchor.web3.PublicKey;

  beforeEach(() => {
    treasuryConfigPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.TREASURY_CONFIG)]);
    xMintPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.X_MINT)]);
    solVaultPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.SOL_VAULT)]);
    mintAuthorityPda = findPda(program.programId, [anchor.utils.bytes.utf8.encode(SEEDS.MINT_AUTHORITY)]);

  })

  it("initializes treasury!", async () => {
    const solPrice = new anchor.BN(1000_000_000);
    const tokensPerPurchase = new anchor.BN(1000_000_000); // 1 SOL = 100

    console.log("Treasury Config PDA:", treasuryConfigPda.toBase58());
    await program.methods.initializeTreasury(solPrice,tokensPerPurchase).accounts({
      authority: adminWallet.publicKey,
    }).rpc();

    const treasuryAccountData = await program.account.treasuryConfig.fetch(treasuryConfigPda);
      expect(treasuryAccountData.authority.toBase58()).to.equal(adminWallet.publicKey.toBase58());
      expect(treasuryAccountData.solPrice.toNumber()).to.equal(solPrice.toNumber());
      expect(treasuryAccountData.tokensPerPurchase.toNumber()).to.equal(tokensPerPurchase.toNumber());
      expect(treasuryAccountData.xMint.toBase58()).to.equal(xMintPda.toBase58());

  });
});