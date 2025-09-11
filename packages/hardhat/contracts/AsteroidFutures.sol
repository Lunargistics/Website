// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AsteroidOracle.sol";

contract AsteroidFutures is ReentrancyGuard, Ownable {
    struct Future {
        uint256 id;
        address creator;
        address commodity;
        uint256 amount;
        uint256 strikePrice;
        uint256 expiry;
        bool isLong;
        bool isSettled;
        address counterparty;
        uint256 collateral;
    }

    struct Position {
        uint256[] futureIds;
        uint256 totalCollateral;
        uint256 unrealizedPnL;
    }

    AsteroidOracle public oracle;
    IERC20 public collateralToken;

    uint256 public nextFutureId = 1;
    uint256 public constant COLLATERAL_RATIO = 150; // 150% collateralization
    uint256 public constant MIN_DURATION = 1 days;
    uint256 public constant MAX_DURATION = 365 days;

    mapping(uint256 => Future) public futures;
    mapping(address => Position) public positions;
    mapping(address => uint256) public commodityPrices;

    event FutureCreated(
        uint256 indexed futureId,
        address indexed creator,
        address commodity,
        uint256 amount,
        uint256 strikePrice,
        uint256 expiry,
        bool isLong
    );

    event FutureMatched(uint256 indexed futureId, address indexed counterparty);
    event FutureSettled(uint256 indexed futureId, uint256 settlementPrice, int256 pnl);
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);

    constructor(address _oracle, address _collateralToken) Ownable(msg.sender) {
        oracle = AsteroidOracle(_oracle);
        collateralToken = IERC20(_collateralToken);
    }

    function createFuture(
        address _commodity,
        uint256 _amount,
        uint256 _strikePrice,
        uint256 _duration,
        bool _isLong
    ) external nonReentrant returns (uint256) {
        require(_duration >= MIN_DURATION && _duration <= MAX_DURATION, "Invalid duration");
        require(_amount > 0, "Amount must be positive");

        uint256 requiredCollateral = (_amount * _strikePrice * COLLATERAL_RATIO) / 10000;
        require(
            collateralToken.transferFrom(msg.sender, address(this), requiredCollateral),
            "Collateral transfer failed"
        );

        uint256 futureId = nextFutureId++;
        futures[futureId] = Future({
            id: futureId,
            creator: msg.sender,
            commodity: _commodity,
            amount: _amount,
            strikePrice: _strikePrice,
            expiry: block.timestamp + _duration,
            isLong: _isLong,
            isSettled: false,
            counterparty: address(0),
            collateral: requiredCollateral
        });

        positions[msg.sender].futureIds.push(futureId);
        positions[msg.sender].totalCollateral += requiredCollateral;

        emit FutureCreated(
            futureId,
            msg.sender,
            _commodity,
            _amount,
            _strikePrice,
            block.timestamp + _duration,
            _isLong
        );

        return futureId;
    }

    function takeFuture(uint256 _futureId) external nonReentrant {
        Future storage future = futures[_futureId];
        require(future.counterparty == address(0), "Future already matched");
        require(future.expiry > block.timestamp, "Future expired");
        require(future.creator != msg.sender, "Cannot take own future");

        uint256 requiredCollateral = (future.amount * future.strikePrice * COLLATERAL_RATIO) / 10000;
        require(
            collateralToken.transferFrom(msg.sender, address(this), requiredCollateral),
            "Collateral transfer failed"
        );

        future.counterparty = msg.sender;
        positions[msg.sender].futureIds.push(_futureId);
        positions[msg.sender].totalCollateral += requiredCollateral;

        emit FutureMatched(_futureId, msg.sender);
    }

    function settleFuture(uint256 _futureId, uint256 _settlementPrice) external nonReentrant {
        Future storage future = futures[_futureId];
        require(!future.isSettled, "Already settled");
        require(block.timestamp >= future.expiry, "Not yet expired");
        require(future.counterparty != address(0), "No counterparty");

        future.isSettled = true;

        int256 priceDiff = int256(_settlementPrice) - int256(future.strikePrice);
        int256 pnl = (priceDiff * int256(future.amount)) / 1e18;

        address winner;
        address loser;
        uint256 payout;

        if ((future.isLong && pnl > 0) || (!future.isLong && pnl < 0)) {
            winner = future.creator;
            loser = future.counterparty;
        } else {
            winner = future.counterparty;
            loser = future.creator;
        }

        if (pnl < 0) pnl = -pnl;
        payout = uint256(pnl);

        if (payout > future.collateral) {
            payout = future.collateral;
        }

        uint256 totalCollateral = future.collateral * 2;
        uint256 winnerPayout = future.collateral + payout;
        uint256 loserReturn = totalCollateral > winnerPayout ? totalCollateral - winnerPayout : 0;

        if (winnerPayout > 0) {
            collateralToken.transfer(winner, winnerPayout);
            positions[winner].totalCollateral -= future.collateral;
        }

        if (loserReturn > 0) {
            collateralToken.transfer(loser, loserReturn);
            positions[loser].totalCollateral -= future.collateral;
        }

        emit FutureSettled(_futureId, _settlementPrice, pnl);
    }

    function cancelFuture(uint256 _futureId) external nonReentrant {
        Future storage future = futures[_futureId];
        require(future.creator == msg.sender, "Not the creator");
        require(future.counterparty == address(0), "Already matched");
        require(!future.isSettled, "Already settled");

        collateralToken.transfer(msg.sender, future.collateral);
        positions[msg.sender].totalCollateral -= future.collateral;

        future.isSettled = true;
    }

    function updatePrice(address _commodity, uint256 _price) external onlyOwner {
        commodityPrices[_commodity] = _price;
    }

    function getPosition(address _user) external view returns (Position memory) {
        return positions[_user];
    }

    function getFuture(uint256 _futureId) external view returns (Future memory) {
        return futures[_futureId];
    }

    function getActivePositions(address _user) external view returns (uint256[] memory) {
        Position memory pos = positions[_user];
        uint256 count = 0;

        for (uint256 i = 0; i < pos.futureIds.length; i++) {
            if (!futures[pos.futureIds[i]].isSettled) {
                count++;
            }
        }

        uint256[] memory active = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < pos.futureIds.length; i++) {
            if (!futures[pos.futureIds[i]].isSettled) {
                active[index++] = pos.futureIds[i];
            }
        }

        return active;
    }
}
