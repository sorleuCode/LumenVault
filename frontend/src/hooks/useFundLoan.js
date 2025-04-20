import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";
import { Contract, ethers } from "ethers"; // Remove BigNumber import
import usdtTokenABI from "../ABI/usdtToken.json";
import useSignerOrProvider from "./useSignerOrProvider";

const useFundLoan = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { signer } = useSignerOrProvider();

  const usdtTokenContractAddress = import.meta.env.VITE_USDT_TOKEN_CONTRACT_ADDRESS;
  const lumenVaultContractAddress = import.meta.env.VITE_LUMEN_VAULT_CONTRACT_ADDRESS;

  const usdtContract = new Contract(usdtTokenContractAddress, usdtTokenABI, signer);

  return useCallback(
    async (loanId, loanAmount) => {
      if (!loanId || isNaN(loanId)) {
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

      try {
        

        const status = await contract.loansStatus(loanId);

        if (status.active) {
          toast.error("Loan is already active");
          return;
        }

        const balance = await usdtContract.balanceOf(address);

        console.log({loanAmount})
        console.log({balance})

       

        if (balance < loanAmount) {
          toast.error("Insufficient token balance");
          return;
        }

        const approveGas = await usdtContract.approve.estimateGas(
          lumenVaultContractAddress,
          loanAmount
        );

        const approveTx = await usdtContract.approve(lumenVaultContractAddress, loanAmount, {
          gasLimit: (approveGas * BigInt(120)) / BigInt(100),
        });

        

        const approveReceipt = await approveTx.wait();
 

        if (approveReceipt.status !== 1) {
          toast.error("Token approval failed");
          return;
        }


        const allowance = await usdtContract.allowance(address, lumenVaultContractAddress);


        if (allowance < loanAmount) {
          toast.error("Insufficient token allowance");
          return;
        }

        // Fund the loan
        let estimatedGasLoan;
        try {
          estimatedGasLoan = await contract.fundLoan.estimateGas(loanId);
        } catch (gasEstimationError) {
          const decoder = ErrorDecoder.create();
          const decoded = await decoder.decode(gasEstimationError);
          console.error("Gas estimation error:", decoded);
          toast.error(decoded?.message || "Gas estimation failed for loan funding");
          return;
        }

        const txLoan = await contract.fundLoan(loanId, {
          gasLimit: (estimatedGasLoan * BigInt(120)) / BigInt(100),
        });

        const txReceipt = await txLoan.wait();

        if (txReceipt.status === 1) {
          toast.success("Loan funded successfully");
          return true;
        } else {
          toast.error("Loan funding failed");
        }
      } catch (error) {
        console.error("Error funding loan:", error);
        const decoder = ErrorDecoder.create();
        const decoded = await decoder.decode(error);
        console.error("Decoded error:", decoded);
        toast.error(decoded?.message || "Loan funding failed");
      }
    },
    [contract, address, chainId, usdtContract]
  );
};

export default useFundLoan;