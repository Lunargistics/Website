// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Consider importing OpenZeppelin contracts for Ownable, AccessControl, ReentrancyGuard if needed later.
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/Strings.sol"; // For string operations if complex ones are needed

contract SpaceActivityManager {
    // --- Enums (mirroring TypeScript enums) ---
    enum ActivityType {
        ROCKET_LAUNCH,
        SATELLITE_DEPLOYMENT,
        EXPLORATION_MISSION,
        RESEARCH_PROJECT,
        SPACE_TOURISM,
        MANUFACTURING,
        RESOURCE_EXTRACTION,
        OTHER
    }

    enum ActivityStatus {
        PLANNED,
        PREPARATION,
        IN_PROGRESS,
        COMPLETED_SUCCESS,
        COMPLETED_FAILURE,
        COMPLETED_PARTIAL_SUCCESS,
        ON_HOLD,
        CANCELLED
    }

    enum DocComplianceStatus {
        PENDING_SUBMISSION,
        PENDING_REVIEW,
        APPROVED,
        REJECTED,
        ACTION_REQUIRED,
        EXPIRED,
        NOT_APPLICABLE
    }

    // --- Structs ---
    struct ComplianceDocument {
        bytes32 id; // Using bytes32 for on-chain ID, can be generated
        string documentName;
        string documentType; 
        string documentHashOrLink; // IPFS hash, URL, etc.
        DocComplianceStatus status;
        uint256 submittedDate; // timestamp
        uint256 reviewDate;    // timestamp
        uint256 expiryDate;    // timestamp
        string notes;
        string responsibleEntity;
    }

    struct Activity {
        bytes32 id;          // Unique ID for the activity
        address owner;       // Address of the user who logged the activity
        ActivityType activityType;
        string name;
        string description;
        string organization;
        string projectManager;
        uint256 startDate;     // timestamp
        uint256 endDate;       // timestamp
        uint256 launchDateTime; // timestamp, if applicable
        ActivityStatus status;
        
        string externalApiLaunchId; // For linking to external API data
        string externalApiSource;   // e.g., "general", "spacex"

        string launchSite;
        string destination;
        string payloadDetails;

        ComplianceDocument[] complianceDocuments;
        // overallComplianceSummary might be better handled off-chain or via events

        uint256 createdAt;     // timestamp
        uint256 updatedAt;     // timestamp
    }

    // --- State Variables ---
    mapping(bytes32 => Activity) private s_activities;
    mapping(address => bytes32[]) private s_activitiesByOwner;
    bytes32[] private s_allActivityIds; // To allow iterating or getting all (can be gas intensive)

    uint256 private s_activityNonce; // Used for generating unique IDs

    // --- Events ---
    event ActivityLogged(
        bytes32 indexed activityId,
        address indexed owner,
        string name,
        ActivityType activityType,
        uint256 createdAt
    );

    event ActivityUpdated(
        bytes32 indexed activityId,
        address indexed updater,
        ActivityStatus newStatus,
        uint256 updatedAt
    );

    event ComplianceDocumentAdded(
        bytes32 indexed activityId,
        bytes32 indexed documentId,
        string documentName,
        DocComplianceStatus status
    );

    event ComplianceDocumentUpdated(
        bytes32 indexed activityId,
        bytes32 indexed documentId,
        DocComplianceStatus newStatus
    );

    // --- Modifiers ---
    modifier onlyActivityOwner(bytes32 _activityId) {
        // This require implicitly checks for existence if owner is non-zero after creation
        require(s_activities[_activityId].owner != address(0), "SAM: Activity may not exist or has no owner");
        require(s_activities[_activityId].owner == msg.sender, "SAM: Caller is not activity owner");
        _;
    }

    // --- Constructor ---
    constructor() {
        s_activityNonce = 0;
    }

    // --- Internal ID Generation ---
    function _generateActivityId(string memory _name) internal returns (bytes32) {
        s_activityNonce++;
        return keccak256(abi.encodePacked(block.timestamp, msg.sender, s_activityNonce, _name));
    }

    function _generateDocumentId(bytes32 _activityId, string memory _docName) internal returns (bytes32) {
        // Ensure document ID is unique within the activity and globally if necessary
        // Here, we use activityId to scope, and an incrementing count specific to the activity for uniqueness.
        // This assumes s_activities[_activityId].complianceDocuments.length provides a unique enough counter for new docs.
        uint256 docNonce = s_activities[_activityId].complianceDocuments.length;
        return keccak256(abi.encodePacked(block.timestamp, _activityId, docNonce, _docName));
    }

    // --- Public/External Functions ---

    function logActivity(
        ActivityType _activityType,
        string memory _name,
        string memory _description,
        string memory _organization,
        string memory _projectManager,
        uint256 _startDate, // Use 0 if not applicable
        uint256 _endDate,   // Use 0 if not applicable
        uint256 _launchDateTime, // Use 0 if not applicable
        ActivityStatus _status,
        string memory _externalApiLaunchId,
        string memory _externalApiSource,
        string memory _launchSite,
        string memory _destination,
        string memory _payloadDetails
    ) external returns (bytes32 activityId) {
        require(bytes(_name).length > 0, "SAM: Activity name cannot be empty");
        
        activityId = _generateActivityId(_name);
        
        Activity storage newActivity = s_activities[activityId];
        newActivity.id = activityId;
        newActivity.owner = msg.sender;
        newActivity.activityType = _activityType;
        newActivity.name = _name;
        newActivity.description = _description;
        newActivity.organization = _organization;
        newActivity.projectManager = _projectManager;
        newActivity.startDate = _startDate;
        newActivity.endDate = _endDate;
        newActivity.launchDateTime = _launchDateTime;
        newActivity.status = _status;
        newActivity.externalApiLaunchId = _externalApiLaunchId;
        newActivity.externalApiSource = _externalApiSource;
        newActivity.launchSite = _launchSite;
        newActivity.destination = _destination;
        newActivity.payloadDetails = _payloadDetails;
        // newActivity.complianceDocuments is already initialized as an empty array for new storage structs
        newActivity.createdAt = block.timestamp;
        newActivity.updatedAt = block.timestamp;

        s_activitiesByOwner[msg.sender].push(activityId);
        s_allActivityIds.push(activityId);

        emit ActivityLogged(activityId, msg.sender, _name, _activityType, block.timestamp);
        return activityId;
    }

    // --- Getter Functions ---
    function getActivityById(bytes32 _activityId) external view returns (Activity memory) {
        require(s_activities[_activityId].id != bytes32(0), "SAM: Activity does not exist");
        return s_activities[_activityId];
    }

    function getActivitiesByOwner(address _owner) external view returns (bytes32[] memory) {
        return s_activitiesByOwner[_owner];
    }

    function getAllActivityIds() external view returns (bytes32[] memory) {
        return s_allActivityIds;
    }
    
    function getComplianceDocuments(bytes32 _activityId) external view returns (ComplianceDocument[] memory) {
        require(s_activities[_activityId].id != bytes32(0), "SAM: Activity does not exist");
        return s_activities[_activityId].complianceDocuments;
    }

    // --- Activity & Document Management Functions ---

    function updateActivityDetails(
        bytes32 _activityId,
        string memory _name,
        string memory _description,
        string memory _organization,
        string memory _projectManager,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _launchDateTime,
        ActivityStatus _status, 
        string memory _externalApiLaunchId,
        string memory _externalApiSource,
        string memory _launchSite,
        string memory _destination,
        string memory _payloadDetails
    ) external { // Removed onlyActivityOwner modifier for now
        // Explicit checks for existence and ownership
        require(s_activities[_activityId].id != bytes32(0), "SAM: Activity does not exist");
        require(s_activities[_activityId].owner == msg.sender, "SAM: Caller is not activity owner");
        require(bytes(_name).length > 0, "SAM: Activity name cannot be empty");

        Activity storage activityToUpdate = s_activities[_activityId];
        activityToUpdate.name = _name;
        activityToUpdate.description = _description;
        activityToUpdate.organization = _organization;
        activityToUpdate.projectManager = _projectManager;
        activityToUpdate.startDate = _startDate;
        activityToUpdate.endDate = _endDate;
        activityToUpdate.launchDateTime = _launchDateTime;
        activityToUpdate.status = _status;
        activityToUpdate.externalApiLaunchId = _externalApiLaunchId;
        activityToUpdate.externalApiSource = _externalApiSource;
        activityToUpdate.launchSite = _launchSite;
        activityToUpdate.destination = _destination;
        activityToUpdate.payloadDetails = _payloadDetails;
        activityToUpdate.updatedAt = block.timestamp;

        emit ActivityUpdated(_activityId, msg.sender, _status, block.timestamp);
    }

    function addComplianceDocumentToActivity(
        bytes32 _activityId,
        string memory _documentName,
        string memory _documentType,
        string memory _documentHashOrLink,
        DocComplianceStatus _status,
        uint256 _submittedDate,
        uint256 _expiryDate,
        string memory _notes,
        string memory _responsibleEntity
    ) external onlyActivityOwner(_activityId) returns (bytes32 documentId) {
        require(s_activities[_activityId].id != bytes32(0), "SAM: Activity does not exist");
        require(bytes(_documentName).length > 0, "SAM: Document name cannot be empty");

        documentId = _generateDocumentId(_activityId, _documentName);

        ComplianceDocument memory newDocument = ComplianceDocument({
            id: documentId,
            documentName: _documentName,
            documentType: _documentType,
            documentHashOrLink: _documentHashOrLink,
            status: _status,
            submittedDate: _submittedDate, // Use 0 if not applicable
            reviewDate: 0, // Review date TBD by a reviewer role later
            expiryDate: _expiryDate,   // Use 0 if not applicable
            notes: _notes,
            responsibleEntity: _responsibleEntity
        });

        s_activities[_activityId].complianceDocuments.push(newDocument);
        s_activities[_activityId].updatedAt = block.timestamp;

        emit ComplianceDocumentAdded(_activityId, documentId, _documentName, _status);
        return documentId;
    }

    function updateComplianceDocumentStatusInActivity(
        bytes32 _activityId,
        bytes32 _documentId,
        DocComplianceStatus _newStatus,
        uint256 _reviewDate // Reviewer sets this date
    ) external onlyActivityOwner(_activityId) { // For now, only owner. Could be a different role.
        require(s_activities[_activityId].id != bytes32(0), "SAM: Activity does not exist");
        
        ComplianceDocument[] storage documents = s_activities[_activityId].complianceDocuments;
        bool found = false;
        for (uint i = 0; i < documents.length; i++) {
            if (documents[i].id == _documentId) {
                documents[i].status = _newStatus;
                documents[i].reviewDate = _reviewDate; // Update review date
                s_activities[_activityId].updatedAt = block.timestamp;
                emit ComplianceDocumentUpdated(_activityId, _documentId, _newStatus);
                found = true;
                break;
            }
        }
        require(found, "SAM: Document not found in activity");
    }
    
    // Consider a function to update other fields of a compliance document if needed, by owner.
    // function updateComplianceDocumentDetails(...) internal onlyActivityOwner(_activityId) { ... }
} 