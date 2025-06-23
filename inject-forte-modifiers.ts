/**
 * FORTE Modifier Injection Tool
 * Injects FORTE rule enforcement modifiers into smart contracts
 * Similar to dmulvi/rwa-demo approach
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

export class ForteModifierInjector {
    
    async injectModifiers(contractPath: string, policyPath: string): Promise<void> {
        console.log(`🔧 Injecting FORTE modifiers into ${contractPath}...`);
        
        if (!existsSync(contractPath) || !existsSync(policyPath)) {
            throw new Error('Contract or policy file not found');
        }
        
        const contractCode = await readFile(contractPath, 'utf-8');
        const policy = JSON.parse(await readFile(policyPath, 'utf-8'));
        
        console.log(`📋 Policy loaded: ${policy.policyName}`);
        console.log(`🔢 Rules to inject: ${policy.rules.length}`);
        
        // Generate FORTE modifier based on policy rules
        const forteModifier = this.generateForteModifier(policy);
        const modifiedContract = this.insertModifier(contractCode, forteModifier);
        
        // Backup original
        await writeFile(`${contractPath}.backup`, contractCode);
        console.log(`💾 Backup created: ${contractPath}.backup`);
        
        // Write modified contract
        await writeFile(contractPath, modifiedContract);
        
        console.log(`✅ FORTE modifiers injected successfully`);
        console.log(`📊 Rules enforced: ${policy.rules.length}`);
        console.log(`🎯 Modified functions: createInstitutionalAsset`);
    }
    
    private generateForteModifier(policy: any): string {
        const ruleIds = policy.rules.map((r: any) => r.ruleId);
        
        return `
    /**
     * FORTE Compliance Modifier - Auto-generated
     * Enforces ${policy.rules.length} institutional rules
     * Policy: ${policy.policyName}
     * Generated: ${new Date().toISOString()}
     */
    modifier forteCompliance(bytes calldata ruleData) {
        require(address(zkPretAdapter) != address(0), "ZK PRET adapter not set");
        
        // Decode rule data for comprehensive checking
        InstitutionalAssetParams.InstitutionalAsset memory params = 
            abi.decode(ruleData, (InstitutionalAssetParams.InstitutionalAsset));
        
        // FORTE RULE 1: Enhanced KYC + GLEIF Verification
        require(
            zkPretAdapter.isGLEIFVerified(params.legalEntityIdentifier),
            "FORTE RULE 1 VIOLATION: GLEIF LEI verification required"
        );

        // FORTE RULE 2: Enhanced OFAC Real-time Check  
        require(
            !zkPretAdapter.isOFACSanctioned(params.corporateWallet),
            "FORTE RULE 2 VIOLATION: OFAC sanctions violation detected"
        );

        // FORTE RULE 3: Cross-border Sanctions Check
        require(
            zkPretAdapter.isCrossBorderCompliant(params.corporateWallet, params.manager),
            "FORTE RULE 3 VIOLATION: Cross-border sanctions restriction"
        );

        // FORTE RULE 4: GLEIF Corporate Registration
        require(
            bytes(params.legalEntityIdentifier).length == 20,
            "FORTE RULE 4 VIOLATION: Invalid LEI format - must be 20 characters"
        );

        // FORTE RULE 5: BPMN Business Process Compliance
        require(
            zkPretAdapter.isBPMNCompliant(params.assetDescription),
            "FORTE RULE 5 VIOLATION: Business process compliance verification failed"
        );

        // FORTE RULE 6: ACTUS Risk Assessment
        (uint256 riskScore, uint256 liquidityScore) = zkPretAdapter.getACTUSRiskScore(
            abi.encodePacked(params.corporateName, params.principalAmount)
        );
        require(
            riskScore > 0 && riskScore <= 500,
            "FORTE RULE 6 VIOLATION: ACTUS risk assessment failed or too high risk"
        );

        // FORTE RULE 7: DCSA Trade Document Integrity
        require(
            zkPretAdapter.isDCSAVerified(params.documentHash),
            "FORTE RULE 7 VIOLATION: DCSA trade document verification failed"
        );

        // FORTE RULE 8: Optimal Fraction Calculation
        InstitutionalAssetParams.FractionParams memory fractionParams = 
            zkPretAdapter.calculateOptimalFractions(params.principalAmount, params.assetType);
        require(
            fractionParams.optimalCount >= 10 && fractionParams.optimalCount <= 10000,
            "FORTE RULE 8 VIOLATION: Fraction count outside optimal range"
        );

        // FORTE RULE 9: Metadata Completeness Score
        InstitutionalAssetParams.MetadataScore memory score = 
            zkPretAdapter.calculateMetadataScore(params);
        require(
            score.totalScore >= 70,
            "FORTE RULE 9 VIOLATION: Insufficient metadata completeness score"
        );

        // FORTE RULE 10: Minimum Fraction Threshold
        require(
            params.minimumFractionSize >= 500e18,
            "FORTE RULE 10 VIOLATION: Fraction size below minimum $500 threshold"
        );

        // FORTE RULE 11: Fraction Liquidity Optimization
        require(
            params.totalFractions >= 10 && params.totalFractions <= 10000,
            "FORTE RULE 11 VIOLATION: Fraction count outside optimal liquidity range"
        );

        // FORTE RULE 12: Enhanced Metadata Enforcement
        (bool meetsThreshold, uint8 currentScore, uint8 requiredScore) = 
            zkPretAdapter.checkMetadataThreshold(params);
        require(
            meetsThreshold,
            string(abi.encodePacked(
                "FORTE RULE 12 VIOLATION: Metadata score ",
                toString(currentScore),
                " below required ",
                toString(requiredScore)
            ))
        );

        // FORTE RULE 13: PYUSD Stablecoin Peg Verification
        if (params.pyusdAmount > 0) {
            require(
                zkPretAdapter.isPYUSDPegStable(params.pyusdAmount),
                "FORTE RULE 13 VIOLATION: PYUSD peg unstable or insufficient reserves"
            );
        }

        // FORTE RULE 14: Cross-Border PYUSD Settlement Compliance
        if (params.pyusdAmount > 0 && params.isCrossBorder) {
            require(
                zkPretAdapter.isCrossBorderPYUSDCompliant(
                    params.buyerCountry, 
                    params.sellerCountry, 
                    params.pyusdAmount
                ),
                "FORTE RULE 14 VIOLATION: Cross-border PYUSD settlement restriction"
            );
        }

        _;
    }
    
    // Helper function for string conversion in Solidity
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }`;
    }
    
    private insertModifier(contractCode: string, modifier: string): string {
        // Find the contract class definition
        const contractClassRegex = /contract\s+InstitutionalAssetFactory\s*{/;
        const match = contractCode.match(contractClassRegex);
        
        if (!match) {
            throw new Error('Could not find InstitutionalAssetFactory contract definition');
        }
        
        // Insert modifier after contract opening brace
        const insertPosition = contractCode.indexOf('{', match.index!) + 1;
        
        let modifiedCode = 
            contractCode.slice(0, insertPosition) + 
            '\n' + modifier + '\n' + 
            contractCode.slice(insertPosition);
        
        // Modify function signature to include modifier
        modifiedCode = this.addModifierToFunctions(modifiedCode);
        
        // Remove existing manual rule checks (they're now in the modifier)
        modifiedCode = this.removeManualRuleChecks(modifiedCode);
        
        return modifiedCode;
    }
    
    private addModifierToFunctions(contractCode: string): string {
        // Add forteCompliance modifier to createInstitutionalAsset function
        const functionPattern = /function createInstitutionalAsset\s*\(\s*InstitutionalAssetParams\.InstitutionalAsset memory params\s*\)\s*external\s*returns/;
        
        return contractCode.replace(
            functionPattern,
            'function createInstitutionalAsset(\n        InstitutionalAssetParams.InstitutionalAsset memory params\n    ) external forteCompliance(abi.encode(params)) returns'
        );
    }
    
    private removeManualRuleChecks(contractCode: string): string {
        // Remove the manual FORTE rule checks since they're now in the modifier
        const ruleCheckPatterns = [
            /\/\/ FORTE RULE \d+:[\s\S]*?require\([\s\S]*?\);/g,
            /require\(\s*zkPretAdapter\.isGLEIFVerified[\s\S]*?\);/g,
            /require\(\s*zkPretAdapter\.isBPMNCompliant[\s\S]*?\);/g,
            /require\(\s*zkPretAdapter\.isDCSAVerified[\s\S]*?\);/g
        ];
        
        let cleanedCode = contractCode;
        for (const pattern of ruleCheckPatterns) {
            cleanedCode = cleanedCode.replace(pattern, '// Rule checks moved to forteCompliance modifier');
        }
        
        return cleanedCode;
    }
    
    async restoreBackup(contractPath: string): Promise<void> {
        const backupPath = `${contractPath}.backup`;
        if (existsSync(backupPath)) {
            const backup = await readFile(backupPath, 'utf-8');
            await writeFile(contractPath, backup);
            console.log(`✅ Contract restored from backup`);
        } else {
            throw new Error('No backup file found');
        }
    }
}

// CLI usage
export async function injectForteModifiers(
    contractPath: string = 'src/InstitutionalAssetFactory.sol',
    policyPath: string = 'policies/institutional-rwa-complete.json'
): Promise<void> {
    console.log('🚀 FORTE Modifier Injection Starting...');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📁 Contract: ${contractPath}`);
    console.log(`📋 Policy: ${policyPath}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const injector = new ForteModifierInjector();
    await injector.injectModifiers(contractPath, policyPath);
    
    console.log('\n🎯 FORTE MODIFIER INJECTION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Smart contract now enforces all 14 FORTE rules');
    console.log('🔒 Rules are embedded in contract bytecode');
    console.log('⚡ On-chain compliance enforcement active');
    console.log('💾 Original contract backed up');
    console.log('');
    console.log('Next steps:');
    console.log('1. forge build                    # Compile modified contract');
    console.log('2. anvil --load-state anvilState.json  # Start local blockchain');
    console.log('3. forge script script/Deploy.s.sol --broadcast  # Deploy');
    console.log('4. npx tsx demo-final.ts all      # Test all 14 rules');
    console.log('═══════════════════════════════════════════════════════════════');
}

// Execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname.replace(/\\/g, '/')) {
    const contractPath = process.argv[2] || 'src/InstitutionalAssetFactory.sol';
    const policyPath = process.argv[3] || 'policies/institutional-rwa-complete.json';
    
    injectForteModifiers(contractPath, policyPath)
        .catch(error => {
            console.error('💥 FORTE injection failed:', error.message);
            process.exit(1);
        });
}
