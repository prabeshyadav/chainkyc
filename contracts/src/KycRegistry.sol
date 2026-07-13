// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";

/// @title KYCRegistry
/// @notice Anchors versioned, off-chain-verified KYC records (IPFS CID + data hash) on-chain.
/// @dev Permissions are delegated to an external RoleManager contract. Only addresses marked
///      as VERIFIER in RoleManager may anchor new KYC records.
contract KYCRegistry {

    struct KYCRecord {
        uint256 version;
        string ipfsCid;
        bytes32 dataHash;
        uint256 verifiedAt;
        address verifiedBy;
    }

    RoleManager public roleManager;

    // user => list of verified KYC versions
    mapping(address => KYCRecord[]) private kycHistory;

    event KYCVerified(
        address indexed user,
        uint256 indexed version,
        string ipfsCid,
        bytes32 dataHash,
        address indexed verifiedBy,
        uint256 verifiedAt
    );

    constructor(address roleManagerAddress) {
        require(roleManagerAddress != address(0), "Zero address");
        roleManager = RoleManager(roleManagerAddress);
    }

    modifier onlyVerifier() {
        require(
            roleManager.isVerifier(msg.sender),
            "Not an authorized verifier"
        );
        _;
    }

    // -------------------------------------------------------------------
    // Store a newly verified KYC
    // -------------------------------------------------------------------

    function anchorKYC(
        address user,
        string calldata ipfsCid,
        bytes32 dataHash
    )
        external
        onlyVerifier
    {
        require(user != address(0), "Zero address user");
        require(bytes(ipfsCid).length > 0, "Empty IPFS CID");
        require(dataHash != bytes32(0), "Empty data hash");

        uint256 version = kycHistory[user].length + 1;

        kycHistory[user].push(
            KYCRecord({
                version: version,
                ipfsCid: ipfsCid,
                dataHash: dataHash,
                verifiedAt: block.timestamp,
                verifiedBy: msg.sender
            })
        );

        emit KYCVerified(
            user,
            version,
            ipfsCid,
            dataHash,
            msg.sender,
            block.timestamp
        );
    }

    // -------------------------------------------------------------------
    // Returns latest verified KYC
    // -------------------------------------------------------------------

    function getLatestKYC(address user)
        external
        view
        returns (
            uint256 version,
            string memory ipfsCid,
            bytes32 dataHash,
            uint256 verifiedAt,
            address verifiedBy
        )
    {
        require(
            kycHistory[user].length > 0,
            "No verified KYC"
        );

        KYCRecord memory record =
            kycHistory[user][kycHistory[user].length - 1];

        return (
            record.version,
            record.ipfsCid,
            record.dataHash,
            record.verifiedAt,
            record.verifiedBy
        );
    }

    // -------------------------------------------------------------------
    // Returns a specific version
    // -------------------------------------------------------------------

    function getKYCVersion(
        address user,
        uint256 version
    )
        external
        view
        returns (
            string memory ipfsCid,
            bytes32 dataHash,
            uint256 verifiedAt,
            address verifiedBy
        )
    {
        require(
            version > 0 &&
            version <= kycHistory[user].length,
            "Invalid version"
        );

        KYCRecord memory record =
            kycHistory[user][version - 1];

        return (
            record.ipfsCid,
            record.dataHash,
            record.verifiedAt,
            record.verifiedBy
        );
    }

    // -------------------------------------------------------------------
    // Total verified versions
    // -------------------------------------------------------------------

    function getVersionCount(address user)
        external
        view
        returns (uint256)
    {
        return kycHistory[user].length;
    }

    // -------------------------------------------------------------------
    // Does this user have verified KYC?
    // -------------------------------------------------------------------

    function hasVerifiedKYC(address user)
        external
        view
        returns (bool)
    {
        return kycHistory[user].length > 0;
    }
}