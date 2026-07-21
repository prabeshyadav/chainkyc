// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";

/// @title KYCRegistry
/// @notice Stores verified KYC proofs (IPFS CID + data hash) on-chain.
/// @dev RoleManager controls system roles:
///      - Verifiers can anchor KYC
///      - Banks can receive access from users
///
///      Users control which banks can read their KYC records.
contract KYCRegistry {

    struct KYCRecord {

        uint256 version;

        string ipfsCid;

        bytes32 dataHash;

        uint256 verifiedAt;

        address verifiedBy;
    }


    RoleManager public roleManager;


    // user => list of KYC versions
    mapping(address => KYCRecord[]) private kycHistory;


    // user => bank => permission
    mapping(address => mapping(address => bool))
        private accessPermissions;



    // -------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------

    event KYCVerified(
        address indexed user,
        uint256 indexed version,
        string ipfsCid,
        bytes32 dataHash,
        address indexed verifiedBy,
        uint256 verifiedAt
    );


    event AccessGranted(
        address indexed user,
        address indexed bank
    );


    event AccessRevoked(
        address indexed user,
        address indexed bank
    );



    // -------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------

    constructor(address roleManagerAddress) {

        require(
            roleManagerAddress != address(0),
            "Zero address"
        );

        roleManager = RoleManager(
            roleManagerAddress
        );
    }



    // -------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------

    modifier onlyVerifier() {

        require(
            roleManager.isVerifier(msg.sender),
            "Not an authorized verifier"
        );

        _;
    }



    modifier onlyUserOrAuthorizedBank(
        address user
    ) {

        require(
            msg.sender == user ||
            accessPermissions[user][msg.sender],
            "No access permission"
        );

        _;
    }




    // -------------------------------------------------------------------
    // Anchor KYC
    // -------------------------------------------------------------------

    function anchorKYC(
        address user,
        string calldata ipfsCid,
        bytes32 dataHash
    )
        external
        onlyVerifier
    {

        require(
            user != address(0),
            "Zero address user"
        );


        require(
            bytes(ipfsCid).length > 0,
            "Empty IPFS CID"
        );


        require(
            dataHash != bytes32(0),
            "Empty data hash"
        );


        uint256 version =
            kycHistory[user].length + 1;



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
    // User grants bank access
    // -------------------------------------------------------------------

    function grantAccess(
        address bank
    )
        external
    {

        require(
            bank != address(0),
            "Zero address bank"
        );


        require(
            roleManager.isBank(bank),
            "Not an authorized bank"
        );


        accessPermissions[msg.sender][bank] = true;



        emit AccessGranted(
            msg.sender,
            bank
        );
    }




    // -------------------------------------------------------------------
    // User revokes bank access
    // -------------------------------------------------------------------

    function revokeAccess(
        address bank
    )
        external
    {

        accessPermissions[msg.sender][bank] = false;



        emit AccessRevoked(
            msg.sender,
            bank
        );
    }




    // -------------------------------------------------------------------
    // Check bank permission
    // -------------------------------------------------------------------

    function hasAccess(
        address user,
        address bank
    )
        external
        view
        returns(bool)
    {

        return accessPermissions[user][bank];
    }





    // -------------------------------------------------------------------
    // Latest KYC
    // -------------------------------------------------------------------

    function getLatestKYC(
        address user
    )
        external
        view
        onlyUserOrAuthorizedBank(user)
        returns(
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
            kycHistory[user][
                kycHistory[user].length - 1
            ];



        return(
            record.version,
            record.ipfsCid,
            record.dataHash,
            record.verifiedAt,
            record.verifiedBy
        );
    }




    // -------------------------------------------------------------------
    // Specific KYC version
    // -------------------------------------------------------------------

    function getKYCVersion(
        address user,
        uint256 version
    )
        external
        view
        onlyUserOrAuthorizedBank(user)
        returns(
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



        return(
            record.ipfsCid,
            record.dataHash,
            record.verifiedAt,
            record.verifiedBy
        );
    }





    // -------------------------------------------------------------------
    // Version count
    // -------------------------------------------------------------------

    function getVersionCount(
        address user
    )
        external
        view
        returns(uint256)
    {

        return kycHistory[user].length;
    }




    // -------------------------------------------------------------------
    // Check verified KYC existence
    // -------------------------------------------------------------------

    function hasVerifiedKYC(
        address user
    )
        external
        view
        returns(bool)
    {

        return kycHistory[user].length > 0;
    }
}