// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SpaceElementsNFT
 * @dev NFT contract for PNT (Position Navigation Timing) SpaceElements with ERC2981 royalty support
 * Compatible with OpenSea's SeaPort protocol for royalty enforcement
 */
contract SpaceElementsNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable,
    ERC721Burnable, 
    ERC2981,
    Ownable,
    ReentrancyGuard 
{
    uint256 private _tokenIdCounter;
    
    // PNT Element Types
    enum ElementType {
        GPS_WIDGET,
        GALILEO_WIDGET,
        GLONASS_WIDGET,
        BEIDOU_WIDGET,
        TIMING_SYNC,
        ORBIT_TRACKER,
        GROUND_STATION,
        SIGNAL_PROCESSOR,
        CUSTOM_ALGORITHM
    }
    
    // Element metadata structure
    struct SpaceElement {
        uint256 tokenId;
        address creator;
        ElementType elementType;
        string name;
        string description;
        string widgetCode; // IPFS hash of the widget code
        string documentation; // IPFS hash of documentation
        uint256 version;
        uint256 createdAt;
        uint256 lastUpdated;
        bool isActive;
        uint256 usageCount;
        uint256 rating; // Out of 1000 (allows for decimal precision)
        uint256 ratingCount;
    }
    
    // Marketplace data
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 listedAt;
    }
    
    // Mappings
    mapping(uint256 => SpaceElement) public spaceElements;
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public creatorElements;
    mapping(string => bool) public widgetCodeExists;
    mapping(uint256 => mapping(address => uint256)) public elementRatings;
    mapping(uint256 => address[]) public elementSubscribers;
    
    // Constants
    uint96 public constant DEFAULT_ROYALTY_BASIS_POINTS = 750; // 7.5% royalty
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public mintPrice = 0.01 ether;
    
    // Events
    event ElementCreated(
        uint256 indexed tokenId,
        address indexed creator,
        ElementType elementType,
        string name,
        string widgetCode
    );
    
    event ElementListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    
    event ElementSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );
    
    event ElementUpdated(
        uint256 indexed tokenId,
        uint256 version,
        string newWidgetCode
    );
    
    event ElementRated(
        uint256 indexed tokenId,
        address indexed rater,
        uint256 rating
    );
    
    event ElementSubscribed(
        uint256 indexed tokenId,
        address indexed subscriber
    );
    
    constructor() ERC721("SpaceElements PNT Widgets", "SPNT") Ownable(msg.sender) {
        // Set default royalty for all tokens
        _setDefaultRoyalty(msg.sender, DEFAULT_ROYALTY_BASIS_POINTS);
    }
    
    /**
     * @dev Create a new SpaceElement NFT
     */
    function createSpaceElement(
        ElementType _elementType,
        string memory _name,
        string memory _description,
        string memory _widgetCode,
        string memory _documentation,
        string memory _tokenURI
    ) public payable nonReentrant returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient mint fee");
        require(!widgetCodeExists[_widgetCode], "Widget code already exists");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_widgetCode).length > 0, "Widget code cannot be empty");
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // Set royalty for this specific token (creator gets royalties)
        _setTokenRoyalty(tokenId, msg.sender, DEFAULT_ROYALTY_BASIS_POINTS);
        
        SpaceElement storage element = spaceElements[tokenId];
        element.tokenId = tokenId;
        element.creator = msg.sender;
        element.elementType = _elementType;
        element.name = _name;
        element.description = _description;
        element.widgetCode = _widgetCode;
        element.documentation = _documentation;
        element.version = 1;
        element.createdAt = block.timestamp;
        element.lastUpdated = block.timestamp;
        element.isActive = true;
        element.usageCount = 0;
        element.rating = 0;
        element.ratingCount = 0;
        
        creatorElements[msg.sender].push(tokenId);
        widgetCodeExists[_widgetCode] = true;
        
        emit ElementCreated(tokenId, msg.sender, _elementType, _name, _widgetCode);
        
        return tokenId;
    }
    
    /**
     * @dev Update an existing SpaceElement (only by creator)
     */
    function updateSpaceElement(
        uint256 _tokenId,
        string memory _newWidgetCode,
        string memory _newDocumentation,
        string memory _newTokenURI
    ) public {
        require(_exists(_tokenId), "Token does not exist");
        SpaceElement storage element = spaceElements[_tokenId];
        require(element.creator == msg.sender, "Only creator can update");
        require(!widgetCodeExists[_newWidgetCode] || 
                keccak256(bytes(element.widgetCode)) == keccak256(bytes(_newWidgetCode)), 
                "Widget code already exists");
        
        // Update widget code tracking
        if (keccak256(bytes(element.widgetCode)) != keccak256(bytes(_newWidgetCode))) {
            delete widgetCodeExists[element.widgetCode];
            widgetCodeExists[_newWidgetCode] = true;
            element.widgetCode = _newWidgetCode;
        }
        
        element.documentation = _newDocumentation;
        element.version++;
        element.lastUpdated = block.timestamp;
        
        _setTokenURI(_tokenId, _newTokenURI);
        
        emit ElementUpdated(_tokenId, element.version, _newWidgetCode);
    }
    
    /**
     * @dev List a SpaceElement for sale
     */
    function listElement(uint256 _tokenId, uint256 _price) public {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(_price > 0, "Price must be greater than 0");
        require(!listings[_tokenId].isActive, "Already listed");
        
        listings[_tokenId] = Listing({
            tokenId: _tokenId,
            seller: msg.sender,
            price: _price,
            isActive: true,
            listedAt: block.timestamp
        });
        
        emit ElementListed(_tokenId, msg.sender, _price);
    }
    
    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 _tokenId) public {
        require(listings[_tokenId].isActive, "Not listed");
        require(listings[_tokenId].seller == msg.sender, "Not the seller");
        
        listings[_tokenId].isActive = false;
        
        emit ElementListed(_tokenId, msg.sender, 0);
    }
    
    /**
     * @dev Purchase a listed SpaceElement
     */
    function purchaseElement(uint256 _tokenId) public payable nonReentrant {
        Listing memory listing = listings[_tokenId];
        require(listing.isActive, "Not for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        require(seller != msg.sender, "Cannot buy your own NFT");
        
        // Calculate royalty
        (address royaltyReceiver, uint256 royaltyAmount) = royaltyInfo(_tokenId, listing.price);
        
        // Transfer payment
        uint256 sellerAmount = listing.price - royaltyAmount;
        
        // Pay royalty to creator
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool royaltySuccess, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(royaltySuccess, "Royalty transfer failed");
        }
        
        // Pay seller
        (bool sellerSuccess, ) = payable(seller).call{value: sellerAmount}("");
        require(sellerSuccess, "Seller transfer failed");
        
        // Transfer NFT
        _transfer(seller, msg.sender, _tokenId);
        
        // Update listing
        listings[_tokenId].isActive = false;
        
        // Update usage count
        spaceElements[_tokenId].usageCount++;
        
        emit ElementSold(_tokenId, seller, msg.sender, listing.price);
        
        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }
    }
    
    /**
     * @dev Rate a SpaceElement
     */
    function rateElement(uint256 _tokenId, uint256 _rating) public {
        require(_exists(_tokenId), "Token does not exist");
        require(_rating <= 1000, "Rating must be <= 1000");
        require(elementRatings[_tokenId][msg.sender] == 0, "Already rated");
        
        SpaceElement storage element = spaceElements[_tokenId];
        
        // Update rating
        uint256 totalRating = element.rating * element.ratingCount;
        element.ratingCount++;
        element.rating = (totalRating + _rating) / element.ratingCount;
        
        elementRatings[_tokenId][msg.sender] = _rating;
        
        emit ElementRated(_tokenId, msg.sender, _rating);
    }
    
    /**
     * @dev Subscribe to a SpaceElement for updates
     */
    function subscribeToElement(uint256 _tokenId) public {
        require(_exists(_tokenId), "Token does not exist");
        
        address[] storage subscribers = elementSubscribers[_tokenId];
        for (uint i = 0; i < subscribers.length; i++) {
            require(subscribers[i] != msg.sender, "Already subscribed");
        }
        
        subscribers.push(msg.sender);
        
        emit ElementSubscribed(_tokenId, msg.sender);
    }
    
    /**
     * @dev Get creator's elements
     */
    function getCreatorElements(address _creator) public view returns (uint256[] memory) {
        return creatorElements[_creator];
    }
    
    /**
     * @dev Get element subscribers
     */
    function getElementSubscribers(uint256 _tokenId) public view returns (address[] memory) {
        return elementSubscribers[_tokenId];
    }
    
    /**
     * @dev Get active listings
     */
    function getActiveListings() public view returns (uint256[] memory) {
        uint256 totalSupply = _tokenIdCounter;
        uint256[] memory activeTokenIds = new uint256[](totalSupply);
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < totalSupply; i++) {
            if (listings[i].isActive) {
                activeTokenIds[activeCount] = i;
                activeCount++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            result[i] = activeTokenIds[i];
        }
        
        return result;
    }
    
    /**
     * @dev Update mint price (only owner)
     */
    function setMintPrice(uint256 _newPrice) public onlyOwner {
        mintPrice = _newPrice;
    }
    
    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Required overrides for OpenZeppelin v5
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        
        // If burning (to == address(0)), clean up element data
        if (to == address(0)) {
            delete spaceElements[tokenId];
            delete listings[tokenId];
            delete widgetCodeExists[spaceElements[tokenId].widgetCode];
        }
        
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}