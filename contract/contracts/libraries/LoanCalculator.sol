// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LoanCalculator {
  function calculatePeriodicInterest(
    uint256 principal, 
    uint256 annualRate, 
    uint256 timeElapsed
) internal pure returns (uint256) {
    require(principal > 0, "Principal must be greater than 0");
    require(annualRate > 0, "Annual rate must be greater than 0");
    require(timeElapsed > 0, "Time elapsed must be greater than 0");

    uint256 ratePerSecond = (annualRate * 1e18) / (365 * 24 * 60 * 60 * 100); // Annual rate as a percentage
    require(ratePerSecond > 0, "Rate per second is invalid");

    // Calculate interest accrued for the given timeElapsed
    uint256 accruedInterest = (principal * ratePerSecond * timeElapsed) / 1e18;

    return accruedInterest;
}



    function calculateTotalOwed(
        uint256 principal,
        uint256 accruedInterest
    ) internal pure returns (uint256) {
        return principal + accruedInterest;
    }
}
