import { useCallback } from "react";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";
import { Contract, formatUnits } from "ethers";
import usdtTokenABI from "../ABI/usdtToken.json"
import useSignerOrProvider from "./useSignerOrProvider";


const useGetContractLinkBalance = () => {
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { readOnlyProvider } = useSignerOrProvider()
  const usdtTokenContractAddress = import.meta.env.VITE_USDT_TOKEN_CONTRACT_ADDRESS;
  const lumenVaultContractAddress = import.meta.env.VITE_LUMEN_VAULT_CONTRACT_ADDRESS;




  const usdtTokenContract = new Contract(usdtTokenContractAddress, usdtTokenABI, readOnlyProvider);

  return useCallback(
    async () => {

      if (!usdtTokenContract) {
        toast.error("Contract not found");
        return;
      }


      try {



        const contractLinkBalance = await usdtTokenContract.balanceOf(String(lumenVaultContractAddress).toString());

        console.log({ contractLinkBalance })
        return formatUnits(String(contractLinkBalance), 18)



      } catch (error) {
        console.error("error fetching balance", error);

        const errorDecoder = ErrorDecoder.create();
        const decodedError = await errorDecoder.decode(error);

        console.error("Decoded Error:", decodedError);
      }
    },
    [address, chainId, usdtTokenContract]
  );
};

export default useGetContractLinkBalance;

