import { useCallback, useState } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";


const useGetOwnerAddress = () => {
  const readOnlyTodoContract = useContractInstance();
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  return useCallback(
    async () => {
      

      if (!readOnlyTodoContract) {
        toast.error("Contract not found");
        return;
      }

     
      try {

        

       
          

          const ownerAddress = await readOnlyTodoContract.owner();


          if (ownerAddress){

            return ownerAddress;
            } 

          toast.error("Owner's address not fetched");
        
      } catch (error) {
        console.error("Error fetching owner's address", error);

        const errorDecoder = ErrorDecoder.create();
        const decodedError = await errorDecoder.decode(error);

        console.error("Decoded Error:", decodedError);
        toast.error("owner's address unable to fetch", decodedError);
      }
    },
    [ address, chainId]
  );
};

export default useGetOwnerAddress;
