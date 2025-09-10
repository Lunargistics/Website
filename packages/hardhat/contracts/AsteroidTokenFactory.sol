// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AsteroidCommodityToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AsteroidTokenFactory is Ownable {
    struct AsteroidToken {
        address tokenAddress;
        string asteroidId;
        string commodity;
        uint256 totalSupply;
        uint256 createdAt;
    }
    
    mapping(string => mapping(string => address)) public asteroidCommodityTokens;
    mapping(address => AsteroidToken) public tokenInfo;
    address[] public allTokens;
    
    event TokenCreated(
        address indexed tokenAddress,
        string asteroidId,
        string commodity,
        uint256 initialSupply
    );
    
    constructor() Ownable(msg.sender) {}
    
    function createAsteroidToken(
        string memory _asteroidId,
        string memory _commodity,
        uint256 _initialSupply
    ) external onlyOwner returns (address) {
        require(
            asteroidCommodityTokens[_asteroidId][_commodity] == address(0),
            "Token already exists for this asteroid-commodity pair"
        );
        
        string memory name = string(abi.encodePacked("Asteroid ", _asteroidId, " ", _commodity));
        string memory symbol = string(abi.encodePacked("A", _asteroidId, _commodity));
        
        AsteroidCommodityToken newToken = new AsteroidCommodityToken(
            name,
            symbol,
            _asteroidId,
            _commodity,
            _initialSupply
        );
        
        address tokenAddress = address(newToken);
        asteroidCommodityTokens[_asteroidId][_commodity] = tokenAddress;
        
        tokenInfo[tokenAddress] = AsteroidToken({
            tokenAddress: tokenAddress,
            asteroidId: _asteroidId,
            commodity: _commodity,
            totalSupply: _initialSupply,
            createdAt: block.timestamp
        });
        
        allTokens.push(tokenAddress);
        
        emit TokenCreated(tokenAddress, _asteroidId, _commodity, _initialSupply);
        
        return tokenAddress;
    }
    
    function getToken(string memory _asteroidId, string memory _commodity) external view returns (address) {
        return asteroidCommodityTokens[_asteroidId][_commodity];
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
    
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }
}