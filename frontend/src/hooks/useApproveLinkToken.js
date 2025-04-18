import { useState } from "react"
import { Contract } from "ethers"
import useContractInstance from "./useContractInstance"
import { toast } from "react-toastify"

const usdtTokenABI = ["function approve(address spender, uint256 amount) public returns (bool)"]

export const useApproveLinkToken = () => {
  const [isApproving, setIsApproving] = useState(false)
  const loanManagerContract = useContractInstance(true)

  const approveLinkToken = async (amount) => {
    if (!loanManagerContract) {
      toast.error("Please connect your wallet")
      return false
    }

    try {
      setIsApproving(true)
      const usdtTokenAddress = await loanManagerContract.linkToken()
      const signer = loanManagerContract.signer
      const usdtTokenContract = new Contract(usdtTokenAddress, usdtTokenABI, signer)

      const tx = await usdtTokenContract.approve(loanManagerContract.address, amount)
      await tx.wait()

      toast.success("LINK token approval successful")
      return true
    } catch (error) {
      console.error("Failed to approve LINK token:", error)
      Okay.error("Failed to approve LINK token")
      return false
    } finally {
      setIsApproving(false)
    }
  }

  return { approveLinkToken, isApproving }
}

