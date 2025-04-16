import { useCallback, useState } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";
import { Contract } from "ethers";
import usdtTokenABI from "../ABI/usdtToken.json"
import useSignerOrProvider from "./useSignerOrProvider";


const useFundLoan = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const usdtTokenContractAddress = import.meta.env.VITE_USDT_TOKEN_CONTRACT_ADDRESS;
  const lumenVaultContractAddress = import.meta.env.VITE_LUMEN_VAULT_CONTRACT_ADDRESS


  const { signer } = useSignerOrProvider();

  const usdtContract = new Contract(usdtTokenContractAddress, usdtTokenABI, signer);

  return useCallback(
    async (loanId, loanAmount) => {
      if (!loanId) {
        toast.error("Invalid loan");
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

        const estimatedGas = await usdtContract?.approve?.estimateGas(
          lumenVaultContractAddress,
          loanAmount
        );

        if (!estimatedGas) {
          toast.error("Gas estimation failed");
          return;
        }

        const tx = await usdtContract.approve(lumenVaultContractAddress, loanAmount, {
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
        });

        
        const trxReceipt = await tx.wait()

        if (trxReceipt.status === 1) {
          const estimatedGasLoan = await contract.fundLoan.estimateGas(loanId);

          if (!estimatedGasLoan) {
            toast.error("Gas estimation for loan failed");
            return;
          }

          const txLoan = await contract.fundLoan(loanId, {
            gasLimit: (estimatedGasLoan * BigInt(120)) / BigInt(100),
          });

          const txReceipt = await txLoan.wait();

          if (txReceipt.status === 1){
            toast.success("Loan funded successfully")

            return true;
            } 

          toast.error("Failed to fund loan");
        } else {
          toast.error("Approval failed");
        }
      } catch (error) {
        console.error("Error funding loan", error);

        const errorDecoder = ErrorDecoder.create();
        const decodedError = await errorDecoder.decode(error);

        console.error("Decoded Error:", decodedError);
        toast.error("Loan funding failed", decodedError);
      }
    },
    [contract, address, chainId, usdtContract]
  );
};

export default useFundLoan;

