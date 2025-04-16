import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";
import { Contract, parseUnits } from "ethers";
import usdtTokenABI from "../ABI/usdtToken.json"
import useSignerOrProvider from "./useSignerOrProvider";


const useRepayLoan = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const usdtTokenContractAddress = import.meta.env.VITE_USDT_TOKEN_CONTRACT_ADDRESS;
  const lumenVaultContractAddress = import.meta.env.VITE_LUMEN_VAULT_CONTRACT_ADDRESS

  const { signer } = useSignerOrProvider();

  const usdtContract = new Contract(usdtTokenContractAddress, usdtTokenABI, signer);

  return useCallback(
    async (loanId, repayment) => {

      console.log({repayment})

      const numRepayment = Number(repayment);
      const twiceRepayment = numRepayment * 2;
      const stringRepayment = String(repayment)

      console.log({stringRepayment, loanId})
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

        // const estimatedGas = await usdtTokenContractAddress?.approve?.estimateGas(
        //   lumenVaultContractAddress,
        //     parseUnits(repayment, 18)
        // );

        // if (!estimatedGas) {
        //   toast.error("Gas estimation failed");
        //   return;
        // }

        const tx = await usdtContract.approve(lumenVaultContractAddress, parseUnits('3', 18));

        
        const trxReceipt = await tx.wait()

        if (trxReceipt.status === 1) {
          // const estimatedGasLoan = await contract.repayLoanWithReward.estimateGas(loanId);

          // if (!estimatedGasLoan) {
          //   toast.error("Gas estimation for loan failed");
          //   return;
          // }

          const txLoan = await contract.repayLoanWithReward(loanId);

          const trxReceipt = await txLoan.wait();

          if (trxReceipt.status === 1) {
            toast.success("Loan repaid successfully!")
            return true;
          }

          toast.error("Failed to repay loan");
        } else {
          toast.error("Approval failed");
        }
      } catch (error) {
        console.error("Error repaying loan", error);

        const errorDecoder = ErrorDecoder.create();
        const decodedError = await errorDecoder.decode(error);

        console.error("Decoded Error:", decodedError);
        toast.error("Loan repayment failed", decodedError);
      }
    },
    [contract, address, chainId, usdtContract]
  );
};

export default useRepayLoan;

