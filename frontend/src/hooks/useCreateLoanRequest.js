import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { baseSepolia } from "@reown/appkit/networks";
import { ErrorDecoder } from "ethers-decode-error";

const useCreateLoanRequest = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(
    async (amount, maxInterestRate, duration, collateralInWei) => {
      if (!amount || !maxInterestRate || !duration || !collateralInWei) {
        toast.error("All the fields are required");
        return;
      }

      if (!address) {
        toast.error("Please connect your wallet");
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
        const estimatedGas = await contract.requestLoan.estimateGas(
          amount,
          maxInterestRate,
          duration,
          {
            value: collateralInWei
          }
        );

        const tx = await contract.requestLoan(
            amount,
            maxInterestRate,
            duration, { 
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
          value: collateralInWei
        });

        const receipt = await tx.wait();

        if (receipt.status === 1) {
          toast.success("Loan requested successfully");
          return;
        }

        toast.error("Failed to request loan");
        return;
      } catch (error) {
        console.error(error);
        
        const errorDecoder = ErrorDecoder.create();
        const decodedError = await errorDecoder.decode(error);

        console.error("Error requesting loan", decodedError);
        toast.error("Loan request failed", decodedError);
      }
    },
    [contract, address, chainId]
  );
};

export default useCreateLoanRequest;
