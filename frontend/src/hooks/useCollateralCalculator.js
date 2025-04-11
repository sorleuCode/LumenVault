import { useCallback } from 'react'
import useContractInstance from "./useContractInstance";
import { parseUnits, formatEther } from 'ethers'

export function useCollateralCalculator() {
  const contract =useContractInstance(false);

  const calculateCollateral = useCallback(async (linkAmount) => {
    try {
      const amountInWei = parseUnits(linkAmount.toString(), 18)
      const collateralWei = await contract.getrequiredCollateralAmount(amountInWei)
      

      return formatEther(collateralWei)
    } catch (error) {
      console.error('Error calculating collateral:', error)
      throw error
    }
  }, [contract])

  return calculateCollateral
}