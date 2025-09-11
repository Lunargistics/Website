// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MissionRegistry
 * @dev On-chain registry for space missions with IPFS metadata storage
 */
contract MissionRegistry is Ownable {
    uint256 private _missionIdCounter;

    enum MissionPhase {
        PrePhaseA,
        PhaseA,
        PhaseB,
        PhaseC,
        PhaseD,
        PhaseE,
        PhaseF,
        Completed,
        Cancelled
    }

    enum MissionType {
        EarthObservation,
        Communications,
        Science,
        Navigation,
        Technology,
        HumanSpaceflight,
        Exploration,
        Commercial
    }

    struct Mission {
        uint256 id;
        string name;
        address owner;
        MissionType missionType;
        MissionPhase currentPhase;
        string ipfsMetadataHash; // Full mission data stored on IPFS
        string orbitDataHash; // TLE/OEM data on IPFS
        uint256 launchDate;
        uint256 endDate;
        bool isActive;
        uint256[] equipmentTokenIds; // Links to SpaceEquipmentNFT tokens
        uint256[] documentHashes; // Links to compliance documents
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct MissionRequirement {
        string requirement;
        bool verified;
        address verifier;
        uint256 verifiedAt;
        string evidenceHash; // IPFS hash of verification evidence
    }

    // Mission ID => Mission
    mapping(uint256 => Mission) public missions;

    // Mission ID => array of requirements
    mapping(uint256 => MissionRequirement[]) public missionRequirements;

    // Mission ID => phase => completion percentage
    mapping(uint256 => mapping(MissionPhase => uint8)) public phaseCompletion;

    // Owner address => array of mission IDs
    mapping(address => uint256[]) public ownerMissions;

    // Events
    event MissionCreated(uint256 indexed missionId, string name, address indexed owner, MissionType missionType);
    event MissionPhaseUpdated(uint256 indexed missionId, MissionPhase newPhase, uint8 completionPercentage);
    event MissionMetadataUpdated(uint256 indexed missionId, string newIpfsHash);
    event RequirementAdded(uint256 indexed missionId, string requirement);
    event RequirementVerified(uint256 indexed missionId, uint256 requirementIndex, address verifier);
    event OrbitDataUpdated(uint256 indexed missionId, string newOrbitDataHash);
    event EquipmentLinked(uint256 indexed missionId, uint256 equipmentTokenId);
    event DocumentLinked(uint256 indexed missionId, uint256 documentHash);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new mission
     */
    function createMission(
        string memory _name,
        MissionType _missionType,
        string memory _ipfsMetadataHash,
        uint256 _launchDate,
        uint256 _endDate
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_launchDate > block.timestamp, "Launch date must be in future");
        require(_endDate > _launchDate, "End date must be after launch");

        _missionIdCounter++;
        uint256 newMissionId = _missionIdCounter;

        Mission storage newMission = missions[newMissionId];
        newMission.id = newMissionId;
        newMission.name = _name;
        newMission.owner = msg.sender;
        newMission.missionType = _missionType;
        newMission.currentPhase = MissionPhase.PrePhaseA;
        newMission.ipfsMetadataHash = _ipfsMetadataHash;
        newMission.launchDate = _launchDate;
        newMission.endDate = _endDate;
        newMission.isActive = true;
        newMission.createdAt = block.timestamp;
        newMission.updatedAt = block.timestamp;

        ownerMissions[msg.sender].push(newMissionId);

        emit MissionCreated(newMissionId, _name, msg.sender, _missionType);

        return newMissionId;
    }

    /**
     * @dev Update mission phase and completion
     */
    function updateMissionPhase(uint256 _missionId, MissionPhase _newPhase, uint8 _completionPercentage) external {
        require(missions[_missionId].id != 0, "Mission does not exist");
        require(missions[_missionId].owner == msg.sender || owner() == msg.sender, "Not authorized");
        require(_completionPercentage <= 100, "Completion cannot exceed 100%");

        missions[_missionId].currentPhase = _newPhase;
        missions[_missionId].updatedAt = block.timestamp;
        phaseCompletion[_missionId][_newPhase] = _completionPercentage;

        emit MissionPhaseUpdated(_missionId, _newPhase, _completionPercentage);
    }

    /**
     * @dev Update mission metadata (IPFS hash)
     */
    function updateMissionMetadata(uint256 _missionId, string memory _newIpfsHash) external {
        require(missions[_missionId].id != 0, "Mission does not exist");
        require(missions[_missionId].owner == msg.sender, "Not owner");

        missions[_missionId].ipfsMetadataHash = _newIpfsHash;
        missions[_missionId].updatedAt = block.timestamp;

        emit MissionMetadataUpdated(_missionId, _newIpfsHash);
    }

    /**
     * @dev Update orbit data (TLE/OEM)
     */
    function updateOrbitData(uint256 _missionId, string memory _orbitDataHash) external {
        require(missions[_missionId].id != 0, "Mission does not exist");
        require(missions[_missionId].owner == msg.sender, "Not owner");

        missions[_missionId].orbitDataHash = _orbitDataHash;
        missions[_missionId].updatedAt = block.timestamp;

        emit OrbitDataUpdated(_missionId, _orbitDataHash);
    }

    /**
     * @dev Add a requirement to mission
     */
    function addRequirement(uint256 _missionId, string memory _requirement) external {
        require(missions[_missionId].id != 0, "Mission does not exist");
        require(missions[_missionId].owner == msg.sender, "Not owner");

        MissionRequirement memory newReq = MissionRequirement({
            requirement: _requirement,
            verified: false,
            verifier: address(0),
            verifiedAt: 0,
            evidenceHash: ""
        });

        missionRequirements[_missionId].push(newReq);

        emit RequirementAdded(_missionId, _requirement);
    }

    /**
     * @dev Verify a requirement
     */
    function verifyRequirement(uint256 _missionId, uint256 _requirementIndex, string memory _evidenceHash) external {
        require(missions[_missionId].id != 0, "Mission does not exist");
        require(_requirementIndex < missionRequirements[_missionId].length, "Invalid requirement index");

        MissionRequirement storage req = missionRequirements[_missionId][_requirementIndex];
        req.verified = true;
        req.verifier = msg.sender;
        req.verifiedAt = block.timestamp;
        req.evidenceHash = _evidenceHash;

        emit RequirementVerified(_missionId, _requirementIndex, msg.sender);
    }

    /**
     * @dev Link equipment NFT to mission
     */
    function linkEquipment(uint256 _missionId, uint256 _equipmentTokenId) external {
        require(missions[_missionId].id != 0, "Mission does not exist");
        require(missions[_missionId].owner == msg.sender, "Not owner");

        missions[_missionId].equipmentTokenIds.push(_equipmentTokenId);
        missions[_missionId].updatedAt = block.timestamp;

        emit EquipmentLinked(_missionId, _equipmentTokenId);
    }

    /**
     * @dev Link document to mission
     */
    function linkDocument(uint256 _missionId, uint256 _documentHash) external {
        require(missions[_missionId].id != 0, "Mission does not exist");
        require(missions[_missionId].owner == msg.sender, "Not owner");

        missions[_missionId].documentHashes.push(_documentHash);
        missions[_missionId].updatedAt = block.timestamp;

        emit DocumentLinked(_missionId, _documentHash);
    }

    /**
     * @dev Get mission details
     */
    function getMission(uint256 _missionId) external view returns (Mission memory) {
        require(missions[_missionId].id != 0, "Mission does not exist");
        return missions[_missionId];
    }

    /**
     * @dev Get missions by owner
     */
    function getMissionsByOwner(address _owner) external view returns (uint256[] memory) {
        return ownerMissions[_owner];
    }

    /**
     * @dev Get mission requirements
     */
    function getMissionRequirements(uint256 _missionId) external view returns (MissionRequirement[] memory) {
        return missionRequirements[_missionId];
    }

    /**
     * @dev Get total number of missions
     */
    function getTotalMissions() external view returns (uint256) {
        return _missionIdCounter;
    }
}
