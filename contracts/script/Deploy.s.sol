// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RoleManager.sol";
import "../src/KycRegistry.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        RoleManager roleManager = new RoleManager();
        console.log("RoleManager deployed at:", address(roleManager));

        KYCRegistry kycRegistry = new KYCRegistry(address(roleManager));
        console.log("KYCRegistry deployed at:", address(kycRegistry));

        vm.stopBroadcast();
    }
}
