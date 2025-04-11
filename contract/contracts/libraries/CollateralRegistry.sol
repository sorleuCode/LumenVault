// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library CollateralRegistry {
    struct CollateralInfo {
        address priceOracle;
        uint256 maxLTV;
        bool isActive;
    }

    function isCollateralValid(CollateralInfo storage info) internal view returns (bool) {
        return info.isActive && info.priceOracle != address(0) && info.maxLTV > 0;
    }
}
