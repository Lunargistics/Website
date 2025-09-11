// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SpaceEquipmentNFT
 * @dev NFT contract for spacecraft equipment and components library
 */
contract SpaceEquipmentNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    enum EquipmentCategory {
        Bus,
        Payload,
        PowerSystem,
        PropulsionSystem,
        ThermalControl,
        AttitudeControl,
        Communication,
        DataHandling,
        Structure,
        GroundSegment,
        LaunchVehicle,
        Other
    }

    enum ComplianceStandard {
        None,
        ECSS,
        NASA,
        CCSDS,
        ISO,
        MIL_STD,
        Custom
    }

    struct EquipmentSpec {
        string name;
        string manufacturer;
        EquipmentCategory category;
        uint256 mass; // in grams
        uint256 power; // in milliwatts
        uint256 dataRate; // in bits per second
        uint256 volume; // in cubic centimeters
        uint256 cost; // in USD cents
        ComplianceStandard[] standards;
        string[] interfaces; // e.g., "SpaceWire", "CAN", "RS-422"
        uint256 trl; // Technology Readiness Level (1-9)
        uint256 heritage; // Number of successful missions
        bool spaceQualified;
        string ipfsDataHash; // Detailed specs, CAD models, datasheets on IPFS
    }

    struct Compatibility {
        uint256 equipmentId1;
        uint256 equipmentId2;
        bool isCompatible;
        string reason;
    }

    // Token ID => Equipment Specifications
    mapping(uint256 => EquipmentSpec) public equipmentSpecs;

    // Compatibility matrix: hash(id1, id2) => Compatibility
    mapping(bytes32 => Compatibility) public compatibilityMatrix;

    // Category => array of token IDs
    mapping(EquipmentCategory => uint256[]) public equipmentByCategory;

    // Events
    event EquipmentMinted(uint256 indexed tokenId, string name, EquipmentCategory category);
    event SpecsUpdated(uint256 indexed tokenId, string ipfsDataHash);
    event CompatibilityDefined(uint256 indexed id1, uint256 indexed id2, bool isCompatible);
    event HeritageUpdated(uint256 indexed tokenId, uint256 newHeritage);

    constructor() ERC721("Space Equipment NFT", "SEQUIP") Ownable(msg.sender) {}

    /**
     * @dev Mint new equipment NFT
     */
    function mintEquipment(
        address to,
        string memory name,
        string memory manufacturer,
        EquipmentCategory category,
        string memory tokenURI,
        string memory ipfsDataHash
    ) external onlyOwner returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        EquipmentSpec storage spec = equipmentSpecs[tokenId];
        spec.name = name;
        spec.manufacturer = manufacturer;
        spec.category = category;
        spec.ipfsDataHash = ipfsDataHash;
        spec.trl = 1;
        spec.heritage = 0;
        spec.spaceQualified = false;

        equipmentByCategory[category].push(tokenId);

        emit EquipmentMinted(tokenId, name, category);

        return tokenId;
    }

    /**
     * @dev Update equipment specifications
     */
    function updateSpecs(
        uint256 tokenId,
        uint256 mass,
        uint256 power,
        uint256 dataRate,
        uint256 volume,
        uint256 cost,
        uint256 trl,
        bool spaceQualified
    ) external {
        require(_ownerOf(tokenId) != address(0), "Equipment does not exist");
        require(ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized");

        EquipmentSpec storage spec = equipmentSpecs[tokenId];
        spec.mass = mass;
        spec.power = power;
        spec.dataRate = dataRate;
        spec.volume = volume;
        spec.cost = cost;
        spec.trl = trl;
        spec.spaceQualified = spaceQualified;
    }

    /**
     * @dev Add compliance standard to equipment
     */
    function addComplianceStandard(uint256 tokenId, ComplianceStandard standard) external {
        require(_ownerOf(tokenId) != address(0), "Equipment does not exist");
        require(owner() == msg.sender, "Only owner can add standards");

        equipmentSpecs[tokenId].standards.push(standard);
    }

    /**
     * @dev Add interface to equipment
     */
    function addInterface(uint256 tokenId, string memory interfaceName) external {
        require(_ownerOf(tokenId) != address(0), "Equipment does not exist");
        require(ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized");

        equipmentSpecs[tokenId].interfaces.push(interfaceName);
    }

    /**
     * @dev Update IPFS data hash
     */
    function updateIPFSData(uint256 tokenId, string memory newIpfsHash) external {
        require(_ownerOf(tokenId) != address(0), "Equipment does not exist");
        require(ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized");

        equipmentSpecs[tokenId].ipfsDataHash = newIpfsHash;

        emit SpecsUpdated(tokenId, newIpfsHash);
    }

    /**
     * @dev Update heritage (successful missions)
     */
    function updateHeritage(uint256 tokenId, uint256 newHeritage) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Equipment does not exist");

        equipmentSpecs[tokenId].heritage = newHeritage;

        emit HeritageUpdated(tokenId, newHeritage);
    }

    /**
     * @dev Define compatibility between two equipment
     */
    function defineCompatibility(uint256 id1, uint256 id2, bool isCompatible, string memory reason) external onlyOwner {
        require(_ownerOf(id1) != address(0), "Equipment 1 does not exist");
        require(_ownerOf(id2) != address(0), "Equipment 2 does not exist");

        bytes32 key = getCompatibilityKey(id1, id2);

        compatibilityMatrix[key] = Compatibility({
            equipmentId1: id1,
            equipmentId2: id2,
            isCompatible: isCompatible,
            reason: reason
        });

        emit CompatibilityDefined(id1, id2, isCompatible);
    }

    /**
     * @dev Check compatibility between two equipment
     */
    function checkCompatibility(uint256 id1, uint256 id2) external view returns (bool, string memory) {
        bytes32 key = getCompatibilityKey(id1, id2);
        Compatibility memory compat = compatibilityMatrix[key];

        if (compat.equipmentId1 == 0 && compat.equipmentId2 == 0) {
            return (true, "No compatibility issues defined");
        }

        return (compat.isCompatible, compat.reason);
    }

    /**
     * @dev Get equipment specifications
     */
    function getEquipmentSpecs(uint256 tokenId) external view returns (EquipmentSpec memory) {
        require(_ownerOf(tokenId) != address(0), "Equipment does not exist");
        return equipmentSpecs[tokenId];
    }

    /**
     * @dev Get equipment by category
     */
    function getEquipmentByCategory(EquipmentCategory category) external view returns (uint256[] memory) {
        return equipmentByCategory[category];
    }

    /**
     * @dev Calculate total mass for array of equipment
     */
    function calculateTotalMass(uint256[] memory equipmentIds) external view returns (uint256) {
        uint256 totalMass = 0;
        for (uint256 i = 0; i < equipmentIds.length; i++) {
            totalMass += equipmentSpecs[equipmentIds[i]].mass;
        }
        return totalMass;
    }

    /**
     * @dev Calculate total power for array of equipment
     */
    function calculateTotalPower(uint256[] memory equipmentIds) external view returns (uint256) {
        uint256 totalPower = 0;
        for (uint256 i = 0; i < equipmentIds.length; i++) {
            totalPower += equipmentSpecs[equipmentIds[i]].power;
        }
        return totalPower;
    }

    /**
     * @dev Calculate total cost for array of equipment
     */
    function calculateTotalCost(uint256[] memory equipmentIds) external view returns (uint256) {
        uint256 totalCost = 0;
        for (uint256 i = 0; i < equipmentIds.length; i++) {
            totalCost += equipmentSpecs[equipmentIds[i]].cost;
        }
        return totalCost;
    }

    /**
     * @dev Get compatibility key for two equipment IDs
     */
    function getCompatibilityKey(uint256 id1, uint256 id2) private pure returns (bytes32) {
        if (id1 < id2) {
            return keccak256(abi.encodePacked(id1, id2));
        } else {
            return keccak256(abi.encodePacked(id2, id1));
        }
    }

    // Override functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
