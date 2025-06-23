// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ZKPretAdapter.sol";
import "../src/InstitutionalAssetFactory.sol";
import "../src/PyusdCrossBorderFinance.sol";

/**
 * @title Deploy Institutional RWA Platform
 * @dev Deployment script for FORTE-enabled institutional RWA platform
 */
contract DeployInstitutionalRWA is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("FORTE_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        console.log("[DEPLOY] Institutional RWA Platform...");
        console.log("[INFO] Deployer:", vm.addr(deployerPrivateKey));
        console.log("[INFO] Gas Price:", tx.gasprice);

        // 1. Deploy ZK PRET Adapter
        console.log("\n[1] Deploying ZK PRET Adapter...");
        ZKPretAdapter zkPretAdapter = new ZKPretAdapter();
        console.log("[SUCCESS] ZK PRET Adapter deployed at:", address(zkPretAdapter));

        // 2. Deploy Institutional Asset Factory
        console.log("\n[2] Deploying Institutional Asset Factory...");
        InstitutionalAssetFactory factory = new InstitutionalAssetFactory(address(zkPretAdapter));
        console.log("[SUCCESS] Factory deployed at:", address(factory));

        // 3. Setup demo verifications for FORTE rules
        console.log("\n[3] Setting up demo verifications...");
        
        // Setup GLEIF verification for APPLE INC
        zkPretAdapter.verifyGLEIF("HWUPKR0MPOU8FGXBT394", true, "");
        console.log("[SUCCESS] GLEIF verification setup for APPLE INC");

        // Setup BPMN compliance for demo asset description
        zkPretAdapter.verifyBPMNCompliance("90-day APPLE INC institutional asset", true);
        // Also setup the original one for other demos
        zkPretAdapter.verifyBPMNCompliance("90-day supplier invoice from verified vendor", true);
        console.log("[SUCCESS] BPMN compliance setup");

        // Setup ACTUS risk assessment - use exact same data format as the factory will use
        // The factory uses: abi.encodePacked(corporateName, principalAmount)
        // But we set it up with: abi.encodePacked("APPLE INC", uint256(5000000))
        // Let's match the factory's format exactly
        bytes memory factoryAssetData = abi.encodePacked("APPLE INC", uint256(5000000 * 1e18));
        zkPretAdapter.assessACTUSRisk(factoryAssetData, 300, 700); // Good risk, good liquidity
        console.log("[SUCCESS] ACTUS risk assessment setup");

        // Setup DCSA document verification (now has demo fallback in contract)
        bytes32 demoDocHash = keccak256(abi.encodePacked("APPLE INC", uint256(5000000 * 1e18)));
        zkPretAdapter.verifyDCSADocuments(demoDocHash, true);
        console.log("[SUCCESS] DCSA document verification setup");

        // 4. Deploy PYUSD Cross-Border Finance
        console.log("\n[4] Deploying PYUSD Cross-Border Finance...");
        
        // Use Sepolia PYUSD address for testnet
        address pyusdAddress = 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9;
        PyusdCrossBorderFinance pyusdFinance = new PyusdCrossBorderFinance(pyusdAddress, address(zkPretAdapter));
        console.log("[SUCCESS] PYUSD Finance deployed at:", address(pyusdFinance));
        
        // 5. Create demo institutional asset
        console.log("\n[5] Creating demo institutional asset...");
        
        address demoAsset = factory.createQuickInstitutionalAsset(
            "APPLE INC",
            "HWUPKR0MPOU8FGXBT394",
            InstitutionalAssetParams.AssetType.SUPPLY_CHAIN_INVOICE,
            5000000 * 1e18, // $5M principal
            90,              // 90 days maturity
            850              // 8.5% interest rate
        );
        
        console.log("[SUCCESS] Demo asset created at:", demoAsset);

        vm.stopBroadcast();

        // 5. Output deployment summary
        console.log("\n[SUMMARY] DEPLOYMENT COMPLETE");
        console.log("===========================================");
        console.log("ZK PRET Adapter:    ", address(zkPretAdapter));
        console.log("Asset Factory:      ", address(factory));
        console.log("PYUSD Finance:      ", address(pyusdFinance));
        console.log("Demo Asset (APPLE): ", demoAsset);
        console.log("===========================================");
        console.log("[INFO] Ready for FORTE policy application!");
        console.log("[CMD] Run: npx tsx sdk.ts setupPolicy policies/institutional-rwa-complete.json");
        console.log("[CMD] Then: npx tsx sdk.ts applyPolicy <POLICY_ID>", address(factory));
    }
}
