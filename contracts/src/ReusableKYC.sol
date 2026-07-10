// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReusableKYC {
    address public admin;

    enum Role {
        USER,
        ADMIN,
        VERIFIER,
        BANK
    }

    mapping(address => bool) public verifiers;
    mapping(address => bool) public banks;

    struct KYCRecord {
        string ipfsCid;
        bytes32 dataHash;
        uint256 timestamp;
        bool exists;
    }

    // User => KYC Record
    mapping(address => KYCRecord) private kycRecords;

    // User => Bank => Permission
    mapping(address => mapping(address => bool)) private permissions;

    event VerifierStatusChanged(address indexed verifier, bool status);
    event BankStatusChanged(address indexed bank, bool status);
    event KYCAnchored(
        address indexed user,
        string ipfsCid,
        bytes32 dataHash
    );
    event AccessGranted(address indexed user, address indexed bank);
    event AccessRevoked(address indexed user, address indexed bank);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not the admin");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Caller is not an authorized verifier");
        _;
    }

    constructor() {
        admin = msg.sender;
        verifiers[msg.sender] = true;
    }

    // ------------------------
    // Admin Functions
    // ------------------------

    function setVerifier(address verifier, bool status)
        external
        onlyAdmin
    {
        verifiers[verifier] = status;

        emit VerifierStatusChanged(verifier, status);
    }

    function setBank(address bank, bool status)
        external
        onlyAdmin
    {
        banks[bank] = status;

        emit BankStatusChanged(bank, status);
    }

    // ------------------------
    // Read Role
    // ------------------------

    function getRole(address user)
        external
        view
        returns (Role)
    {
        if (user == admin) {
            return Role.ADMIN;
        }

        if (verifiers[user]) {
            return Role.VERIFIER;
        }

        if (banks[user]) {
            return Role.BANK;
        }

        return Role.USER;
    }

    // ------------------------
    // Verifier
    // ------------------------

    function anchorKYC(
        address user,
        string calldata ipfsCid,
        bytes32 dataHash
    )
        external
        onlyVerifier
    {
        kycRecords[user] = KYCRecord({
            ipfsCid: ipfsCid,
            dataHash: dataHash,
            timestamp: block.timestamp,
            exists: true
        });

        emit KYCAnchored(
            user,
            ipfsCid,
            dataHash
        );
    }

    // ------------------------
    // User Permission
    // ------------------------

    function grantAccess(address bank)
        external
    {
        require(
            banks[bank],
            "Target address is not a registered bank"
        );

        permissions[msg.sender][bank] = true;

        emit AccessGranted(msg.sender, bank);
    }

    function revokeAccess(address bank)
        external
    {
        permissions[msg.sender][bank] = false;

        emit AccessRevoked(msg.sender, bank);
    }

    // ------------------------
    // Bank Query
    // ------------------------

    function verifyUserKYC(address user)
        external
        view
        returns (
            bool verified,
            string memory ipfsCid,
            bytes32 dataHash
        )
    {
        require(
            banks[msg.sender],
            "Only registered banks can query KYC status"
        );

        require(
            permissions[user][msg.sender],
            "User has not granted access"
        );

        KYCRecord memory record = kycRecords[user];

        require(
            record.exists,
            "No KYC record found"
        );

        return (
            true,
            record.ipfsCid,
            record.dataHash
        );
    }

    // ------------------------
    // Read KYC (Verifier/Admin)
    // ------------------------

    function getKYC(address user)
        external
        view
        returns (
            string memory ipfsCid,
            bytes32 dataHash,
            uint256 timestamp,
            bool exists
        )
    {
        require(
            msg.sender == admin || verifiers[msg.sender],
            "Unauthorized"
        );

        KYCRecord memory record = kycRecords[user];

        return (
            record.ipfsCid,
            record.dataHash,
            record.timestamp,
            record.exists
        );
    }
}