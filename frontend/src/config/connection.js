import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";

// Your project ID from environment variable
const projectId = import.meta.env.VITE_APPKIT_PROJECT_ID;

console.log({ projectId });

// Updated RPC config to go through Vite proxy
const pharosDevnet = defineChain({
  id: 50002,
  caipNetworkId: "eip155:50002",
  chainNamespace: "eip155",
  name: "Pharos Devnet",
  nativeCurrency: {
    decimals: 18,
    name: "MKT",
    symbol: "MKT",
  },
  rpcUrls: {
    default: {
      http: ["https://lumenvault.vercel.app/rpc"], // 👈 Proxy path to avoid CORS
    },
  },
  blockExplorers: {
    default: {
      name: "Pharos Scan",
      url: "https://pharosscan.xyz/",
    },
  },
  contracts: {
    // Add the contracts here if needed
  },
});

// List of supported networks
const networks = [pharosDevnet];

// Optional metadata for wallet connection UI
const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "https://mywebsite.com",
  icons: ["https://avatars.mywebsite.com/"],
};

// Create AppKit instance with config
createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true, // Optional
  },
});
