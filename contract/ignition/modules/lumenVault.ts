import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";


const lumenVaultModule = buildModule("lumenVaultModule", (m) => {

  const mockUSDT = m.contract("MockUSDT");

  const _initialPttUsdtPrice = ethers.parseUnits("0.05", 18)

  const pharosTestToken  = "0xcB8a4dF93DEB878ae10044E37Ffc1ea7450630b8"

  

  const lumenVault = m.contract("LoanManager", [mockUSDT, pharosTestToken, _initialPttUsdtPrice]);



  return { lumenVault };
});

export default lumenVaultModule;



