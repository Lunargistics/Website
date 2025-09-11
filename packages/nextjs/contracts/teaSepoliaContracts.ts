/**
 * TEA Sepolia Deployed Contracts
 * Chain ID: 10218
 * Last Updated: 2025-09-11T02:44:15.044Z
 */

export const teaSepoliaContracts = {
  10218: {
  "YourContract": {
    "address": "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
    "abi": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "greetingSetter",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "newGreeting",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "premium",
            "type": "bool"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "GreetingChange",
        "type": "event"
      },
      {
        "inputs": [],
        "name": "greeting",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "premium",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "_newGreeting",
            "type": "string"
          }
        ],
        "name": "setGreeting",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalCounter",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "name": "userGreetingCounter",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "stateMutability": "payable",
        "type": "receive"
      }
    ]
  },
  "SpaceActivityManager": {
    "address": "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
    "abi": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "activityId",
            "type": "bytes32"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "enum SpaceActivityManager.ActivityType",
            "name": "activityType",
            "type": "uint8"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "name": "ActivityLogged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "activityId",
            "type": "bytes32"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "updater",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "enum SpaceActivityManager.ActivityStatus",
            "name": "newStatus",
            "type": "uint8"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "updatedAt",
            "type": "uint256"
          }
        ],
        "name": "ActivityUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "activityId",
            "type": "bytes32"
          },
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "documentId",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "documentName",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "enum SpaceActivityManager.DocComplianceStatus",
            "name": "status",
            "type": "uint8"
          }
        ],
        "name": "ComplianceDocumentAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "activityId",
            "type": "bytes32"
          },
          {
            "indexed": true,
            "internalType": "bytes32",
            "name": "documentId",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "internalType": "enum SpaceActivityManager.DocComplianceStatus",
            "name": "newStatus",
            "type": "uint8"
          }
        ],
        "name": "ComplianceDocumentUpdated",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_activityId",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "_documentName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_documentType",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_documentHashOrLink",
            "type": "string"
          },
          {
            "internalType": "enum SpaceActivityManager.DocComplianceStatus",
            "name": "_status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "_submittedDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_expiryDate",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "_notes",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_responsibleEntity",
            "type": "string"
          }
        ],
        "name": "addComplianceDocumentToActivity",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "documentId",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "getActivitiesByOwner",
        "outputs": [
          {
            "internalType": "bytes32[]",
            "name": "",
            "type": "bytes32[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_activityId",
            "type": "bytes32"
          }
        ],
        "name": "getActivityById",
        "outputs": [
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "id",
                "type": "bytes32"
              },
              {
                "internalType": "address",
                "name": "owner",
                "type": "address"
              },
              {
                "internalType": "enum SpaceActivityManager.ActivityType",
                "name": "activityType",
                "type": "uint8"
              },
              {
                "internalType": "string",
                "name": "name",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "description",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "organization",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "projectManager",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "startDate",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "endDate",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "launchDateTime",
                "type": "uint256"
              },
              {
                "internalType": "enum SpaceActivityManager.ActivityStatus",
                "name": "status",
                "type": "uint8"
              },
              {
                "internalType": "string",
                "name": "externalApiLaunchId",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "externalApiSource",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "launchSite",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "destination",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "payloadDetails",
                "type": "string"
              },
              {
                "components": [
                  {
                    "internalType": "bytes32",
                    "name": "id",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "string",
                    "name": "documentName",
                    "type": "string"
                  },
                  {
                    "internalType": "string",
                    "name": "documentType",
                    "type": "string"
                  },
                  {
                    "internalType": "string",
                    "name": "documentHashOrLink",
                    "type": "string"
                  },
                  {
                    "internalType": "enum SpaceActivityManager.DocComplianceStatus",
                    "name": "status",
                    "type": "uint8"
                  },
                  {
                    "internalType": "uint256",
                    "name": "submittedDate",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "reviewDate",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "expiryDate",
                    "type": "uint256"
                  },
                  {
                    "internalType": "string",
                    "name": "notes",
                    "type": "string"
                  },
                  {
                    "internalType": "string",
                    "name": "responsibleEntity",
                    "type": "string"
                  }
                ],
                "internalType": "struct SpaceActivityManager.ComplianceDocument[]",
                "name": "complianceDocuments",
                "type": "tuple[]"
              },
              {
                "internalType": "uint256",
                "name": "createdAt",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "updatedAt",
                "type": "uint256"
              }
            ],
            "internalType": "struct SpaceActivityManager.Activity",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getAllActivityIds",
        "outputs": [
          {
            "internalType": "bytes32[]",
            "name": "",
            "type": "bytes32[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_activityId",
            "type": "bytes32"
          }
        ],
        "name": "getComplianceDocuments",
        "outputs": [
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "id",
                "type": "bytes32"
              },
              {
                "internalType": "string",
                "name": "documentName",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "documentType",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "documentHashOrLink",
                "type": "string"
              },
              {
                "internalType": "enum SpaceActivityManager.DocComplianceStatus",
                "name": "status",
                "type": "uint8"
              },
              {
                "internalType": "uint256",
                "name": "submittedDate",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "reviewDate",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "expiryDate",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "notes",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "responsibleEntity",
                "type": "string"
              }
            ],
            "internalType": "struct SpaceActivityManager.ComplianceDocument[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "enum SpaceActivityManager.ActivityType",
            "name": "_activityType",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "_name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_organization",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_projectManager",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "_startDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_endDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_launchDateTime",
            "type": "uint256"
          },
          {
            "internalType": "enum SpaceActivityManager.ActivityStatus",
            "name": "_status",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "_externalApiLaunchId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_externalApiSource",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_launchSite",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_destination",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_payloadDetails",
            "type": "string"
          }
        ],
        "name": "logActivity",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "activityId",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_activityId",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "_name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_organization",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_projectManager",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "_startDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_endDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_launchDateTime",
            "type": "uint256"
          },
          {
            "internalType": "enum SpaceActivityManager.ActivityStatus",
            "name": "_status",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "_externalApiLaunchId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_externalApiSource",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_launchSite",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_destination",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_payloadDetails",
            "type": "string"
          }
        ],
        "name": "updateActivityDetails",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_activityId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "_documentId",
            "type": "bytes32"
          },
          {
            "internalType": "enum SpaceActivityManager.DocComplianceStatus",
            "name": "_newStatus",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "_reviewDate",
            "type": "uint256"
          }
        ],
        "name": "updateComplianceDocumentStatusInActivity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  },
  "MissionRegistry": {
    "address": "0x4A679253410272dd5232B3Ff7cF5dbB88f295319",
    "abi": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "missionId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "documentHash",
            "type": "uint256"
          }
        ],
        "name": "DocumentLinked",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "missionId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "equipmentTokenId",
            "type": "uint256"
          }
        ],
        "name": "EquipmentLinked",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "missionId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "enum MissionRegistry.MissionType",
            "name": "missionType",
            "type": "uint8"
          }
        ],
        "name": "MissionCreated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "missionId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "newIpfsHash",
            "type": "string"
          }
        ],
        "name": "MissionMetadataUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "missionId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "enum MissionRegistry.MissionPhase",
            "name": "newPhase",
            "type": "uint8"
          },
          {
            "indexed": false,
            "internalType": "uint8",
            "name": "completionPercentage",
            "type": "uint8"
          }
        ],
        "name": "MissionPhaseUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "missionId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "newOrbitDataHash",
            "type": "string"
          }
        ],
        "name": "OrbitDataUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "missionId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "requirement",
            "type": "string"
          }
        ],
        "name": "RequirementAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "missionId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "requirementIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "verifier",
            "type": "address"
          }
        ],
        "name": "RequirementVerified",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_missionId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "_requirement",
            "type": "string"
          }
        ],
        "name": "addRequirement",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "_name",
            "type": "string"
          },
          {
            "internalType": "enum MissionRegistry.MissionType",
            "name": "_missionType",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "_ipfsMetadataHash",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "_launchDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_endDate",
            "type": "uint256"
          }
        ],
        "name": "createMission",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_missionId",
            "type": "uint256"
          }
        ],
        "name": "getMission",
        "outputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "name",
                "type": "string"
              },
              {
                "internalType": "address",
                "name": "owner",
                "type": "address"
              },
              {
                "internalType": "enum MissionRegistry.MissionType",
                "name": "missionType",
                "type": "uint8"
              },
              {
                "internalType": "enum MissionRegistry.MissionPhase",
                "name": "currentPhase",
                "type": "uint8"
              },
              {
                "internalType": "string",
                "name": "ipfsMetadataHash",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "orbitDataHash",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "launchDate",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "endDate",
                "type": "uint256"
              },
              {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
              },
              {
                "internalType": "uint256[]",
                "name": "equipmentTokenIds",
                "type": "uint256[]"
              },
              {
                "internalType": "uint256[]",
                "name": "documentHashes",
                "type": "uint256[]"
              },
              {
                "internalType": "uint256",
                "name": "createdAt",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "updatedAt",
                "type": "uint256"
              }
            ],
            "internalType": "struct MissionRegistry.Mission",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_missionId",
            "type": "uint256"
          }
        ],
        "name": "getMissionRequirements",
        "outputs": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "requirement",
                "type": "string"
              },
              {
                "internalType": "bool",
                "name": "verified",
                "type": "bool"
              },
              {
                "internalType": "address",
                "name": "verifier",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "verifiedAt",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "evidenceHash",
                "type": "string"
              }
            ],
            "internalType": "struct MissionRegistry.MissionRequirement[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "getMissionsByOwner",
        "outputs": [
          {
            "internalType": "uint256[]",
            "name": "",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getTotalMissions",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_missionId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_documentHash",
            "type": "uint256"
          }
        ],
        "name": "linkDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_missionId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_equipmentTokenId",
            "type": "uint256"
          }
        ],
        "name": "linkEquipment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "missionRequirements",
        "outputs": [
          {
            "internalType": "string",
            "name": "requirement",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "verified",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "verifier",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "verifiedAt",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "evidenceHash",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "missions",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "enum MissionRegistry.MissionType",
            "name": "missionType",
            "type": "uint8"
          },
          {
            "internalType": "enum MissionRegistry.MissionPhase",
            "name": "currentPhase",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "ipfsMetadataHash",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "orbitDataHash",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "launchDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endDate",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "updatedAt",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "ownerMissions",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "enum MissionRegistry.MissionPhase",
            "name": "",
            "type": "uint8"
          }
        ],
        "name": "phaseCompletion",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_missionId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "_newIpfsHash",
            "type": "string"
          }
        ],
        "name": "updateMissionMetadata",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_missionId",
            "type": "uint256"
          },
          {
            "internalType": "enum MissionRegistry.MissionPhase",
            "name": "_newPhase",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "_completionPercentage",
            "type": "uint8"
          }
        ],
        "name": "updateMissionPhase",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_missionId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "_orbitDataHash",
            "type": "string"
          }
        ],
        "name": "updateOrbitData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_missionId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_requirementIndex",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "_evidenceHash",
            "type": "string"
          }
        ],
        "name": "verifyRequirement",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  },
  "SpaceEquipmentNFT": {
    "address": "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F",
    "abi": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "ERC721IncorrectOwner",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "ERC721InsufficientApproval",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "approver",
            "type": "address"
          }
        ],
        "name": "ERC721InvalidApprover",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          }
        ],
        "name": "ERC721InvalidOperator",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "ERC721InvalidOwner",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "receiver",
            "type": "address"
          }
        ],
        "name": "ERC721InvalidReceiver",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          }
        ],
        "name": "ERC721InvalidSender",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "ERC721NonexistentToken",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "approved",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
          }
        ],
        "name": "ApprovalForAll",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "_fromTokenId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "_toTokenId",
            "type": "uint256"
          }
        ],
        "name": "BatchMetadataUpdate",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "id1",
            "type": "uint256"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "id2",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "isCompatible",
            "type": "bool"
          }
        ],
        "name": "CompatibilityDefined",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "enum SpaceEquipmentNFT.EquipmentCategory",
            "name": "category",
            "type": "uint8"
          }
        ],
        "name": "EquipmentMinted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newHeritage",
            "type": "uint256"
          }
        ],
        "name": "HeritageUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "_tokenId",
            "type": "uint256"
          }
        ],
        "name": "MetadataUpdate",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "ipfsDataHash",
            "type": "string"
          }
        ],
        "name": "SpecsUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "enum SpaceEquipmentNFT.ComplianceStandard",
            "name": "standard",
            "type": "uint8"
          }
        ],
        "name": "addComplianceStandard",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "interfaceName",
            "type": "string"
          }
        ],
        "name": "addInterface",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256[]",
            "name": "equipmentIds",
            "type": "uint256[]"
          }
        ],
        "name": "calculateTotalCost",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256[]",
            "name": "equipmentIds",
            "type": "uint256[]"
          }
        ],
        "name": "calculateTotalMass",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256[]",
            "name": "equipmentIds",
            "type": "uint256[]"
          }
        ],
        "name": "calculateTotalPower",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "id1",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "id2",
            "type": "uint256"
          }
        ],
        "name": "checkCompatibility",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "name": "compatibilityMatrix",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "equipmentId1",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "equipmentId2",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isCompatible",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "reason",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "id1",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "id2",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isCompatible",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "reason",
            "type": "string"
          }
        ],
        "name": "defineCompatibility",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "enum SpaceEquipmentNFT.EquipmentCategory",
            "name": "",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "equipmentByCategory",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "equipmentSpecs",
        "outputs": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "manufacturer",
            "type": "string"
          },
          {
            "internalType": "enum SpaceEquipmentNFT.EquipmentCategory",
            "name": "category",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "mass",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "power",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "dataRate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "volume",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "cost",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "trl",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "heritage",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "spaceQualified",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "ipfsDataHash",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "getApproved",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "enum SpaceEquipmentNFT.EquipmentCategory",
            "name": "category",
            "type": "uint8"
          }
        ],
        "name": "getEquipmentByCategory",
        "outputs": [
          {
            "internalType": "uint256[]",
            "name": "",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "getEquipmentSpecs",
        "outputs": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "name",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "manufacturer",
                "type": "string"
              },
              {
                "internalType": "enum SpaceEquipmentNFT.EquipmentCategory",
                "name": "category",
                "type": "uint8"
              },
              {
                "internalType": "uint256",
                "name": "mass",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "power",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "dataRate",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "volume",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "cost",
                "type": "uint256"
              },
              {
                "internalType": "enum SpaceEquipmentNFT.ComplianceStandard[]",
                "name": "standards",
                "type": "uint8[]"
              },
              {
                "internalType": "string[]",
                "name": "interfaces",
                "type": "string[]"
              },
              {
                "internalType": "uint256",
                "name": "trl",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "heritage",
                "type": "uint256"
              },
              {
                "internalType": "bool",
                "name": "spaceQualified",
                "type": "bool"
              },
              {
                "internalType": "string",
                "name": "ipfsDataHash",
                "type": "string"
              }
            ],
            "internalType": "struct SpaceEquipmentNFT.EquipmentSpec",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          }
        ],
        "name": "isApprovedForAll",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "manufacturer",
            "type": "string"
          },
          {
            "internalType": "enum SpaceEquipmentNFT.EquipmentCategory",
            "name": "category",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "tokenURI",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "ipfsDataHash",
            "type": "string"
          }
        ],
        "name": "mintEquipment",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "ownerOf",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
          }
        ],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes4",
            "name": "interfaceId",
            "type": "bytes4"
          }
        ],
        "name": "supportsInterface",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "tokenURI",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "newHeritage",
            "type": "uint256"
          }
        ],
        "name": "updateHeritage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "newIpfsHash",
            "type": "string"
          }
        ],
        "name": "updateIPFSData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "mass",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "power",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "dataRate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "volume",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "cost",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "trl",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "spaceQualified",
            "type": "bool"
          }
        ],
        "name": "updateSpecs",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  },
  "SpaceDocumentNFT": {
    "address": "0x09635F643e140090A9A8Dcd712eD6285858ceBef",
    "abi": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "balance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "needed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "ERC1155InsufficientBalance",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "approver",
            "type": "address"
          }
        ],
        "name": "ERC1155InvalidApprover",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "idsLength",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "valuesLength",
            "type": "uint256"
          }
        ],
        "name": "ERC1155InvalidArrayLength",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          }
        ],
        "name": "ERC1155InvalidOperator",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "receiver",
            "type": "address"
          }
        ],
        "name": "ERC1155InvalidReceiver",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          }
        ],
        "name": "ERC1155InvalidSender",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "ERC1155MissingApprovalForAll",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
          }
        ],
        "name": "ApprovalForAll",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "metadataURI",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "documentType",
            "type": "string"
          }
        ],
        "name": "DocumentCreated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "DocumentMinted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "authorized",
            "type": "bool"
          }
        ],
        "name": "MinterAuthorized",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256[]",
            "name": "ids",
            "type": "uint256[]"
          },
          {
            "indexed": false,
            "internalType": "uint256[]",
            "name": "values",
            "type": "uint256[]"
          }
        ],
        "name": "TransferBatch",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "TransferSingle",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "string",
            "name": "value",
            "type": "string"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "URI",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "minter",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "authorized",
            "type": "bool"
          }
        ],
        "name": "authorizeMinter",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "name": "authorizedMinters",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address[]",
            "name": "accounts",
            "type": "address[]"
          },
          {
            "internalType": "uint256[]",
            "name": "ids",
            "type": "uint256[]"
          }
        ],
        "name": "balanceOfBatch",
        "outputs": [
          {
            "internalType": "uint256[]",
            "name": "",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "metadataURI",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "documentType",
            "type": "string"
          }
        ],
        "name": "createDocument",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "deactivateDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "documents",
        "outputs": [
          {
            "internalType": "string",
            "name": "metadataURI",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "admin",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "documentType",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "exists",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "getDocument",
        "outputs": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "metadataURI",
                "type": "string"
              },
              {
                "internalType": "address",
                "name": "admin",
                "type": "address"
              },
              {
                "internalType": "string",
                "name": "documentType",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
              },
              {
                "internalType": "bool",
                "name": "active",
                "type": "bool"
              }
            ],
            "internalType": "struct SpaceDocumentNFT.Document",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          }
        ],
        "name": "getUserDocuments",
        "outputs": [
          {
            "internalType": "uint256[]",
            "name": "",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          }
        ],
        "name": "isApprovedForAll",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "recipients",
            "type": "address[]"
          },
          {
            "internalType": "uint256[]",
            "name": "amounts",
            "type": "uint256[]"
          }
        ],
        "name": "mintBatch",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "mintDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256[]",
            "name": "ids",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "values",
            "type": "uint256[]"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "safeBatchTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
          }
        ],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes4",
            "name": "interfaceId",
            "type": "bytes4"
          }
        ],
        "name": "supportsInterface",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "uri",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "userDocuments",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ]
  },
  "AsteroidCommodityToken": {
    "address": "0xc5a5C42992dECbae36851359345FE25997F5C42d",
    "abi": [
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "_name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_symbol",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_asteroidId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_commodity",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "_initialSupply",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "allowance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "needed",
            "type": "uint256"
          }
        ],
        "name": "ERC20InsufficientAllowance",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "balance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "needed",
            "type": "uint256"
          }
        ],
        "name": "ERC20InsufficientBalance",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "approver",
            "type": "address"
          }
        ],
        "name": "ERC20InvalidApprover",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "receiver",
            "type": "address"
          }
        ],
        "name": "ERC20InvalidReceiver",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          }
        ],
        "name": "ERC20InvalidSender",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "ERC20InvalidSpender",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "asteroidId",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "commodity",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "estimatedValue",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  }
}
} as const;
