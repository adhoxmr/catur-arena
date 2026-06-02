import { ethers } from "hardhat";

async function main() {
  const SPINGU_TOKEN = process.env.SPINGU_TOKEN_ADDRESS || "0xb6248d93cf91b00b79fae46d3d4a8b50ac04fd3b";
  const FEE_COLLECTOR = process.env.FEE_COLLECTOR || "0xYourTreasuryAddress";
  const GAME_OPERATOR = process.env.GAME_OPERATOR || "0xYourBackendOperatorAddress";

  console.log("Deploying SpinguChessEscrow...");
  console.log("Spingu Token :", SPINGU_TOKEN);
  console.log("Fee Collector:", FEE_COLLECTOR);
  console.log("Game Operator:", GAME_OPERATOR);

  const Escrow = await ethers.getContractFactory("SpinguChessEscrow");
  const escrow = await Escrow.deploy(SPINGU_TOKEN, FEE_COLLECTOR, GAME_OPERATOR);

  await escrow.waitForDeployment();

  console.log("\n✅ SpinguChessEscrow deployed to:", await escrow.getAddress());
  console.log("\nNext steps:");
  console.log("1. Update your frontend with this contract address");
  console.log("2. Call setGameOperator if you want to change it later");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
