// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RoleManager.sol";
import "../src/KycRegistry.sol";

contract KYCRegistryTest is Test {

    RoleManager internal roleManager;
    KYCRegistry internal kycRegistry;

    address internal admin = address(this);
    address internal verifier = makeAddr("verifier");
    address internal verifier2 = makeAddr("verifier2");
    address internal user = makeAddr("user");
    address internal stranger = makeAddr("stranger");

    string internal constant CID_V1 = "QmTestCidVersion1";
    string internal constant CID_V2 = "QmTestCidVersion2";
    bytes32 internal constant HASH_V1 = keccak256("kyc-data-v1");
    bytes32 internal constant HASH_V2 = keccak256("kyc-data-v2");

    event KYCVerified(
        address indexed user,
        uint256 indexed version,
        string ipfsCid,
        bytes32 dataHash,
        address indexed verifiedBy,
        uint256 verifiedAt
    );

    function setUp() public {
        roleManager = new RoleManager();
        kycRegistry = new KYCRegistry(address(roleManager));
        roleManager.setVerifier(verifier, true);
    }

    // -------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------

    function test_Constructor_SetsRoleManager() public view {
        assertEq(address(kycRegistry.roleManager()), address(roleManager));
    }

    function test_Constructor_RevertsForZeroAddress() public {
        vm.expectRevert("Zero address");
        new KYCRegistry(address(0));
    }

    // -------------------------------------------------------------------
    // anchorKYC — access control
    // -------------------------------------------------------------------

    function test_AnchorKYC_ByVerifier() public {
        vm.expectEmit(true, true, true, true);
        emit KYCVerified(user, 1, CID_V1, HASH_V1, verifier, block.timestamp);

        vm.prank(verifier);
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);

        assertTrue(kycRegistry.hasVerifiedKYC(user));
        assertEq(kycRegistry.getVersionCount(user), 1);
    }

    function test_AnchorKYC_RevertsForNonVerifier() public {
        vm.prank(stranger);
        vm.expectRevert("Not an authorized verifier");
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);
    }

    function test_AnchorKYC_RevertsForAdminWithoutVerifierRole() public {
        vm.expectRevert("Not an authorized verifier");
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);
    }

    function test_AnchorKYC_RevertsAfterVerifierRevoked() public {
        roleManager.setVerifier(verifier, false);

        vm.prank(verifier);
        vm.expectRevert("Not an authorized verifier");
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);
    }

    // -------------------------------------------------------------------
    // anchorKYC — input validation
    // -------------------------------------------------------------------

    function test_AnchorKYC_RevertsForZeroUser() public {
        vm.prank(verifier);
        vm.expectRevert("Zero address user");
        kycRegistry.anchorKYC(address(0), CID_V1, HASH_V1);
    }

    function test_AnchorKYC_RevertsForEmptyCid() public {
        vm.prank(verifier);
        vm.expectRevert("Empty IPFS CID");
        kycRegistry.anchorKYC(user, "", HASH_V1);
    }

    function test_AnchorKYC_RevertsForZeroHash() public {
        vm.prank(verifier);
        vm.expectRevert("Empty data hash");
        kycRegistry.anchorKYC(user, CID_V1, bytes32(0));
    }

    // -------------------------------------------------------------------
    // Versioning
    // -------------------------------------------------------------------

    function test_AnchorKYC_IncrementsVersion() public {
        vm.prank(verifier);
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);

        vm.prank(verifier);
        kycRegistry.anchorKYC(user, CID_V2, HASH_V2);

        assertEq(kycRegistry.getVersionCount(user), 2);

        (uint256 version, string memory cid,,,) = kycRegistry.getLatestKYC(user);
        assertEq(version, 2);
        assertEq(cid, CID_V2);
    }

    function test_VersionsAreIndependentPerUser() public {
        vm.prank(verifier);
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);

        assertEq(kycRegistry.getVersionCount(user), 1);
        assertEq(kycRegistry.getVersionCount(stranger), 0);
        assertFalse(kycRegistry.hasVerifiedKYC(stranger));
    }

    // -------------------------------------------------------------------
    // getLatestKYC
    // -------------------------------------------------------------------

    function test_GetLatestKYC_ReturnsFullRecord() public {
        uint256 anchoredAt = block.timestamp;

        vm.prank(verifier);
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);

        (
            uint256 version,
            string memory cid,
            bytes32 dataHash,
            uint256 verifiedAt,
            address verifiedBy
        ) = kycRegistry.getLatestKYC(user);

        assertEq(version, 1);
        assertEq(cid, CID_V1);
        assertEq(dataHash, HASH_V1);
        assertEq(verifiedAt, anchoredAt);
        assertEq(verifiedBy, verifier);
    }

    function test_GetLatestKYC_RevertsWhenNoRecord() public {
        vm.expectRevert("No verified KYC");
        kycRegistry.getLatestKYC(user);
    }

    // -------------------------------------------------------------------
    // getKYCVersion
    // -------------------------------------------------------------------

    function test_GetKYCVersion_ReturnsHistoricalRecord() public {
        vm.prank(verifier);
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);

        roleManager.setVerifier(verifier2, true);
        vm.warp(block.timestamp + 1 days);

        vm.prank(verifier2);
        kycRegistry.anchorKYC(user, CID_V2, HASH_V2);

        (string memory cid1, bytes32 hash1,, address by1) = kycRegistry.getKYCVersion(user, 1);
        assertEq(cid1, CID_V1);
        assertEq(hash1, HASH_V1);
        assertEq(by1, verifier);

        (string memory cid2, bytes32 hash2,, address by2) = kycRegistry.getKYCVersion(user, 2);
        assertEq(cid2, CID_V2);
        assertEq(hash2, HASH_V2);
        assertEq(by2, verifier2);
    }

    function test_GetKYCVersion_RevertsForVersionZero() public {
        vm.prank(verifier);
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);

        vm.expectRevert("Invalid version");
        kycRegistry.getKYCVersion(user, 0);
    }

    function test_GetKYCVersion_RevertsForVersionTooHigh() public {
        vm.prank(verifier);
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);

        vm.expectRevert("Invalid version");
        kycRegistry.getKYCVersion(user, 2);
    }

    function test_GetKYCVersion_RevertsWhenNoRecord() public {
        vm.expectRevert("Invalid version");
        kycRegistry.getKYCVersion(user, 1);
    }

    // -------------------------------------------------------------------
    // Fuzz tests
    // -------------------------------------------------------------------

    function testFuzz_AnchorKYC_StoresArbitraryData(
        address anyUser,
        string calldata cid,
        bytes32 dataHash
    ) public {
        vm.assume(anyUser != address(0));
        vm.assume(bytes(cid).length > 0);
        vm.assume(dataHash != bytes32(0));

        vm.prank(verifier);
        kycRegistry.anchorKYC(anyUser, cid, dataHash);

        (uint256 version, string memory storedCid, bytes32 storedHash,,) =
            kycRegistry.getLatestKYC(anyUser);

        assertEq(version, 1);
        assertEq(storedCid, cid);
        assertEq(storedHash, dataHash);
    }

    function testFuzz_AnchorKYC_RevertsForAnyNonVerifier(address caller) public {
        vm.assume(!roleManager.isVerifier(caller));

        vm.prank(caller);
        vm.expectRevert("Not an authorized verifier");
        kycRegistry.anchorKYC(user, CID_V1, HASH_V1);
    }
}
