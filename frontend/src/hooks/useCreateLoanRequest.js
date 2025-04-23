import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
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

      if (Number(chainId) !== 50002) {
        toast.error("You're not connected to baseSepolia");
        return;
      }

      try {
        const amt = BigInt(amount);
        const interest = BigInt(maxInterestRate);
        const dur = BigInt(duration);
        const collateral = BigInt(collateralInWei);

      
        let gasLimit;

        try {
          const estimatedGas = await contract.requestLoan.estimateGas(
            amt,
            interest,
            dur,
            { value: collateral }
          );
          gasLimit = (estimatedGas * BigInt(120)) / BigInt(100); // add 20% buffer
        } catch (estimateErr) {
          console.warn("Gas estimation failed. Falling back to static gas limit.");
          gasLimit = BigInt(1_000_000); // fallback gas limit
        }

        const tx = await contract.requestLoan(
          amt,
          interest,
          dur,
          {
            gasLimit,
            value: collateral
          }
        );

        const receipt = await tx.wait();

        if (receipt.status === 1) {
          toast.success("Loan requested successfully");
        } else {
          toast.error("Transaction failed after sending");
        }

      } catch (error) {
        console.error("Raw error:", error);

        try {
          const errorDecoder = ErrorDecoder.create();
          const decodedError = await errorDecoder.decode(error);
          console.error("Decoded error:", decodedError);

          toast.error(`Loan request failed: ${decodedError?.errorName || "Unknown error"}`);
        } catch (decodeErr) {
          console.error("Error decoding the error:", decodeErr);
          toast.error("Loan request failed: Unknown issue");
        }
      }
    },
    [contract, address, chainId]
  );
};

export default useCreateLoanRequest;
