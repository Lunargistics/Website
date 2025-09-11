// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title MissionRegistryV2
 * @dev Upgradeable version of MissionRegistry with UUPS pattern
 * @notice Manages space missions with on-chain registration and IPFS data storage
 */
contract MissionRegistryV2 is 
    Initializable, 
    UUPSUpgradeable, 
    OwnableUpgradeable, 
    PausableUpgradeable,
    ReentrancyGuardUpgradeable 
{
    // Mission status enum
    enum MissionStatus {
        Draft,
        Planning,
        InDevelopment,
        Testing,
        ReadyForLaunch,
        Active,
        Completed,
        Cancelled
    }

    // Mission struct
    struct Mission {
        string id;
        string name;
        address owner;
        string ipfsHash;
        MissionStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        string missionType;
        uint256 launchDate;
        uint256 endDate;
        string[] tags;
    }

    // State variables
    mapping(string => Mission) public missions;
    mapping(address => string[]) public userMissions;
    string[] public allMissionIds;
    
    // V2 additions
    mapping(string => address[]) public missionCollaborators;
    mapping(string => mapping(address => bool)) public hasAccess;
    uint256 public missionCounter;
    uint256 public constant MAX_COLLABORATORS = 50;

    // Events
    event MissionCreated(
        string indexed missionId,
        address indexed owner,
        string name,
        string ipfsHash
    );
    
    event MissionUpdated(
        string indexed missionId,
        address indexed updater,
        string ipfsHash,
        MissionStatus status
    );
    
    event CollaboratorAdded(
        string indexed missionId,
        address indexed collaborator,
        address indexed addedBy
    );
    
    event CollaboratorRemoved(
        string indexed missionId,
        address indexed collaborator,
        address indexed removedBy
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract (replaces constructor for upgradeable contracts)
     */
    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        missionCounter = 0;
    }

    /**
     * @dev Required by UUPSUpgradeable to authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Create a new mission
     */
    function createMission(
        string memory _name,
        string memory _ipfsHash,
        string memory _missionType,
        uint256 _launchDate,
        string[] memory _tags
    ) external whenNotPaused nonReentrant returns (string memory) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        
        missionCounter++;
        string memory missionId = string(abi.encodePacked("MISSION-", _toString(missionCounter)));
        
        Mission storage newMission = missions[missionId];
        newMission.id = missionId;
        newMission.name = _name;
        newMission.owner = msg.sender;
        newMission.ipfsHash = _ipfsHash;
        newMission.status = MissionStatus.Draft;
        newMission.createdAt = block.timestamp;
        newMission.updatedAt = block.timestamp;
        newMission.missionType = _missionType;
        newMission.launchDate = _launchDate;
        newMission.tags = _tags;
        
        userMissions[msg.sender].push(missionId);
        allMissionIds.push(missionId);
        hasAccess[missionId][msg.sender] = true;
        
        emit MissionCreated(missionId, msg.sender, _name, _ipfsHash);
        
        return missionId;
    }

    /**
     * @dev Update mission data
     */
    function updateMission(
        string memory _missionId,
        string memory _ipfsHash,
        MissionStatus _status
    ) external whenNotPaused {
        require(hasAccess[_missionId][msg.sender], "No access");
        require(bytes(missions[_missionId].id).length > 0, "Mission not found");
        
        Mission storage mission = missions[_missionId];
        mission.ipfsHash = _ipfsHash;
        mission.status = _status;
        mission.updatedAt = block.timestamp;
        
        if (_status == MissionStatus.Completed) {
            mission.endDate = block.timestamp;
        }
        
        emit MissionUpdated(_missionId, msg.sender, _ipfsHash, _status);
    }

    /**
     * @dev Add collaborator to mission (V2 feature)
     */
    function addCollaborator(
        string memory _missionId,
        address _collaborator
    ) external whenNotPaused {
        require(missions[_missionId].owner == msg.sender, "Only owner");
        require(_collaborator != address(0), "Invalid address");
        require(!hasAccess[_missionId][_collaborator], "Already has access");
        require(missionCollaborators[_missionId].length < MAX_COLLABORATORS, "Max collaborators");
        
        missionCollaborators[_missionId].push(_collaborator);
        hasAccess[_missionId][_collaborator] = true;
        
        emit CollaboratorAdded(_missionId, _collaborator, msg.sender);
    }

    /**
     * @dev Remove collaborator from mission (V2 feature)
     */
    function removeCollaborator(
        string memory _missionId,
        address _collaborator
    ) external whenNotPaused {
        require(missions[_missionId].owner == msg.sender, "Only owner");
        require(hasAccess[_missionId][_collaborator], "No access to remove");
        
        hasAccess[_missionId][_collaborator] = false;
        
        // Remove from array
        address[] storage collaborators = missionCollaborators[_missionId];
        for (uint i = 0; i < collaborators.length; i++) {
            if (collaborators[i] == _collaborator) {
                collaborators[i] = collaborators[collaborators.length - 1];
                collaborators.pop();
                break;
            }
        }
        
        emit CollaboratorRemoved(_missionId, _collaborator, msg.sender);
    }

    /**
     * @dev Get mission details
     */
    function getMission(string memory _missionId) 
        external 
        view 
        returns (Mission memory) 
    {
        require(bytes(missions[_missionId].id).length > 0, "Mission not found");
        return missions[_missionId];
    }

    /**
     * @dev Get user's missions
     */
    function getUserMissions(address _user) 
        external 
        view 
        returns (string[] memory) 
    {
        return userMissions[_user];
    }

    /**
     * @dev Get mission collaborators (V2 feature)
     */
    function getMissionCollaborators(string memory _missionId) 
        external 
        view 
        returns (address[] memory) 
    {
        return missionCollaborators[_missionId];
    }

    /**
     * @dev Get total number of missions
     */
    function getTotalMissions() external view returns (uint256) {
        return allMissionIds.length;
    }

    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Convert uint to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Get contract version
     */
    function version() external pure returns (string memory) {
        return "2.0.0";
    }
}
