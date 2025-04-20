import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";
import { Contract, parseUnits, formatUnits } from "ethers";
import usdtTokenABI from "../ABI/usdtToken.json";
import useSignerOrProvider from "./useSignerOrProvider";

const useRepayLoan = () => {
  const contract = useContractInstance(true); // LumenVault contract
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { signer } = useSignerOrProvider();

  const usdtTokenContractAddress = import.meta.env.VITE_USDT_TOKEN_CONTRACT_ADDRESS;
  const lumenVaultContractAddress = import.meta.env.VITE_LUMEN_VAULT_CONTRACT_ADDRESS;

  // Validate environment variables
  if (!usdtTokenContractAddress) {
    console.error("VITE_USDT_TOKEN_CONTRACT_ADDRESS is not defined");
  }
  if (!lumenVaultContractAddress) {
    console.error("VITE_LUMEN_VAULT_CONTRACT_ADDRESS is not defined");
  }

  // Initialize usdtContract with stricter checks
  const usdtContract = (() => {
    if (!signer || typeof signer.getAddress !== "function") {
      console.error("Invalid signer");
      return null;
    }
    if (!usdtTokenContractAddress) {
      console.error("Missing USDT contract address");
      return null;
    }
    if (!usdtTokenABI || !Array.isArray(usdtTokenABI)) {
      console.error("Invalid or missing USDT ABI");
      return null;
    }
    try {
      const contractInstance = new Contract(usdtTokenContractAddress, usdtTokenABI, signer);
      console.log("usdtContract initialized:", contractInstance.address);
      return contractInstance;
    } catch (error) {
      console.error("Failed to initialize usdtContract:", error);
      return null;
    }
  })();

  return useCallback(
    async (loanId, repayment) => {
      try {
        // Validate inputs
        if (!loanId || isNaN(loanId) || Number(loanId) <= 0) {
          toast.error("Invalid loan ID");
          return false;
        }

        if (!address) {
          toast.error("Please connect your wallet");
          return false;
        }

        if (!signer || typeof signer.getAddress !== "function") {
          toast.error("Invalid or unavailable wallet signer");
          return false;
        }

        if (!contract) {
          toast.error("LumenVault contract not initialized");
          return false;
        }

        if (!usdtContract) {
          toast.error("USDT contract not initialized");
          return false;
        }

        // Validate repayment amount
        if (typeof repayment === "undefined" || repayment === null) {
          toast.error("Repayment amount is undefined");
          return false;
        }

        const stringRepayment = repayment.toString();
        const parsedRepayment = Number(stringRepayment);
        if (isNaN(parsedRepayment) || parsedRepayment <= 0) {
          toast.error("Invalid repayment amount");
          return false;
        }

        const parsedAmount = parseUnits(stringRepayment, 18); // No doubling
        console.log("Loan ID:", loanId);
        console.log("Repayment Amount:", stringRepayment, "USDT");

        // Check USDT balance
        if (!usdtContract.balanceOf) {
          toast.error("USDT contract is invalid");
          return false;
        }
        
        const balance = await usdtContract.balanceOf(address);
        console.log("USDT Balance:", formatUnits(balance, 18));
        if ( balance <= 0 || balance < parsedAmount) {
          toast.error(`Insufficient USDT balance: ${formatUnits(balance, 18)} USDT available`);
          return false;
        }

        // Check USDT allowance
        if (!usdtContract.allowance) {
          toast.error("USDT contract is invalid");
          return false;
        }
        const allowance = await usdtContract.allowance(address, lumenVaultContractAddress);
        console.log("USDT Allowance:", formatUnits(allowance, 18));
        if (allowance < parsedAmount) {
          // Reset allowance for non-standard USDT
          if (allowance > 0) {
            if (!usdtContract.estimateGas || !usdtContract.estimateGas.approve) {
              toast.error("USDT contract is invalid for approval");
              return false;
            }
            const resetGas = await usdtContract.estimateGas.approve(lumenVaultContractAddress, 0);
            const resetTx = await usdtContract.approve(lumenVaultContractAddress, 0, {
              gasLimit: (resetGas * BigInt(120)) / BigInt(100),
              gasPrice: parseUnits("1", "gwei"), // Pharos fallback
            });
            console.log("Reset Tx Hash:", resetTx.hash);
            await resetTx.wait();
            toast.info("USDT allowance reset to 0");
          }

          // Estimate gas for approve
          const estimatedGas = await usdtContract.estimateGas.approve(
            lumenVaultContractAddress,
            parsedAmount
          );
          console.log("Approve Estimated Gas:", estimatedGas.toString());

          // Log transaction data
          const approveCall = usdtContract.interface.encodeFunctionData("approve", [
            lumenVaultContractAddress,
            parsedAmount,
          ]);
          console.log("Approve Call Data:", approveCall);

          // Approve USDT
          const approvalTx = await usdtContract.approve(lumenVaultContractAddress, parsedAmount, {
            gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
            gasPrice: parseUnits("1", "gwei"), // Pharos fallback
          });
          console.log("Approve Tx Hash:", approvalTx.hash);

          const approvalReceipt = await approvalTx.wait();
          if (approvalReceipt.status !== 1) {
            toast.error("Token approval failed");
            return false;
          }
          toast.info("USDT approval successful");
        }

        // Validate loan state
        try {
          if (!contract.getLoanRequest) {
            toast.error("LumenVault contract is invalid");
            return false;
          }
          const loan = await contract.getLoanRequest(loanId); // Adjust based on ABI
          console.log("Loan Data:", loan);
          // Example checks (uncomment with correct fields):
          // if (loan.borrower.toLowerCase() !== address.toLowerCase()) throw new Error("Not loan borrower");
          // if (!loan.isActive) throw new Error("Loan not active");
        } catch (error) {
          console.error("Loan validation failed:", error);
          toast.error("Invalid or non-existent loan");
          return false;
        }

        // Estimate gas for repayLoanWithReward
        if (!contract.estimateGas || !contract.estimateGas.repayLoanWithReward) {
          toast.error("LumenVault contract is invalid for repayment");
          return false;
        }
        const estimatedGasLoan = await contract.estimateGas.repayLoanWithReward(loanId);
        console.log("Repay Estimated Gas:", estimatedGasLoan.toString());

        // Call repayLoanWithReward
        const repayTx = await contract.repayLoanWithReward(loanId, {
          gasLimit: (estimatedGasLoan * BigInt(120)) / BigInt(100),
          gasPrice: parseUnits("1", "gwei"), // Pharos fallback
        });
        console.log("Repay Tx Hash:", repayTx.hash);

        const repayReceipt = await repayTx.wait();
        if (repayReceipt.status === 1) {
          toast.success("Loan repaid successfully!");
          return true;
        } else {
          toast.error("Failed to repay loan");
          return false;
        }
      } catch (error) {
        console.error("Error repaying loan:", error);
        try {
          const errorDecoder = ErrorDecoder.create();
          const decodedError = await errorDecoder.decode(error);
          console.error("Decoded Error:", decodedError);
          const errorMessage =
            decodedError.reason || decodedError.message || "Loan repayment failed";
          toast.error(`Loan repayment failed: ${errorMessage}`);
        } catch (decodeErr) {
          toast.error("Loan repayment failed due to unexpected error");
        }
        return false;
      }
    },
    [contract, address, chainId, usdtContract, signer]
  );
};

export default useRepayLoan;