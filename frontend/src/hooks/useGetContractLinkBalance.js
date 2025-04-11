import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { baseSepolia } from "@reown/appkit/networks";
import { ErrorDecoder } from "ethers-decode-error";
import { Contract, formatUnits, parseUnits } from "ethers";
import linkTokenABI from "../ABI/linkToken.json"
import useSignerOrProvider from "./useSignerOrProvider";


const useGetContractLinkBalance = () => {
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { readOnlyProvider } = useSignerOrProvider()
  const linkTokenContractAddress = import.meta.env.VITE_LINK_TOKEN_CONTRACT_ADDRESS;
  const lendLinkContractAddress = import.meta.env.VITE_LEND_LINK_CONTRACT_ADDRESS



  const linkContract = new Contract(linkTokenContractAddress, linkTokenABI, readOnlyProvider);

  return useCallback(
    async () => {
      

      // if (!address) {
      //   toast.error("Please connect your wallet");
      //   return;
      // }

      if (!linkContract) {
        toast.error("Contract not found");
        return;
      }

      if (Number(chainId) !== Number(baseSepolia.id)) {
        toast.error("You're not connected to baseSepolia");
        return;
      }

      try {



        const contractLinkBalance = await linkContract.balanceOf(String(lendLinkContractAddress).toString());

            console.log({contractLinkBalance})
            return formatUnits(String(contractLinkBalance), 18)


        
      } catch (error) {
        console.error("error fetching balance", error);

        const errorDecoder = ErrorDecoder.create();
        const decodedError = await errorDecoder.decode(error);

        console.error("Decoded Error:", decodedError);
        toast.error("error fetching balance", decodedError);
      }
    },
    [ address, chainId, linkContract]
  );
};

export default useGetContractLinkBalance;

