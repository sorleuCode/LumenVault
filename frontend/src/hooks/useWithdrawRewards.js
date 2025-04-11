import { useCallback, useState } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { baseSepolia } from "@reown/appkit/networks";
import { ErrorDecoder } from "ethers-decode-error";

const useWithdrawRewards = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(
    async (withdrawalAddress) => {
      if (!withdrawalAddress) {
        toast.error("No address for withdrawal");
        return;
      }

     
      if (!contract) {
        toast.error("Contract not found");
        return;
      }

      if (Number(chainId) !== Number(baseSepolia.id)) {
        toast.error("You're not connected to baseSepolia");
        return;
      }

      try {

        

       
          const estimatedGasLoan = await contract.withdrawRewards.estimateGas(withdrawalAddress);

          if (!estimatedGasLoan) {
            toast.error("Gas estimation for loan failed");
            return;
          }

          const txLoan = await contract.withdrawRewards(withdrawalAddress, {
            gasLimit: (estimatedGasLoan * BigInt(120)) / BigInt(100),
          });

          const txReceipt = await txLoan.wait();

          if (txReceipt.status === 1){
            toast.success("Withdrawal successful")

            return true;
            } 

          toast.error("Failed to widthraw");
        
      } catch (error) {
        console.error("Error withdrawal reward", error);

        const errorDecoder = ErrorDecoder.create();
        const decodedError = await errorDecoder.decode(error);

        console.error("Decoded Error:", decodedError);
        toast.error("withdrawal failed", decodedError);
      }
    },
    [contract, address, chainId]
  );
};

export default useWithdrawRewards;

