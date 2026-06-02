import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    satuchain: {
      url: process.env.SATUCHAIN_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 0x1583c088b93de3019927abdf0fba35b3946f8e94, // or use decimal version
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
};

export default config;
