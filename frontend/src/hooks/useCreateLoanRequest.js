import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";
import useSignerOrProvider from "./useSignerOrProvider";
import { Contract } from "ethers";
import pttTokenABI from "../ABI/usdtToken.json";

const PHAROS_CHAIN_ID = 50002;

const useCreateLoanRequest = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider("eip155");

  const lumenVaultContractAddress = import.meta.env.VITE_LUMEN_VAULT_CONTRACT_ADDRESS;
  const pttContractAddress = import.meta.env.VITE_PTT_TOKEN_CONTRACT_ADDRESS;

  const { signer } = useSignerOrProvider();

  const pttContract = signer ? new Contract(pttContractAddress, pttTokenABI, signer) : null;

  const createLoanRequest = useCallback(
    async (amount, maxInterestRate, duration, collateralWei) => {
      if (!amount || !maxInterestRate || !duration || !collateralWei) {
        toast.error("All fields are required");
        return false;
      }

      if (!address) {
        toast.error("Please connect your wallet");
        return false;
      }

      if (!contract) {
        toast.error("Contract not found");
        return false;
      }

      if (!signer) {
        toast.error("Signer not available");
        return false;
      }

      if (!pttContract) {
        toast.error("Token contract not initialized");
        return false;
      }

      if (Number(chainId) !== PHAROS_CHAIN_ID) {
        try {
          await walletProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xc352",
                chainName: "Pharos Devnet",
                rpcUrls: ["https://devnet.dplabs-internal.com/"],
                nativeCurrency: { name: "PTT", symbol: "PTT", decimals: 18 },
                blockExplorerUrls: ["https://pharosscan.xyz"],
              },
            ],
          });
          await walletProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xc352" }],
          });
        } catch (error) {
          console.error("Failed to switch chain:", error);
          toast.error("Please switch to Pharos Devnet in your wallet");
          return false;
        }
      }

      try {
        const signerAddress = await signer.getAddress();
        console.log("Connected wallet address:", address);
        console.log("Signer address:", signerAddress);

        if (signerAddress.toLowerCase() !== address.toLowerCase()) {
          toast.error(`Signer address mismatch: expected ${address}, got ${signerAddress}`);
          return false;
        }

        console.log("Parameters:", {
          amount: amount.toString(),
          maxInterestRate: maxInterestRate.toString(),
          duration: duration.toString(),
          collateralWei: collateralWei.toString(),
          lumenVaultContractAddress,
          pttContractAddress,
          signerAddress,
        });

        // Verify token contract
        try {
          const name = await pttContract.name();
          const decimals = await pttContract.decimals();
          const balance = await pttContract.balanceOf(signerAddress);
          console.log("Token name:", name);
          console.log("Token decimals:", decimals);
          console.log("User balance:", balance.toString());
          if (balance < collateralWei) {
            toast.error("Insufficient token balance for collateral");
            return false;
          }
        } catch (error) {
          console.error("Invalid token contract:", error);
          toast.error("Invalid token contract or address");
          return false;
        }

        // Verify vault contract code
        try {
          const code = await signer.provider.getCode(lumenVaultContractAddress);
          if (code === "0x") {
            toast.error("No contract found at vault address");
            return false;
          }
          console.log("Vault contract code length:", code.length);
        } catch (error) {
          console.error("Error checking vault contract:", error);
          toast.error("Failed to verify vault contract");
          return false;
        }

        const gasPrice = await signer.provider.getGasPrice();
        console.log("Gas price:", gasPrice.toString());

        // Step 1: Approve collateral
        console.log("Preparing approve tx...");
        let approveGasLimit = 100000;
        try {
          approveGasLimit = await pttContract.approve.estimateGas(lumenVaultContractAddress, collateralWei);
          approveGasLimit = (approveGasLimit * BigInt(120)) / BigInt(100); // 20% buffer
          console.log("Estimated approve gas:", approveGasLimit.toString());
        } catch (error) {
          console.warn("Approve gas estimation failed:", error);
        }

        const approveTx = await pttContract.approve(lumenVaultContractAddress, collateralWei, {
          gasLimit: approveGasLimit,
          gasPrice,
        });
        console.log("Approve tx hash:", approveTx.hash);
        console.log("Approve tx data:", approveTx.data);

        const approveReceipt = await approveTx.wait();
        console.log("Approve gas used:", approveReceipt.gasUsed.toString());

        if (approveReceipt.status !== 1) {
          toast.error("Approval failed");
          return false;
        }

        // Verify allowance
        const allowance = await pttContract.allowance(signerAddress, lumenVaultContractAddress);
        console.log("Allowance:", allowance.toString());
        if (allowance < collateralWei) {
          toast.error("Insufficient allowance after approval");
          return false;
        }

        // Step 2: Request loan
        console.log("Preparing requestLoan tx...");
        let loanGasLimit = 300000;
        try {
          loanGasLimit = await contract.requestLoan.estimateGas(amount, maxInterestRate, duration);
          loanGasLimit = (loanGasLimit * BigInt(120)) / BigInt(100);
          console.log("Estimated loan gas:", loanGasLimit.toString());
        } catch (error) {
          console.warn("RequestLoan gas estimation failed:", error);
        }

        const loanTx = await contract.requestLoan(amount, maxInterestRate, duration, {
          gasLimit: loanGasLimit,
          gasPrice,
        });
        console.log("Loan tx hash:", loanTx.hash);
        console.log("Loan tx data:", loanTx.data);

        const loanReceipt = await loanTx.wait();
        console.log("Loan gas used:", loanReceipt.gasUsed.toString());

        if (loanReceipt.status === 1) {
          toast.success("Loan requested successfully");
          return true;
        }

        toast.error("Failed to request loan");
        return false;
      } catch (error) {
        console.error("Error requesting loan:", error);
        const errorDecoder = ErrorDecoder.create();
        const decodedError = await errorDecoder.decode(error);
        console.error("Decoded error:", decodedError);
        toast.error(`Loan request failed: ${decodedError.reason || decodedError.message || "Unknown error"}`);
        return false;
      }
    },
    [contract, address, chainId, signer, pttContract, walletProvider]
  );

  return createLoanRequest;
};

export default useCreateLoanRequest;