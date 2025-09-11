// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AsteroidCommodityToken is ERC20, Ownable {
    string public asteroidId;
    string public commodity;
    uint256 public estimatedValue;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _asteroidId,
        string memory _commodity,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        asteroidId = _asteroidId;
        commodity = _commodity;
        _mint(msg.sender, _initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
