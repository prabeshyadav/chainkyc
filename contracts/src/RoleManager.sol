// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RoleManager {

    enum Role {
        USER,
        ADMIN,
        VERIFIER,
        BANK
    }

    address public admin;

    mapping(address => bool) private verifiers;
    mapping(address => bool) private banks;

    event VerifierUpdated(
        address indexed verifier,
        bool status
    );

    event BankUpdated(
        address indexed bank,
        bool status
    );

    event AdminTransferred(
        address indexed previousAdmin,
        address indexed newAdmin
    );

    modifier onlyAdmin() {
        require(
            isAdmin(msg.sender),
            "Only admin can perform this action"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // -------------------------------------------------------------------
    // Admin management
    // -------------------------------------------------------------------

    function transferAdmin(address newAdmin)
        external
        onlyAdmin
    {
        require(newAdmin != address(0), "Zero address");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    // -------------------------------------------------------------------
    // Role management
    // -------------------------------------------------------------------

    function setVerifier(
        address verifier,
        bool status
    )
        external
        onlyAdmin
    {
        require(verifier != address(0), "Zero address");

        verifiers[verifier] = status;

        emit VerifierUpdated(
            verifier,
            status
        );
    }

    function setBank(
        address bank,
        bool status
    )
        external
        onlyAdmin
    {
        require(bank != address(0), "Zero address");

        banks[bank] = status;

        emit BankUpdated(
            bank,
            status
        );
    }

    // -------------------------------------------------------------------
    // Role checks
    // -------------------------------------------------------------------

    function isVerifier(address user)
        public
        view
        returns (bool)
    {
        return verifiers[user];
    }

    function isBank(address user)
        public
        view
        returns (bool)
    {
        return banks[user];
    }

    function getRole(address user)
        public
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

    function isAdmin(address user)
        public
        view
        returns (bool)
    {
        return user == admin;
    }
}