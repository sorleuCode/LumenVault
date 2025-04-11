// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library CollateralUtils {
    function calculateCollateralValue(uint256 amount, uint256 price, uint256 decimals) internal pure returns (uint256) {

        
        return (amount * (10 ** decimals) / price);
    }

    function calculateRequiredCollateral(
        uint256 loanAmount,
        uint256 price,
        uint256 collateralizationRatio,
        uint256 decimals
    ) internal pure returns (uint256) {
        
        return (loanAmount * price * collateralizationRatio) / (100 * 10 ** decimals);
    }
}