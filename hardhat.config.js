// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

// Load environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const MONAD_RPC_URL = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development network
    hardhat: {
      chainId: 31337
    },
    // Monad testnet
    monadTestnet: {
      url: MONAD_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 10143,
      gasPrice: 'auto',
      gas: 8000000,  // Increased gas limit
      timeout: 60000, // 60 seconds
      verify: {
        etherscan: {
          apiUrl: "https://testnet-explorer.monad.xyz/api"
        }
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};