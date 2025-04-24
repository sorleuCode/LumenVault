// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUsdt is ERC20, ERC20Burnable, Ownable {
    constructor()
        ERC20("UsdtToken", "mUSDT")
        Ownable(msg.sender)
    {

        _mint(msg.sender, 1000_1000 * 10**18);
    }

    function mint() public {
        _mint(msg.sender, 1000_1000 * 10**18);
    }
}