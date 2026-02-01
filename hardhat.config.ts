import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config(); // 👈 REQUIRED

console.log("MAINNET RPC URL:", process.env.RPC_URL);

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  networks: {
    hardhat: {
      type: "edr-simulated",
      forking: {
        url: process.env.RPC_URL!, // Infura / Alchemy
        // blockNumber: 19500000 // optional, but recommended
      }
    }
  },
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  }
};

export default config;