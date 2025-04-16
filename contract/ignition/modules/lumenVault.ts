import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";


const lumenVaultModule = buildModule("lumenVaultModule", (m) => {

  const mockUSDT = m.contract("MockUSDT");

  const _initialPttUsdtPrice = ethers.parseUnits("0.05", 18)

  

  

  const lumenVault = m.contract("LoanManager", [mockUSDT, _initialPttUsdtPrice]);



  return { lumenVault };
});

export default lumenVaultModule;



