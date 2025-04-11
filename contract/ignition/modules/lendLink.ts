import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const lendLinkModule = buildModule("lendLinkModule", (m) => {

  const linkTokenContract = "0xE4aB69C077896252FAFBD49EFD26B5D171A32410";
  const chainlinkPriceFeed = "0x56a43EB56Da12C0dc1D972ACb089c06a5dEF8e69";
  

  const lendLink = m.contract("LoanManager", [linkTokenContract, chainlinkPriceFeed]);



  return { lendLink };
});

export default lendLinkModule;



