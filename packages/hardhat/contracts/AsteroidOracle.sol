// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AsteroidOracle is Ownable {
    struct AsteroidData {
        string asteroidId;
        string name;
        uint256 estimatedValue;
        uint256 diameter;
        mapping(string => uint256) composition;
        uint256 lastUpdated;
    }

    mapping(string => AsteroidData) public asteroids;
    mapping(string => mapping(string => uint256)) public asteroidComposition;
    string[] public trackedAsteroids;

    address public dataProvider;

    event AsteroidDataUpdated(string indexed asteroidId, string name, uint256 estimatedValue, uint256 timestamp);

    event CompositionUpdated(string indexed asteroidId, string commodity, uint256 percentage);

    modifier onlyDataProvider() {
        require(msg.sender == dataProvider || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {
        dataProvider = msg.sender;
    }

    function setDataProvider(address _provider) external onlyOwner {
        dataProvider = _provider;
    }

    function updateAsteroidData(
        string memory _asteroidId,
        string memory _name,
        uint256 _estimatedValue,
        uint256 _diameter
    ) external onlyDataProvider {
        AsteroidData storage asteroid = asteroids[_asteroidId];

        if (bytes(asteroid.asteroidId).length == 0) {
            trackedAsteroids.push(_asteroidId);
        }

        asteroid.asteroidId = _asteroidId;
        asteroid.name = _name;
        asteroid.estimatedValue = _estimatedValue;
        asteroid.diameter = _diameter;
        asteroid.lastUpdated = block.timestamp;

        emit AsteroidDataUpdated(_asteroidId, _name, _estimatedValue, block.timestamp);
    }

    function updateComposition(
        string memory _asteroidId,
        string memory _commodity,
        uint256 _percentage
    ) external onlyDataProvider {
        require(_percentage <= 10000, "Percentage must be <= 10000 (100%)");
        asteroidComposition[_asteroidId][_commodity] = _percentage;
        asteroids[_asteroidId].composition[_commodity] = _percentage;

        emit CompositionUpdated(_asteroidId, _commodity, _percentage);
    }

    function batchUpdateComposition(
        string memory _asteroidId,
        string[] memory _commodities,
        uint256[] memory _percentages
    ) external onlyDataProvider {
        require(_commodities.length == _percentages.length, "Arrays length mismatch");

        for (uint256 i = 0; i < _commodities.length; i++) {
            require(_percentages[i] <= 10000, "Percentage must be <= 10000 (100%)");
            asteroidComposition[_asteroidId][_commodities[i]] = _percentages[i];
            asteroids[_asteroidId].composition[_commodities[i]] = _percentages[i];

            emit CompositionUpdated(_asteroidId, _commodities[i], _percentages[i]);
        }
    }

    function getAsteroidValue(string memory _asteroidId) external view returns (uint256) {
        return asteroids[_asteroidId].estimatedValue;
    }

    function getComposition(string memory _asteroidId, string memory _commodity) external view returns (uint256) {
        return asteroidComposition[_asteroidId][_commodity];
    }

    function getTrackedAsteroids() external view returns (string[] memory) {
        return trackedAsteroids;
    }

    function isDataStale(string memory _asteroidId, uint256 _maxAge) external view returns (bool) {
        return block.timestamp - asteroids[_asteroidId].lastUpdated > _maxAge;
    }
}
