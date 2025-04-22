// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockUsdt {
    string private tokenName;
    string private tokenSymbol;
    uint256 private totalSupply;
    address private owner;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allow;

    constructor(string memory _name, string memory _symbol) {
        tokenName = _name;
        tokenSymbol = _symbol;
        owner = msg.sender;
        mint(1_000_000, owner);
    }

    event Transfer(address indexed sender, address indexed receiver, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    function name() external view returns (string memory) {
        return tokenName;
    }

    function symbol() external view returns (string memory) {
        return tokenSymbol;
    }

    function toTalSupply() external view returns (uint256) {
        return totalSupply;
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function balanceOf(address _address) external view returns (uint256) {
        return balances[_address];
    }

    function transfer(address _receiver, uint256 _amountOfToken) external returns (bool) {
        require(_receiver != address(0), "Address is not allowed");
        require(_amountOfToken <= balances[msg.sender], "Insufficient balance");

        balances[msg.sender] -= _amountOfToken;
        balances[_receiver] += _amountOfToken;

        emit Transfer(msg.sender, _receiver, _amountOfToken);
        return true;
    }

    function approve(address _delegate, uint256 _amountOfToken) external returns (bool) {
        require(balances[msg.sender] >= _amountOfToken, "Insufficient balance");

        allow[msg.sender][_delegate] = _amountOfToken;

        emit Approval(msg.sender, _delegate, _amountOfToken);
        return true;
    }

    function allowance(address _owner, address _delegate) external view returns (uint256) {
        return allow[_owner][_delegate];
    }

    function transferFrom(address _owner, address _buyer, uint256 _amountOfToken) external returns (bool) {
        require(_owner != address(0), "Address is not allowed");
        require(_buyer != address(0), "Address is not allowed");
        require(_amountOfToken <= balances[_owner], "Insufficient owner balance");
        require(_amountOfToken <= allow[_owner][msg.sender], "Insufficient allowance");

        balances[_owner] -= _amountOfToken;
        allow[_owner][msg.sender] -= _amountOfToken;
        balances[_buyer] += _amountOfToken;

        emit Transfer(_owner, _buyer, _amountOfToken);
        return true;
    }

    function burn(address _address, uint256 _amount) internal {
        require(balances[_address] >= _amount, "Insufficient balance to burn");
        balances[_address] -= _amount;
        totalSupply -= _amount;

        emit Transfer(_address, address(0), _amount);
    }

    function mint(uint256 _amount, address _addr) public {
        uint256 actualSupply = _amount * 10**18;
        balances[_addr] += actualSupply;
        totalSupply += actualSupply;

        emit Transfer(address(0), _addr, actualSupply);
    }
}