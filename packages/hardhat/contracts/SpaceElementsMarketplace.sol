// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

interface ISpaceElementsNFT is IERC721, IERC2981 {
    struct SpaceElement {
        uint256 tokenId;
        address creator;
        uint8 elementType;
        string name;
        string description;
        string widgetCode;
        string documentation;
        uint256 version;
        uint256 createdAt;
        uint256 lastUpdated;
        bool isActive;
        uint256 usageCount;
        uint256 rating;
        uint256 ratingCount;
    }

    function spaceElements(
        uint256 tokenId
    )
        external
        view
        returns (
            uint256,
            address,
            uint8,
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            uint256,
            bool,
            uint256,
            uint256,
            uint256
        );
}

/**
 * @title SpaceElementsMarketplace
 * @dev Advanced marketplace for PNT SpaceElements with SeaPort compatibility
 * Supports auctions, offers, bundles, and advanced royalty distribution
 */
contract SpaceElementsMarketplace is ReentrancyGuard, Pausable, Ownable {
    // Marketplace fee (2.5%)
    uint256 public constant MARKETPLACE_FEE_BASIS_POINTS = 250;
    uint256 public constant BASIS_POINTS = 10000;

    ISpaceElementsNFT public immutable spaceElementsNFT;

    // Order types
    enum OrderType {
        FIXED_PRICE,
        AUCTION,
        OFFER,
        BUNDLE
    }

    enum OrderStatus {
        ACTIVE,
        EXECUTED,
        CANCELLED,
        EXPIRED
    }

    // Core order structure (SeaPort-compatible)
    struct Order {
        address offerer;
        address zone;
        OrderType orderType;
        uint256 startTime;
        uint256 endTime;
        bytes32 zoneHash;
        uint256 salt;
        OrderStatus status;
    }

    // Offer item structure
    struct OfferItem {
        uint256 tokenId;
        uint256 amount;
    }

    // Consideration item structure
    struct ConsiderationItem {
        address recipient;
        uint256 amount;
    }

    // Auction structure
    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 startingPrice;
        uint256 reservePrice;
        uint256 currentBid;
        address currentBidder;
        uint256 startTime;
        uint256 endTime;
        bool settled;
        uint256 bidIncrement;
    }

    // Bundle structure
    struct Bundle {
        uint256[] tokenIds;
        address seller;
        uint256 price;
        bool isActive;
        string bundleName;
        string bundleDescription;
    }

    // Offer structure
    struct Offer {
        uint256 tokenId;
        address offerer;
        uint256 amount;
        uint256 expirationTime;
        bool isActive;
    }

    // Subscription plan for PNT services
    struct SubscriptionPlan {
        uint256 tokenId;
        uint256 monthlyFee;
        uint256 subscribers;
        bool isActive;
        address beneficiary;
    }

    // State mappings
    mapping(bytes32 => Order) public orders;
    mapping(uint256 => Auction) public auctions;
    mapping(bytes32 => Bundle) public bundles;
    mapping(bytes32 => Offer) public offers;
    mapping(uint256 => SubscriptionPlan) public subscriptionPlans;
    mapping(address => mapping(uint256 => uint256)) public subscriptionExpiry;

    // Statistics tracking
    mapping(uint256 => uint256) public totalVolume;
    mapping(uint256 => uint256) public totalSales;
    mapping(address => uint256) public userVolume;
    mapping(address => uint256) public userEarnings;

    // Events
    event OrderCreated(
        bytes32 indexed orderHash,
        address indexed offerer,
        OrderType orderType,
        uint256 startTime,
        uint256 endTime
    );

    event OrderFulfilled(
        bytes32 indexed orderHash,
        address indexed offerer,
        address indexed fulfiller,
        uint256 totalAmount
    );

    event OrderCancelled(bytes32 indexed orderHash, address indexed offerer);

    event AuctionCreated(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 endTime
    );

    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);

    event AuctionSettled(uint256 indexed tokenId, address indexed winner, uint256 amount);

    event BundleCreated(bytes32 indexed bundleId, address indexed seller, uint256[] tokenIds, uint256 price);

    event OfferMade(bytes32 indexed offerId, uint256 indexed tokenId, address indexed offerer, uint256 amount);

    event SubscriptionCreated(uint256 indexed tokenId, uint256 monthlyFee, address beneficiary);

    event SubscriptionPurchased(uint256 indexed tokenId, address indexed subscriber, uint256 expiryTime);

    constructor(address _spaceElementsNFT) Ownable(msg.sender) {
        spaceElementsNFT = ISpaceElementsNFT(_spaceElementsNFT);
    }

    /**
     * @dev Create a fixed price listing (SeaPort-compatible)
     */
    function createOrder(
        OfferItem[] calldata offer,
        ConsiderationItem[] calldata consideration,
        OrderType orderType,
        uint256 startTime,
        uint256 endTime,
        bytes32 zoneHash,
        uint256 salt
    ) external whenNotPaused returns (bytes32 orderHash) {
        require(offer.length > 0, "No offer items");
        require(consideration.length > 0, "No consideration items");
        require(endTime > startTime, "Invalid time range");
        require(endTime > block.timestamp, "Order already expired");

        // Verify ownership of offered tokens
        for (uint i = 0; i < offer.length; i++) {
            require(spaceElementsNFT.ownerOf(offer[i].tokenId) == msg.sender, "Not token owner");
        }

        orderHash = _hashOrder(msg.sender, offer, consideration, orderType, startTime, endTime, zoneHash, salt);

        orders[orderHash] = Order({
            offerer: msg.sender,
            zone: address(0),
            orderType: orderType,
            startTime: startTime,
            endTime: endTime,
            zoneHash: zoneHash,
            salt: salt,
            status: OrderStatus.ACTIVE
        });

        emit OrderCreated(orderHash, msg.sender, orderType, startTime, endTime);
    }

    /**
     * @dev Create an auction
     */
    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 duration,
        uint256 bidIncrement
    ) external whenNotPaused {
        require(spaceElementsNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(startingPrice > 0, "Invalid starting price");
        require(reservePrice >= startingPrice, "Invalid reserve price");
        require(duration > 0, "Invalid duration");
        require(bidIncrement > 0, "Invalid bid increment");
        require(auctions[tokenId].endTime < block.timestamp, "Auction exists");

        auctions[tokenId] = Auction({
            tokenId: tokenId,
            seller: msg.sender,
            startingPrice: startingPrice,
            reservePrice: reservePrice,
            currentBid: 0,
            currentBidder: address(0),
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            settled: false,
            bidIncrement: bidIncrement
        });

        emit AuctionCreated(tokenId, msg.sender, startingPrice, reservePrice, block.timestamp + duration);
    }

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 tokenId) external payable nonReentrant whenNotPaused {
        Auction storage auction = auctions[tokenId];
        require(auction.endTime > block.timestamp, "Auction ended");
        require(!auction.settled, "Auction settled");

        uint256 minBid = auction.currentBid == 0 ? auction.startingPrice : auction.currentBid + auction.bidIncrement;

        require(msg.value >= minBid, "Bid too low");

        // Refund previous bidder
        if (auction.currentBidder != address(0)) {
            (bool success, ) = payable(auction.currentBidder).call{ value: auction.currentBid }("");
            require(success, "Refund failed");
        }

        auction.currentBid = msg.value;
        auction.currentBidder = msg.sender;

        // Extend auction if bid is placed in last 5 minutes
        if (auction.endTime - block.timestamp < 300) {
            auction.endTime = block.timestamp + 300;
        }

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    /**
     * @dev Settle an auction
     */
    function settleAuction(uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.endTime <= block.timestamp, "Auction not ended");
        require(!auction.settled, "Already settled");

        auction.settled = true;

        if (auction.currentBid >= auction.reservePrice && auction.currentBidder != address(0)) {
            // Calculate fees and royalties
            (address royaltyReceiver, uint256 royaltyAmount) = spaceElementsNFT.royaltyInfo(
                tokenId,
                auction.currentBid
            );
            uint256 marketplaceFee = (auction.currentBid * MARKETPLACE_FEE_BASIS_POINTS) / BASIS_POINTS;
            uint256 sellerAmount = auction.currentBid - royaltyAmount - marketplaceFee;

            // Transfer NFT
            spaceElementsNFT.transferFrom(auction.seller, auction.currentBidder, tokenId);

            // Distribute payments
            if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
                (bool royaltySuccess, ) = payable(royaltyReceiver).call{ value: royaltyAmount }("");
                require(royaltySuccess, "Royalty transfer failed");
            }

            (bool feeSuccess, ) = payable(owner()).call{ value: marketplaceFee }("");
            require(feeSuccess, "Fee transfer failed");

            (bool sellerSuccess, ) = payable(auction.seller).call{ value: sellerAmount }("");
            require(sellerSuccess, "Seller transfer failed");

            // Update statistics
            totalVolume[tokenId] += auction.currentBid;
            totalSales[tokenId]++;
            userVolume[auction.currentBidder] += auction.currentBid;
            userEarnings[auction.seller] += sellerAmount;

            emit AuctionSettled(tokenId, auction.currentBidder, auction.currentBid);
        } else {
            // Refund bidder if reserve not met
            if (auction.currentBidder != address(0)) {
                (bool refundSuccess, ) = payable(auction.currentBidder).call{ value: auction.currentBid }("");
                require(refundSuccess, "Refund failed");
            }

            emit AuctionSettled(tokenId, address(0), 0);
        }
    }

    /**
     * @dev Create a bundle listing
     */
    function createBundle(
        uint256[] calldata tokenIds,
        uint256 price,
        string calldata bundleName,
        string calldata bundleDescription
    ) external whenNotPaused returns (bytes32 bundleId) {
        require(tokenIds.length > 1, "Need multiple tokens");
        require(price > 0, "Invalid price");

        // Verify ownership
        for (uint i = 0; i < tokenIds.length; i++) {
            require(spaceElementsNFT.ownerOf(tokenIds[i]) == msg.sender, "Not owner");
        }

        bundleId = keccak256(abi.encodePacked(msg.sender, tokenIds, block.timestamp));

        bundles[bundleId] = Bundle({
            tokenIds: tokenIds,
            seller: msg.sender,
            price: price,
            isActive: true,
            bundleName: bundleName,
            bundleDescription: bundleDescription
        });

        emit BundleCreated(bundleId, msg.sender, tokenIds, price);
    }

    /**
     * @dev Purchase a bundle
     */
    function purchaseBundle(bytes32 bundleId) external payable nonReentrant whenNotPaused {
        Bundle storage bundle = bundles[bundleId];
        require(bundle.isActive, "Bundle not active");
        require(msg.value >= bundle.price, "Insufficient payment");

        bundle.isActive = false;

        // Calculate fees
        uint256 marketplaceFee = (bundle.price * MARKETPLACE_FEE_BASIS_POINTS) / BASIS_POINTS;
        uint256 totalRoyalties = 0;

        // Transfer all NFTs and calculate royalties
        for (uint i = 0; i < bundle.tokenIds.length; i++) {
            uint256 tokenId = bundle.tokenIds[i];

            // Get royalty info
            (address royaltyReceiver, uint256 royaltyAmount) = spaceElementsNFT.royaltyInfo(
                tokenId,
                bundle.price / bundle.tokenIds.length
            );

            if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
                totalRoyalties += royaltyAmount;
                (bool royaltySuccess, ) = payable(royaltyReceiver).call{ value: royaltyAmount }("");
                require(royaltySuccess, "Royalty transfer failed");
            }

            // Transfer NFT
            spaceElementsNFT.transferFrom(bundle.seller, msg.sender, tokenId);

            // Update statistics
            totalVolume[tokenId] += bundle.price / bundle.tokenIds.length;
            totalSales[tokenId]++;
        }

        // Pay marketplace fee
        (bool feeSuccess, ) = payable(owner()).call{ value: marketplaceFee }("");
        require(feeSuccess, "Fee transfer failed");

        // Pay seller
        uint256 sellerAmount = bundle.price - marketplaceFee - totalRoyalties;
        (bool sellerSuccess, ) = payable(bundle.seller).call{ value: sellerAmount }("");
        require(sellerSuccess, "Seller transfer failed");

        // Update user statistics
        userVolume[msg.sender] += bundle.price;
        userEarnings[bundle.seller] += sellerAmount;

        // Refund excess
        if (msg.value > bundle.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{ value: msg.value - bundle.price }("");
            require(refundSuccess, "Refund failed");
        }
    }

    /**
     * @dev Create a subscription plan for a SpaceElement
     */
    function createSubscriptionPlan(uint256 tokenId, uint256 monthlyFee) external whenNotPaused {
        require(spaceElementsNFT.ownerOf(tokenId) == msg.sender, "Not owner");
        require(monthlyFee > 0, "Invalid fee");
        require(!subscriptionPlans[tokenId].isActive, "Plan exists");

        subscriptionPlans[tokenId] = SubscriptionPlan({
            tokenId: tokenId,
            monthlyFee: monthlyFee,
            subscribers: 0,
            isActive: true,
            beneficiary: msg.sender
        });

        emit SubscriptionCreated(tokenId, monthlyFee, msg.sender);
    }

    /**
     * @dev Subscribe to a SpaceElement
     */
    function subscribe(uint256 tokenId, uint256 months) external payable nonReentrant whenNotPaused {
        SubscriptionPlan storage plan = subscriptionPlans[tokenId];
        require(plan.isActive, "No subscription plan");
        require(months > 0 && months <= 12, "Invalid duration");

        uint256 totalFee = plan.monthlyFee * months;
        require(msg.value >= totalFee, "Insufficient payment");

        // Calculate new expiry
        uint256 currentExpiry = subscriptionExpiry[msg.sender][tokenId];
        uint256 newExpiry = currentExpiry > block.timestamp
            ? currentExpiry + (30 days * months)
            : block.timestamp + (30 days * months);

        subscriptionExpiry[msg.sender][tokenId] = newExpiry;

        if (currentExpiry <= block.timestamp) {
            plan.subscribers++;
        }

        // Distribute payment
        uint256 marketplaceFee = (totalFee * MARKETPLACE_FEE_BASIS_POINTS) / BASIS_POINTS;
        uint256 beneficiaryAmount = totalFee - marketplaceFee;

        (bool feeSuccess, ) = payable(owner()).call{ value: marketplaceFee }("");
        require(feeSuccess, "Fee transfer failed");

        (bool beneficiarySuccess, ) = payable(plan.beneficiary).call{ value: beneficiaryAmount }("");
        require(beneficiarySuccess, "Beneficiary transfer failed");

        // Refund excess
        if (msg.value > totalFee) {
            (bool refundSuccess, ) = payable(msg.sender).call{ value: msg.value - totalFee }("");
            require(refundSuccess, "Refund failed");
        }

        emit SubscriptionPurchased(tokenId, msg.sender, newExpiry);
    }

    /**
     * @dev Check if user has active subscription
     */
    function hasActiveSubscription(address user, uint256 tokenId) external view returns (bool) {
        return subscriptionExpiry[user][tokenId] > block.timestamp;
    }

    /**
     * @dev Hash an order for signature verification
     */
    function _hashOrder(
        address offerer,
        OfferItem[] calldata offer,
        ConsiderationItem[] calldata consideration,
        OrderType orderType,
        uint256 startTime,
        uint256 endTime,
        bytes32 zoneHash,
        uint256 salt
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    offerer,
                    keccak256(abi.encode(offer)),
                    keccak256(abi.encode(consideration)),
                    orderType,
                    startTime,
                    endTime,
                    zoneHash,
                    salt
                )
            );
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw marketplace fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = payable(owner()).call{ value: balance }("");
        require(success, "Withdrawal failed");
    }
}
