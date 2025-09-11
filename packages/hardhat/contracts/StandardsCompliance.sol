// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title StandardsCompliance
 * @dev Smart contract for tracking ECSS, CCSDS, and other space standards compliance
 */
contract StandardsCompliance is AccessControl {
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    uint256 private _standardIdCounter;
    uint256 private _checklistIdCounter;

    enum StandardType {
        ECSS_E, // Engineering
        ECSS_M, // Management
        ECSS_Q, // Product Assurance
        ECSS_U, // Sustainability
        CCSDS_Blue, // Recommended Standards
        CCSDS_Magenta, // Recommended Practices
        NASA_STD,
        ISO,
        MIL_STD,
        Custom
    }

    enum ComplianceLevel {
        NotAssessed,
        NonCompliant,
        PartiallyCompliant,
        FullyCompliant,
        Exceeds
    }

    struct Standard {
        uint256 id;
        string code; // e.g., "ECSS-E-ST-50C"
        string title;
        StandardType standardType;
        string version;
        string ipfsDocumentHash;
        bool isActive;
        uint256 createdAt;
    }

    struct ComplianceChecklist {
        uint256 id;
        uint256 missionId; // Links to MissionRegistry
        uint256 standardId;
        string checklistName;
        uint256 totalItems;
        uint256 completedItems;
        ComplianceLevel overallCompliance;
        address auditor;
        uint256 lastAuditDate;
        string auditReportHash; // IPFS hash of audit report
    }

    struct ChecklistItem {
        string requirement;
        string clause; // Standard clause reference
        bool isMandatory;
        ComplianceLevel compliance;
        string evidence; // IPFS hash of evidence
        string notes;
        address verifiedBy;
        uint256 verifiedAt;
    }

    // Standard ID => Standard
    mapping(uint256 => Standard) public standards;

    // Checklist ID => Checklist
    mapping(uint256 => ComplianceChecklist) public checklists;

    // Checklist ID => array of ChecklistItems
    mapping(uint256 => ChecklistItem[]) public checklistItems;

    // Mission ID => array of Checklist IDs
    mapping(uint256 => uint256[]) public missionChecklists;

    // Standard code => Standard ID (for quick lookup)
    mapping(string => uint256) public standardCodeToId;

    // Events
    event StandardAdded(uint256 indexed standardId, string code, StandardType standardType);
    event ChecklistCreated(uint256 indexed checklistId, uint256 indexed missionId, uint256 standardId);
    event ItemVerified(uint256 indexed checklistId, uint256 itemIndex, ComplianceLevel compliance);
    event AuditCompleted(uint256 indexed checklistId, address auditor, ComplianceLevel overallCompliance);
    event StandardUpdated(uint256 indexed standardId, string newVersion, string newDocumentHash);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @dev Add a new standard to the registry
     */
    function addStandard(
        string memory code,
        string memory title,
        StandardType standardType,
        string memory version,
        string memory ipfsDocumentHash
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        require(bytes(code).length > 0, "Code cannot be empty");
        require(standardCodeToId[code] == 0, "Standard already exists");

        _standardIdCounter++;
        uint256 standardId = _standardIdCounter;

        standards[standardId] = Standard({
            id: standardId,
            code: code,
            title: title,
            standardType: standardType,
            version: version,
            ipfsDocumentHash: ipfsDocumentHash,
            isActive: true,
            createdAt: block.timestamp
        });

        standardCodeToId[code] = standardId;

        emit StandardAdded(standardId, code, standardType);

        return standardId;
    }

    /**
     * @dev Create a compliance checklist for a mission
     */
    function createChecklist(
        uint256 missionId,
        uint256 standardId,
        string memory checklistName
    ) external returns (uint256) {
        require(standards[standardId].id != 0, "Standard does not exist");
        require(standards[standardId].isActive, "Standard is not active");

        _checklistIdCounter++;
        uint256 checklistId = _checklistIdCounter;

        checklists[checklistId] = ComplianceChecklist({
            id: checklistId,
            missionId: missionId,
            standardId: standardId,
            checklistName: checklistName,
            totalItems: 0,
            completedItems: 0,
            overallCompliance: ComplianceLevel.NotAssessed,
            auditor: address(0),
            lastAuditDate: 0,
            auditReportHash: ""
        });

        missionChecklists[missionId].push(checklistId);

        emit ChecklistCreated(checklistId, missionId, standardId);

        return checklistId;
    }

    /**
     * @dev Add item to checklist
     */
    function addChecklistItem(
        uint256 checklistId,
        string memory requirement,
        string memory clause,
        bool isMandatory
    ) external {
        require(checklists[checklistId].id != 0, "Checklist does not exist");

        ChecklistItem memory newItem = ChecklistItem({
            requirement: requirement,
            clause: clause,
            isMandatory: isMandatory,
            compliance: ComplianceLevel.NotAssessed,
            evidence: "",
            notes: "",
            verifiedBy: address(0),
            verifiedAt: 0
        });

        checklistItems[checklistId].push(newItem);
        checklists[checklistId].totalItems++;
    }

    /**
     * @dev Verify a checklist item
     */
    function verifyItem(
        uint256 checklistId,
        uint256 itemIndex,
        ComplianceLevel compliance,
        string memory evidence,
        string memory notes
    ) external onlyRole(VERIFIER_ROLE) {
        require(checklists[checklistId].id != 0, "Checklist does not exist");
        require(itemIndex < checklistItems[checklistId].length, "Invalid item index");

        ChecklistItem storage item = checklistItems[checklistId][itemIndex];

        // Update completion count if this is first verification
        if (item.compliance == ComplianceLevel.NotAssessed && compliance != ComplianceLevel.NotAssessed) {
            checklists[checklistId].completedItems++;
        }

        item.compliance = compliance;
        item.evidence = evidence;
        item.notes = notes;
        item.verifiedBy = msg.sender;
        item.verifiedAt = block.timestamp;

        emit ItemVerified(checklistId, itemIndex, compliance);
    }

    /**
     * @dev Perform audit of checklist
     */
    function performAudit(
        uint256 checklistId,
        ComplianceLevel overallCompliance,
        string memory auditReportHash
    ) external onlyRole(AUDITOR_ROLE) {
        require(checklists[checklistId].id != 0, "Checklist does not exist");

        ComplianceChecklist storage checklist = checklists[checklistId];
        checklist.overallCompliance = overallCompliance;
        checklist.auditor = msg.sender;
        checklist.lastAuditDate = block.timestamp;
        checklist.auditReportHash = auditReportHash;

        emit AuditCompleted(checklistId, msg.sender, overallCompliance);
    }

    /**
     * @dev Update standard version
     */
    function updateStandard(
        uint256 standardId,
        string memory newVersion,
        string memory newDocumentHash
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(standards[standardId].id != 0, "Standard does not exist");

        standards[standardId].version = newVersion;
        standards[standardId].ipfsDocumentHash = newDocumentHash;

        emit StandardUpdated(standardId, newVersion, newDocumentHash);
    }

    /**
     * @dev Calculate compliance percentage for a checklist
     */
    function getCompliancePercentage(uint256 checklistId) external view returns (uint256) {
        ComplianceChecklist memory checklist = checklists[checklistId];
        if (checklist.totalItems == 0) {
            return 0;
        }

        uint256 compliantItems = 0;
        ChecklistItem[] memory items = checklistItems[checklistId];

        for (uint256 i = 0; i < items.length; i++) {
            if (
                items[i].compliance == ComplianceLevel.FullyCompliant || items[i].compliance == ComplianceLevel.Exceeds
            ) {
                compliantItems++;
            }
        }

        return (compliantItems * 100) / checklist.totalItems;
    }

    /**
     * @dev Get checklist items
     */
    function getChecklistItems(uint256 checklistId) external view returns (ChecklistItem[] memory) {
        return checklistItems[checklistId];
    }

    /**
     * @dev Get mission checklists
     */
    function getMissionChecklists(uint256 missionId) external view returns (uint256[] memory) {
        return missionChecklists[missionId];
    }

    /**
     * @dev Check if mission meets mandatory requirements
     */
    function meetsMandatoryRequirements(uint256 checklistId) external view returns (bool) {
        ChecklistItem[] memory items = checklistItems[checklistId];

        for (uint256 i = 0; i < items.length; i++) {
            if (items[i].isMandatory) {
                if (
                    items[i].compliance != ComplianceLevel.FullyCompliant &&
                    items[i].compliance != ComplianceLevel.Exceeds
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * @dev Get standard by code
     */
    function getStandardByCode(string memory code) external view returns (Standard memory) {
        uint256 standardId = standardCodeToId[code];
        require(standardId != 0, "Standard not found");
        return standards[standardId];
    }
}
