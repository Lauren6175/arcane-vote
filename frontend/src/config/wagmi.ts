import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hardhat, sepolia } from "wagmi/chains";
import { http } from "wagmi";

// Custom Sepolia config with Infura RPC to avoid CORS issues
const sepoliaWithInfura = {
  ...sepolia,
  rpcUrls: {
    default: {
      http: ["https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990"],
    },
    public: {
      http: ["https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990"],
    },
  },
};

export const config = getDefaultConfig({
  appName: "Arcane Vote",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo_project_id",
  chains: [hardhat, sepoliaWithInfura],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http("https://sepolia.infura.io/v3/b18fb7e6ca7045ac83c41157ab93f990"),
  },
  ssr: false,
});

