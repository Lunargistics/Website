// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AsteroidLiquidityPool.sol";
import "./AsteroidTokenFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AsteroidDEX is Ownable {
    AsteroidTokenFactory public tokenFactory;
    
    struct Pool {
        address poolAddress;
        address token0;
        address token1;
        uint256 createdAt;
    }
    
    mapping(address => mapping(address => address)) public getPair;
    Pool[] public allPools;
    
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 poolId);
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _tokenFactory) Ownable(msg.sender) {
        tokenFactory = AsteroidTokenFactory(_tokenFactory);
    }
    
    function createPair(address tokenA, address tokenB) external returns (address pool) {
        require(tokenA != tokenB, "Identical addresses");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Zero address");
        require(getPair[token0][token1] == address(0), "Pair exists");
        
        AsteroidLiquidityPool newPool = new AsteroidLiquidityPool(token0, token1);
        pool = address(newPool);
        
        getPair[token0][token1] = pool;
        getPair[token1][token0] = pool;
        
        allPools.push(Pool({
            poolAddress: pool,
            token0: token0,
            token1: token1,
            createdAt: block.timestamp
        }));
        
        emit PairCreated(token0, token1, pool, allPools.length - 1);
    }
    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        address pool = getPair[tokenA][tokenB];
        require(pool != address(0), "Pool does not exist");
        
        (amountA, amountB) = _calculateOptimalAmounts(
            pool,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin
        );
        
        IERC20(tokenA).transferFrom(msg.sender, pool, amountA);
        IERC20(tokenB).transferFrom(msg.sender, pool, amountB);
        
        liquidity = AsteroidLiquidityPool(pool).mint(to);
    }
    
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external returns (uint256 amountA, uint256 amountB) {
        address pool = getPair[tokenA][tokenB];
        require(pool != address(0), "Pool does not exist");
        
        AsteroidLiquidityPool(pool).transferFrom(msg.sender, pool, liquidity);
        (amountA, amountB) = AsteroidLiquidityPool(pool).burn(to);
        
        require(amountA >= amountAMin, "Insufficient A amount");
        require(amountB >= amountBMin, "Insufficient B amount");
    }
    
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to
    ) external returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient output amount");
        
        IERC20(path[0]).transferFrom(msg.sender, getPair[path[0]][path[1]], amounts[0]);
        
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            address pool = getPair[input][output];
            uint256 amountOut = amounts[i + 1];
            
            (address token0,) = input < output ? (input, output) : (output, input);
            (uint256 amount0Out, uint256 amount1Out) = input == token0 
                ? (uint256(0), amountOut) 
                : (amountOut, uint256(0));
            
            address toAddress = i < path.length - 2 ? getPair[output][path[i + 2]] : to;
            AsteroidLiquidityPool(pool).swap(amount0Out, amount1Out, toAddress);
        }
        
        emit SwapExecuted(msg.sender, path[0], path[path.length - 1], amountIn, amounts[amounts.length - 1]);
    }
    
    function getAmountsOut(uint256 amountIn, address[] memory path) 
        public 
        view 
        returns (uint256[] memory amounts) 
    {
        require(path.length >= 2, "Invalid path");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        for (uint256 i; i < path.length - 1; i++) {
            address pool = getPair[path[i]][path[i + 1]];
            require(pool != address(0), "Pool does not exist");
            
            (uint256 reserveIn, uint256 reserveOut) = _getReserves(pool, path[i], path[i + 1]);
            amounts[i + 1] = AsteroidLiquidityPool(pool).getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }
    
    function _calculateOptimalAmounts(
        address pool,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal view returns (uint256 amountA, uint256 amountB) {
        (uint256 reserveA, uint256 reserveB) = AsteroidLiquidityPool(pool).getReserves();
        
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "Insufficient A amount");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
    
    function _getReserves(address pool, address tokenA, address tokenB) 
        internal 
        view 
        returns (uint256 reserveA, uint256 reserveB) 
    {
        (address token0,) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        (uint256 reserve0, uint256 reserve1) = AsteroidLiquidityPool(pool).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }
    
    function getAllPools() external view returns (Pool[] memory) {
        return allPools;
    }
}