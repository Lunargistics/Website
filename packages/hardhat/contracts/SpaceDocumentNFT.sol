// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract SpaceDocumentNFT is ERC1155, ERC1155Supply, Ownable {
    uint256 private _currentTokenId;

    struct Document {
        string metadataURI;
        address admin;
        string documentType;
        uint256 timestamp;
        bool active;
    }

    mapping(uint256 => Document) public documents;
    mapping(address => uint256[]) public userDocuments;
    mapping(uint256 => mapping(address => bool)) public authorizedMinters;

    event DocumentCreated(
        uint256 indexed tokenId,
        address indexed admin,
        string metadataURI,
        string documentType
    );

    event MinterAuthorized(
        uint256 indexed tokenId,
        address indexed minter,
        bool authorized
    );

    event DocumentMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 amount
    );

    constructor() ERC1155("") Ownable(msg.sender) {}

    function createDocument(
        string memory metadataURI,
        string memory documentType
    ) external returns (uint256) {
        _currentTokenId++;
        uint256 newTokenId = _currentTokenId;

        documents[newTokenId] = Document({
            metadataURI: metadataURI,
            admin: msg.sender,
            documentType: documentType,
            timestamp: block.timestamp,
            active: true
        });

        userDocuments[msg.sender].push(newTokenId);

        emit DocumentCreated(newTokenId, msg.sender, metadataURI, documentType);

        return newTokenId;
    }

    function authorizeMinter(uint256 tokenId, address minter, bool authorized) external {
        require(documents[tokenId].admin == msg.sender, "Only document admin can authorize");
        authorizedMinters[tokenId][minter] = authorized;
        
        emit MinterAuthorized(tokenId, minter, authorized);
    }

    function mintDocument(
        uint256 tokenId,
        address to,
        uint256 amount
    ) external {
        Document memory doc = documents[tokenId];
        require(doc.active, "Document not active");
        require(
            msg.sender == doc.admin || authorizedMinters[tokenId][msg.sender],
            "Not authorized to mint"
        );

        _mint(to, tokenId, amount, "");
        
        emit DocumentMinted(tokenId, to, amount);
    }

    function mintBatch(
        uint256 tokenId,
        address[] memory recipients,
        uint256[] memory amounts
    ) external {
        Document memory doc = documents[tokenId];
        require(doc.active, "Document not active");
        require(
            msg.sender == doc.admin || authorizedMinters[tokenId][msg.sender],
            "Not authorized to mint"
        );
        require(recipients.length == amounts.length, "Arrays length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], tokenId, amounts[i], "");
            emit DocumentMinted(tokenId, recipients[i], amounts[i]);
        }
    }

    function deactivateDocument(uint256 tokenId) external {
        require(documents[tokenId].admin == msg.sender, "Only document admin");
        documents[tokenId].active = false;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return documents[tokenId].metadataURI;
    }

    function getUserDocuments(address user) external view returns (uint256[] memory) {
        return userDocuments[user];
    }

    function getDocument(uint256 tokenId) external view returns (Document memory) {
        return documents[tokenId];
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}