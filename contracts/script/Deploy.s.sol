// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ReusableKYC} from "../src/ReusableKYC.sol";

contract DeployReusableKYC is Script {
    function run() external returns (ReusableKYC) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        ReusableKYC kyc = new ReusableKYC();

        vm.stopBroadcast();

        return kyc;
    }
}
