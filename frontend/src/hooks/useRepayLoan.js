import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";
import { Contract, ethers, parseUnits } from "ethers";
import usdtTokenABI from "../ABI/usdtToken.json";
import useSignerOrProvider from "./useSignerOrProvider";

const useRepayLoan = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const usdtTokenContractAddress = import.meta.env.VITE_USDT_TOKEN_CONTRACT_ADDRESS;
  const lumenVaultContractAddress = import.meta.env.VITE_LUMEN_VAULT_CONTRACT_ADDRESS;

  const { signer } = useSignerOrProvider();
  const usdtContract = new Contract(usdtTokenContractAddress, usdtTokenABI, signer);

  return useCallback(
    async (loanId, repayment) => {

      if (!loanId) {
        toast.error("Invalid loan ID");
        return;
      }

      if (!address) {
        toast.error("Please connect your wallet");
        return;
      }

      if (!contract || !usdtContract) {
        toast.error("Contract not found");
        return;
      }

      if (Number(chainId) !== 50002) {
        toast.error("Please connect to Base Sepolia");
        return;
      }


      
      console.log("Repaying loan with params:", {
        loanId: loanId.toString(),
        repayment: repayment,
        contract: contract.target,
        usdtContract: usdtContract.target,
        chainId,
        user: address,
      });



      try {
        const repaymenInNum = Number(repayment);

        const bigIntRepayment = parseUnits((repaymenInNum * 2).toString(), 18)
        if (repaymenInNum <= 0) {
          toast.error("Repayment amount must be greater than 0");
          return;
        }

        console.log("Repaying loan with params:", {
          loanId: loanId.toString(),
          repayment: repaymenInNum.toString(),
          contract: contract.target,
          usdtContract: usdtContract.target,
          chainId,
          user: address,
        });

        // Approve USDT transfer
        let estimatedGas;
        try {
          estimatedGas = await usdtContract.approve.estimateGas(
            lumenVaultContractAddress,
            bigIntRepayment
          );
        } catch (estimateErr) {
          console.warn("Gas estimation for approve failed:", estimateErr);
          toast.error("Failed to estimate gas for approval");
          return;
        }

        const approveTx = await usdtContract.approve(lumenVaultContractAddress, bigIntRepayment, {
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
          gasPrice: ethers.parseUnits("1", "gwei"), // Fallback for non-EIP-1559
        });

        console.log("Approval transaction sent:", { txHash: approveTx.hash });

        const approveReceipt = await approveTx.wait();
        console.log("Approval receipt:", {
          status: approveReceipt.status,
          transactionHash: approveReceipt.transactionHash,
          blockNumber: approveReceipt.blockNumber,
        });

        if (approveReceipt.status !== 1) {
          toast.error("USDT approval failed");
          return;
        }

        // Repay loan
        let estimatedGasLoan;
        try {
          estimatedGasLoan = await contract.repayLoanWithReward.estimateGas(loanId);
        } catch (estimateErr) {
          console.warn("Gas estimation for repayLoanWithReward failed:", estimateErr);
          toast.error("Failed to estimate gas for loan repayment");
          return;
        }

        const repayTx = await contract.repayLoanWithReward(loanId, {
          gasLimit: (estimatedGasLoan * BigInt(120)) / BigInt(100),
          gasPrice: ethers.parseUnits("1", "gwei"), // Fallback for non-EIP-1559
        });

        console.log("Repayment transaction sent:", { txHash: repayTx.hash });

        const repayReceipt = await repayTx.wait();
        console.log("Repayment receipt:", {
          status: repayReceipt.status,
          transactionHash: repayReceipt.transactionHash,
          blockNumber: repayReceipt.blockNumber,
        });

        if (repayReceipt.status === 1) {
          toast.success("Loan repaid successfully!");
          return true;
        } else {
          toast.error("Loan repayment failed");
          return;
        }
      } catch (error) {

        console.error("Error repaying loan:", error);

        try {
          const errorDecoder = ErrorDecoder.create();
          const decodedError = await errorDecoder.decode(error);
          console.error("Decoded error:", decodedError);

          let errorMessage = "Loan repayment failed";
          if (decodedError?.reason) {
            errorMessage = `Loan repayment failed: ${decodedError.reason}`;
          } else if (decodedError?.errorName) {
            errorMessage = `Loan repayment failed: ${decodedError.errorName}`;
          }
          toast.error(errorMessage);
        } catch (decodeErr) {
          console.error("Error decoding the error:", decodeErr);
          toast.error("Loan repayment failed: Unknown issue");
        }
      }
    },
    [contract, address, chainId, usdtContract]
  );
};

export default useRepayLoan;