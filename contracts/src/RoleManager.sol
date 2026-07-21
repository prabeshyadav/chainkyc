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


    address[] private verifierList;
    address[] private bankList;



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
            msg.sender == admin,
            "Only admin"
        );

        _;
    }



    constructor() {

        admin = msg.sender;

    }




    // ==================================================
    // ADMIN MANAGEMENT
    // ==================================================

    function transferAdmin(
        address newAdmin
    )
        external
        onlyAdmin
    {

        require(
            newAdmin != address(0),
            "Zero address"
        );


        emit AdminTransferred(
            admin,
            newAdmin
        );


        admin = newAdmin;
    }





    // ==================================================
    // VERIFIER MANAGEMENT
    // ==================================================

    function setVerifier(
        address verifier,
        bool status
    )
        external
        onlyAdmin
    {

        require(
            verifier != address(0),
            "Zero address"
        );


        require(
            !banks[verifier],
            "Wallet already bank"
        );


        if(status) {

            if(!verifiers[verifier]) {

                verifierList.push(verifier);

            }

        }

        else {

            if(verifiers[verifier]) {

                removeVerifierFromList(verifier);

            }

        }


        verifiers[verifier] = status;


        emit VerifierUpdated(
            verifier,
            status
        );

    }





    function removeVerifierFromList(
        address verifier
    )
        internal
    {

        uint256 length = verifierList.length;


        for(uint256 i = 0; i < length; i++) {

            if(verifierList[i] == verifier) {


                verifierList[i] =
                    verifierList[length - 1];


                verifierList.pop();


                break;
            }
        }

    }





    // ==================================================
    // BANK MANAGEMENT
    // ==================================================

    function setBank(
        address bank,
        bool status
    )
        external
        onlyAdmin
    {

        require(
            bank != address(0),
            "Zero address"
        );


        require(
            !verifiers[bank],
            "Wallet already verifier"
        );



        if(status) {

            if(!banks[bank]) {

                bankList.push(bank);

            }

        }

        else {

            if(banks[bank]) {

                removeBankFromList(bank);

            }

        }



        banks[bank] = status;


        emit BankUpdated(
            bank,
            status
        );

    }





    function removeBankFromList(
        address bank
    )
        internal
    {

        uint256 length = bankList.length;


        for(uint256 i = 0; i < length; i++) {


            if(bankList[i] == bank) {


                bankList[i] =
                    bankList[length - 1];


                bankList.pop();


                break;

            }

        }

    }





    // ==================================================
    // ROLE CHECKS
    // ==================================================

    function isAdmin(
        address user
    )
        public
        view
        returns(bool)
    {

        return user == admin;

    }





    function isVerifier(
        address user
    )
        public
        view
        returns(bool)
    {

        return verifiers[user];

    }





    function isBank(
        address user
    )
        public
        view
        returns(bool)
    {

        return banks[user];

    }





    function getRole(
        address user
    )
        public
        view
        returns(Role)
    {

        if(user == admin) {

            return Role.ADMIN;

        }


        if(verifiers[user]) {

            return Role.VERIFIER;

        }


        if(banks[user]) {

            return Role.BANK;

        }


        return Role.USER;

    }





    // ==================================================
    // LIST FUNCTIONS
    // ==================================================


    function getVerifierCount()
        external
        view
        returns(uint256)
    {

        return verifierList.length;

    }





    function getBankCount()
        external
        view
        returns(uint256)
    {

        return bankList.length;

    }





    function getVerifierAt(
        uint256 index
    )
        external
        view
        returns(address)
    {

        require(
            index < verifierList.length,
            "Invalid index"
        );


        return verifierList[index];

    }





    function getBankAt(
        uint256 index
    )
        external
        view
        returns(address)
    {

        require(
            index < bankList.length,
            "Invalid index"
        );


        return bankList[index];

    }





    function getAllVerifiers()
        external
        view
        returns(address[] memory)
    {

        return verifierList;

    }





    function getAllBanks()
        external
        view
        returns(address[] memory)
    {

        return bankList;

    }

}