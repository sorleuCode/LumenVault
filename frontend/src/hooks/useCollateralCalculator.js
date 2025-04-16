import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { parseUnits, formatUnits } from "ethers";

export function useCollateralCalculator() {
  const contract = useContractInstance(false);

  const calculateCollateral = useCallback(
    async (usdtAmount) => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      try {
        const amountInWei = parseUnits(usdtAmount.toString(), 18);
        console.log("Input amountInWei:", amountInWei.toString());

        const collateralWei = await contract.getRequiredCollateralAmount(amountInWei);
        console.log("Raw collateralWei:", collateralWei.toString());

        const collateralFormatted = formatUnits(collateralWei, 18); // Assuming PTT has 18 decimals
        console.log("Formatted collateral:", collateralFormatted);

        return collateralFormatted;
      } catch (error) {
        console.error("Error calculating collateral:", error);
        throw error;
      }
    },
    [contract]
  );

  return calculateCollateral;
}