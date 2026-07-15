// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RoleManager.sol";

contract RoleManagerTest is Test {

    RoleManager internal roleManager;

    address internal admin = address(this);
    address internal verifier = makeAddr("verifier");
    address internal bank = makeAddr("bank");
    address internal user = makeAddr("user");

    event VerifierUpdated(address indexed verifier, bool status);
    event BankUpdated(address indexed bank, bool status);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    function setUp() public {
        roleManager = new RoleManager();
    }

    // -------------------------------------------------------------------
    // Admin
    // -------------------------------------------------------------------

    function test_DeployerIsAdmin() public view {
        assertEq(roleManager.admin(), admin);
        assertTrue(roleManager.isAdmin(admin));
        assertFalse(roleManager.isAdmin(user));
    }

    function test_TransferAdmin() public {
        vm.expectEmit(true, true, false, false);
        emit AdminTransferred(admin, user);

        roleManager.transferAdmin(user);

        assertEq(roleManager.admin(), user);
        assertTrue(roleManager.isAdmin(user));
        assertFalse(roleManager.isAdmin(admin));
    }

    function test_TransferAdmin_RevertsForNonAdmin() public {
        vm.prank(user);
        vm.expectRevert("Only admin can perform this action");
        roleManager.transferAdmin(user);
    }

    function test_TransferAdmin_RevertsForZeroAddress() public {
        vm.expectRevert("Zero address");
        roleManager.transferAdmin(address(0));
    }

    function test_OldAdminLosesRightsAfterTransfer() public {
        roleManager.transferAdmin(user);

        vm.expectRevert("Only admin can perform this action");
        roleManager.setVerifier(verifier, true);
    }

    // -------------------------------------------------------------------
    // Verifier management
    // -------------------------------------------------------------------

    function test_SetVerifier() public {
        vm.expectEmit(true, false, false, true);
        emit VerifierUpdated(verifier, true);

        roleManager.setVerifier(verifier, true);

        assertTrue(roleManager.isVerifier(verifier));
    }

    function test_RevokeVerifier() public {
        roleManager.setVerifier(verifier, true);
        roleManager.setVerifier(verifier, false);

        assertFalse(roleManager.isVerifier(verifier));
    }

    function test_SetVerifier_RevertsForNonAdmin() public {
        vm.prank(user);
        vm.expectRevert("Only admin can perform this action");
        roleManager.setVerifier(verifier, true);
    }

    function test_SetVerifier_RevertsForZeroAddress() public {
        vm.expectRevert("Zero address");
        roleManager.setVerifier(address(0), true);
    }

    // -------------------------------------------------------------------
    // Bank management
    // -------------------------------------------------------------------

    function test_SetBank() public {
        vm.expectEmit(true, false, false, true);
        emit BankUpdated(bank, true);

        roleManager.setBank(bank, true);

        assertTrue(roleManager.isBank(bank));
    }

    function test_RevokeBank() public {
        roleManager.setBank(bank, true);
        roleManager.setBank(bank, false);

        assertFalse(roleManager.isBank(bank));
    }

    function test_SetBank_RevertsForNonAdmin() public {
        vm.prank(user);
        vm.expectRevert("Only admin can perform this action");
        roleManager.setBank(bank, true);
    }

    function test_SetBank_RevertsForZeroAddress() public {
        vm.expectRevert("Zero address");
        roleManager.setBank(address(0), true);
    }

    // -------------------------------------------------------------------
    // getRole
    // -------------------------------------------------------------------

    function test_GetRole_ReturnsAdmin() public view {
        assertEq(uint256(roleManager.getRole(admin)), uint256(RoleManager.Role.ADMIN));
    }

    function test_GetRole_ReturnsVerifier() public {
        roleManager.setVerifier(verifier, true);
        assertEq(uint256(roleManager.getRole(verifier)), uint256(RoleManager.Role.VERIFIER));
    }

    function test_GetRole_ReturnsBank() public {
        roleManager.setBank(bank, true);
        assertEq(uint256(roleManager.getRole(bank)), uint256(RoleManager.Role.BANK));
    }

    function test_GetRole_ReturnsUserByDefault() public view {
        assertEq(uint256(roleManager.getRole(user)), uint256(RoleManager.Role.USER));
    }

    function test_GetRole_AdminTakesPrecedenceOverVerifier() public {
        roleManager.setVerifier(admin, true);
        assertEq(uint256(roleManager.getRole(admin)), uint256(RoleManager.Role.ADMIN));
    }

    function test_GetRole_VerifierTakesPrecedenceOverBank() public {
        roleManager.setVerifier(user, true);
        roleManager.setBank(user, true);
        assertEq(uint256(roleManager.getRole(user)), uint256(RoleManager.Role.VERIFIER));
    }
}
