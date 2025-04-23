import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { readOnlyProvider } from "../constants/readOnlyProvider";

const useSignerOrProvider = () => {
  const [signer, setSigner] = useState(null);
  const { walletProvider } = useAppKitProvider("eip155");
  const { address: walletAddress } = useAppKitAccount();

  const provider = useMemo(
    () => (walletProvider ? new BrowserProvider(walletProvider) : null),
    [walletProvider]
  );

  useEffect(() => {
    if (!provider || !walletAddress) {
      setSigner(null);
      return;
    }

    let mounted = true;

    const fetchSigner = async () => {
      try {
        const newSigner = await provider.getSigner();
        const signerAddress = await newSigner.getAddress();
        

        if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          console.warn("Signer address does not match wallet address");
          if (mounted) {
            setSigner(null);
          }
          return;
        }

        if (mounted) {
          setSigner(newSigner);
        }
      } catch (error) {
        console.error("Error fetching signer:", error);
        if (mounted) {
          setSigner(null);
        }
      }
    };

    fetchSigner();

    return () => {
      mounted = false;
    };
  }, [provider, walletAddress]);

  return { signer, provider, readOnlyProvider };
};

export default useSignerOrProvider;