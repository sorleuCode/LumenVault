import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";


const lumenVaultModule = buildModule("lumenVaultModule", (m) => {

  const mockUSDT = m.contract("MockUsdt", ["Mock Usdt", "MUSDT"]);

  const _initialPttUsdtPrice = ethers.parseUnits("0.5", 18)

  

  

  const lumenVault = m.contract("LoanManager", [mockUSDT, _initialPttUsdtPrice]);



  return { lumenVault };
});

export default lumenVaultModule;



