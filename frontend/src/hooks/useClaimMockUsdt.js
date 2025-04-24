import { useCallback } from "react";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";
import { Contract } from "ethers";
import usdtTokenABI from "../ABI/usdtToken.json";
import useSignerOrProvider from "./useSignerOrProvider";

const useClaimMockUsdt = () => {
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { signer } = useSignerOrProvider();

  const usdtTokenContractAddress = import.meta.env.VITE_USDT_TOKEN_CONTRACT_ADDRESS;

  return useCallback(
    async () => {
      if (!address) {
        toast.error("Please connect your wallet");
        return false;
      }

      if (!signer) {
        toast.error("Signer not available. Try reconnecting your wallet.");
        return false;
      }

      if (chainId !== 50002) {
        toast.error("Please switch to Pharos devnet");
        return false;
      }

      const usdtContract = new Contract(usdtTokenContractAddress, usdtTokenABI, signer);

      try {
        const mintGas = await usdtContract.mint.estimateGas();
        const mintMockUsdtTx = await usdtContract.mint({
          gasLimit: (mintGas * BigInt(120)) / BigInt(100),
        });

        const mintReceipt = await mintMockUsdtTx.wait();

        if (mintReceipt.status !== 1) {
          toast.error("Claim failed. Transaction reverted.");
          console.error("Failed transaction receipt:", mintReceipt);
          return false;
        }

        toast.success("mUSDT claimed successfully");
        return true;
      } catch (error) {
        console.error("Error claiming mUSDT:", {
          error,
          address,
          chainId,
          contract: usdtTokenContractAddress,
        });
        const decoder = ErrorDecoder.create();
        const decoded = await decoder.decode(error);
        console.error("Decoded error:", decoded);
        toast.error(decoded?.reason || "Failed to claim mUSDT");
        return false;
      }
    },
    [address, chainId, signer, usdtTokenContractAddress]
  );
};

export default useClaimMockUsdt;