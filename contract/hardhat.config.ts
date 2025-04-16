import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

interface ExtendedHardhatUserConfig extends HardhatUserConfig {
  pharosscan?: {
    apiurl: string;
  };
}

const config: ExtendedHardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    pharos: {
      url: "https://devnet.dplabs-internal.com/",
      accounts: [process.env.WALLET_PRIVATE_KEY || ""],
      chainId: 50002
    },
  },
  pharosscan: {
    apiurl: "https://pharosscan.xyz/",
  },
};

export default config;