import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { baseSepolia } from "@reown/appkit/networks";
import { ErrorDecoder } from "ethers-decode-error";
import { formatUnits } from "ethers";

const useGetLoanTotalRepayment = () => {
    const contract = useContractInstance();
    const { address } = useAppKitAccount();
    const { chainId } = useAppKitNetwork();

    return useCallback(
        async (loanId) => {
            if (!loanId) {
                toast.error("Invalid loan");
                return;
            }

            // if (!address) {
            //     toast.error("Please connect your wallet");
            //     return;
            // }

            if (!contract) {
                toast.error("Contract not found");
                return;
            }

            if (Number(chainId) !== Number(baseSepolia.id)) {
                toast.error("You're not connected to baseSepolia");
                return;
            }

            try {


                const [totalPayment, principal, interestAmount] = await contract.getTotalLoanPayment(loanId)



                return {
                    totalPayment: Number(formatUnits(totalPayment, 18)).toFixed(7), // Converts to Ether
                    principal: formatUnits(principal, 18), // Converts to Ether
                    interestAmount: Number(formatUnits(interestAmount, 18)).toFixed(8)
                }
            } catch (error) {
                console.error(error);

                const errorDecoder = ErrorDecoder.create();
                const decodedError = await errorDecoder.decode(error);

                console.error("Error requesting loan", decodedError);
                toast.error("Repayment price failed to fetch", decodedError);
            }
        },
        [contract, address, chainId]
    );
};

export default useGetLoanTotalRepayment;
