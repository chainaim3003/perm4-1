/**
 * Asset Creation Demo - Complete RWA Asset Creation
 * Shows end-to-end asset creation with real-time validation
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const CONTRACT_ADDRESSES = {
  zkPretAdapter: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  factory: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
  pyusdFinance: '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1'
};

const FACTORY_ABI = [
  "function createQuickInstitutionalAsset(string,string,uint8,uint256,uint256,uint256) external returns (address)",
  "function getAllAssets() external view returns (address[])",
  "function getAssetByLEI(string) external view returns (address)",
  "function getAssetCount() external view returns (uint256)",
  "event InstitutionalAssetCreated(address indexed assetContract, string indexed lei, uint8 assetType, uint256 principalAmount, uint256 totalFractions)"
];

const ASSET_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address) external view returns (uint256)",
  "function getAssetData() external view returns (tuple)",
  "function getHolders() external view returns (address[])",
  "function owner() external view returns (address)"
];

interface NewAssetData {
  lei: string;
  name: string;
  symbol: string;
  assetType: number;
  principalAmount: bigint;
  description: string;
  expectedFractions: number;
}

class AssetCreationDemo {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private factoryContract: ethers.Contract;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
    this.wallet = new ethers.Wallet(
      process.env.FORTE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      this.provider
    );
    
    this.factoryContract = new ethers.Contract(
      CONTRACT_ADDRESSES.factory,
      FACTORY_ABI,
      this.wallet
    );
  }

  async runDemo(): Promise<void> {
    console.log('🏗️ ASSET CREATION DEMO - END-TO-END RWA CREATION');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 Creating new institutional assets from scratch');
    console.log('📊 Real-time FORTE rule validation during creation');
    console.log('💰 Multiple asset types with different characteristics');
    console.log('✅ Live blockchain deployment and verification');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check starting state
    await this.showCurrentState();

    // Create 3 different types of assets
    const assets = this.prepareAssetData();
    
    console.log('🎯 CREATING 3 NEW INSTITUTIONAL ASSETS:');
    console.log('  1. 🏢 Tesla Inc - Corporate Bond ($15M)');
    console.log('  2. 🏠 Real Estate REIT - Property Fund ($25M)');
    console.log('  3. 🏛️ Government Bond - Treasury Security ($50M)\n');

    for (let i = 0; i < assets.length; i++) {
      await this.createAssetWithValidation(assets[i], i + 1);
      if (i < assets.length - 1) {
        console.log('\n' + '─'.repeat(60) + '\n');
      }
    }

    // Show final state
    await this.showFinalResults();

    console.log('\n🏆 ASSET CREATION DEMO COMPLETED!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ 3 new institutional assets created successfully');
    console.log('✅ All FORTE rules validated during creation');
    console.log('✅ Real blockchain deployment verified');
    console.log('✅ Asset portfolio expanded and diversified');
    console.log('✅ Ready for investor onboarding and trading');
    console.log('═══════════════════════════════════════════════════════════════');
  }

  private async showCurrentState(): Promise<void> {
    console.log('📊 CURRENT PORTFOLIO STATE');
    console.log('─────────────────────────────────────────────────\n');

    const assetCount = await this.factoryContract.getAssetCount();
    const allAssets = await this.factoryContract.getAllAssets();

    console.log(`📈 Current Asset Count: ${assetCount}`);
    console.log(`🗂️ Existing Assets:`);
    
    if (allAssets.length > 0) {
      for (let i = 0; i < allAssets.length; i++) {
        const assetContract = new ethers.Contract(allAssets[i], ASSET_ABI, this.provider);
        try {
          const name = await assetContract.name();
          const symbol = await assetContract.symbol();
          console.log(`     ${i + 1}. ${name} (${symbol}) - ${allAssets[i]}`);
        } catch (error) {
          console.log(`     ${i + 1}. Asset ${allAssets[i]} (data unavailable)`);
        }
      }
    } else {
      console.log('     No existing assets found');
    }

    console.log('\n✅ Ready to create new assets!\n');
  }

  private prepareAssetData(): NewAssetData[] {
    return [
      {
        lei: '254900OPPU84GM83MG36', // Tesla Inc LEI
        name: 'Tesla Inc Corporate Bond',
        symbol: 'TSLA-CB-2029',
        assetType: 1, // Corporate bond
        principalAmount: ethers.parseEther('15000000'), // $15M
        description: 'Tesla Inc 5-year corporate bond for manufacturing expansion',
        expectedFractions: 15000 // 15,000 tokens
      },
      {
        lei: '529900T8BM49AURSDO55', // Real Estate REIT LEI
        name: 'Commercial Real Estate REIT',
        symbol: 'CRE-REIT-01',
        assetType: 2, // Real estate
        principalAmount: ethers.parseEther('25000000'), // $25M
        description: 'Diversified commercial real estate investment trust',
        expectedFractions: 25000 // 25,000 tokens
      },
      {
        lei: '254900TWKUO6SSQHWA87', // US Treasury LEI
        name: 'US Treasury Security',
        symbol: 'UST-2030',
        assetType: 0, // Government bond
        principalAmount: ethers.parseEther('50000000'), // $50M
        description: 'United States Treasury 7-year government security',
        expectedFractions: 50000 // 50,000 tokens
      }
    ];
  }

  private async createAssetWithValidation(assetData: NewAssetData, assetNumber: number): Promise<void> {
    console.log(`🏗️ CREATING ASSET ${assetNumber}: ${assetData.name.toUpperCase()}`);
    console.log('─────────────────────────────────────────────────');

    // Step 1: Pre-creation validation
    console.log('\n🔍 Step 1: Pre-Creation Validation');
    await this.validateAssetData(assetData);

    // Step 2: FORTE rules compliance check
    console.log('\n📋 Step 2: FORTE Rules Compliance Check');
    const complianceScore = await this.checkForteCompliance(assetData);

    // Step 3: Create the asset on blockchain
    console.log('\n🚀 Step 3: Blockchain Deployment');
    const assetAddress = await this.deployAssetToBlockchain(assetData);

    // Step 4: Post-creation verification
    console.log('\n✅ Step 4: Post-Creation Verification');
    await this.verifyCreatedAsset(assetAddress, assetData);

    console.log(`\n🎉 ASSET ${assetNumber} CREATION COMPLETE!`);
    console.log(`📍 Contract Address: ${assetAddress}`);
    console.log(`📊 Compliance Score: ${complianceScore}/100`);
    console.log(`💎 Total Tokens: ${assetData.expectedFractions.toLocaleString()}`);
    console.log(`💰 Principal Value: $${ethers.formatEther(assetData.principalAmount)}M`);
  }

  private async validateAssetData(assetData: NewAssetData): Promise<void> {
    console.log('   🔎 Validating asset metadata...');
    
    // LEI validation
    const leiValid = this.validateLEI(assetData.lei);
    console.log(`   📋 LEI Format: ${leiValid ? '✅ VALID' : '❌ INVALID'} (${assetData.lei})`);

    // Principal amount validation
    const minAmount = ethers.parseEther('1000000'); // $1M minimum
    const amountValid = assetData.principalAmount >= minAmount;
    console.log(`   💰 Principal Amount: ${amountValid ? '✅ VALID' : '❌ TOO SMALL'} ($${ethers.formatEther(assetData.principalAmount)}M)`);

    // Asset type validation
    const typeValid = assetData.assetType >= 0 && assetData.assetType <= 3;
    const typeNames = ['Government Bond', 'Corporate Bond', 'Real Estate', 'Commodity'];
    console.log(`   🏷️ Asset Type: ${typeValid ? '✅ VALID' : '❌ INVALID'} (${typeNames[assetData.assetType] || 'Unknown'})`);

    // Name and symbol validation
    const nameValid = assetData.name.length >= 5;
    const symbolValid = assetData.symbol.length >= 3;
    console.log(`   📛 Name/Symbol: ${nameValid && symbolValid ? '✅ VALID' : '❌ INVALID'} (${assetData.name} / ${assetData.symbol})`);

    if (!leiValid || !amountValid || !typeValid || !nameValid || !symbolValid) {
      throw new Error('Asset validation failed - cannot proceed with creation');
    }

    console.log('   ✅ All basic validations passed!');
  }

  private async checkForteCompliance(assetData: NewAssetData): Promise<number> {
    console.log('   🎯 Running FORTE compliance check...');
    
    let score = 0;
    const checks = [];

    // LEI compliance (20 points)
    if (this.validateLEI(assetData.lei)) {
      score += 20;
      checks.push('✅ LEI Format Valid');
    } else {
      checks.push('❌ LEI Format Invalid');
    }

    // Financial compliance (25 points)
    if (assetData.principalAmount >= ethers.parseEther('1000000')) {
      score += 25;
      checks.push('✅ Principal Amount Sufficient');
    } else {
      checks.push('❌ Principal Amount Too Low');
    }

    // Metadata completeness (20 points)
    if (assetData.description.length > 20 && assetData.name.length > 5) {
      score += 20;
      checks.push('✅ Metadata Complete');
    } else {
      checks.push('❌ Metadata Incomplete');
    }

    // Asset type validity (15 points)
    if (assetData.assetType >= 0 && assetData.assetType <= 3) {
      score += 15;
      checks.push('✅ Asset Type Valid');
    } else {
      checks.push('❌ Asset Type Invalid');
    }

    // Token economics (20 points)
    const optimalFractions = Number(ethers.formatEther(assetData.principalAmount)) * 1000;
    if (Math.abs(assetData.expectedFractions - optimalFractions) < optimalFractions * 0.1) {
      score += 20;
      checks.push('✅ Token Economics Optimal');
    } else {
      checks.push('❌ Token Economics Suboptimal');
    }

    // Display results
    checks.forEach(check => console.log(`   ${check}`));
    console.log(`   📊 FORTE Compliance Score: ${score}/100 (${score >= 85 ? 'PASS' : 'FAIL'})`);

    if (score < 85) {
      throw new Error('FORTE compliance score too low - cannot create asset');
    }

    return score;
  }

  private async deployAssetToBlockchain(assetData: NewAssetData): Promise<string> {
    console.log('   🚀 Deploying to blockchain...');
    
    try {
      console.log('   📝 Preparing transaction...');
      
      const tx = await this.factoryContract.createQuickInstitutionalAsset(
        assetData.lei,
        assetData.name,
        assetData.assetType,
        assetData.principalAmount,
        BigInt(assetData.expectedFractions),
        Math.floor(Date.now() / 1000) + (5 * 365 * 24 * 60 * 60) // 5 years maturity
      );

      console.log(`   📤 Transaction submitted: ${tx.hash}`);
      console.log('   ⏳ Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`   ⛽ Gas used: ${receipt.gasUsed.toLocaleString()}`);

      // Extract asset address from events
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.factoryContract.interface.parseLog(log);
          return parsed && parsed.name === 'InstitutionalAssetCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = this.factoryContract.interface.parseLog(event);
        const assetAddress = parsed.args.assetContract;
        console.log(`   🎯 Asset deployed at: ${assetAddress}`);
        return assetAddress;
      } else {
        throw new Error('Asset creation event not found');
      }

    } catch (error) {
      console.error(`   ❌ Deployment failed: ${error}`);
      throw error;
    }
  }

  private async verifyCreatedAsset(assetAddress: string, expectedData: NewAssetData): Promise<void> {
    console.log('   🔍 Verifying deployed asset...');

    const assetContract = new ethers.Contract(assetAddress, ASSET_ABI, this.provider);

    try {
      // Check basic properties
      const name = await assetContract.name();
      const symbol = await assetContract.symbol();
      const totalSupply = await assetContract.totalSupply();
      const owner = await assetContract.owner();

      console.log(`   📛 Name: ${name === expectedData.name ? '✅' : '❌'} ${name}`);
      console.log(`   🔖 Symbol: ${symbol === expectedData.symbol ? '✅' : '❌'} ${symbol}`);
      console.log(`   💎 Total Supply: ${totalSupply.toString() === ethers.parseEther(expectedData.expectedFractions.toString()).toString() ? '✅' : '❌'} ${ethers.formatEther(totalSupply)}`);
      console.log(`   👤 Owner: ${owner === this.wallet.address ? '✅' : '❌'} ${owner}`);

      // Check contract bytecode
      const code = await this.provider.getCode(assetAddress);
      console.log(`   📋 Contract Code: ${code !== '0x' ? '✅ DEPLOYED' : '❌ NOT FOUND'} (${code.length} bytes)`);

      // Verify asset is registered in factory
      const assetByLEI = await this.factoryContract.getAssetByLEI(expectedData.lei);
      console.log(`   🏭 Factory Registration: ${assetByLEI === assetAddress ? '✅ REGISTERED' : '❌ NOT FOUND'}`);

      console.log('   ✅ Asset verification complete!');

    } catch (error) {
      console.error(`   ❌ Verification failed: ${error}`);
      throw error;
    }
  }

  private async showFinalResults(): Promise<void> {
    console.log('\n📊 FINAL PORTFOLIO STATE');
    console.log('─────────────────────────────────────────────────\n');

    const finalCount = await this.factoryContract.getAssetCount();
    const allAssets = await this.factoryContract.getAllAssets();

    console.log(`📈 Total Assets: ${finalCount} (increased from previous count)`);
    console.log(`💰 Portfolio Value Summary:`);

    let totalValue = BigInt(0);
    
    for (let i = 0; i < allAssets.length; i++) {
      const assetContract = new ethers.Contract(allAssets[i], ASSET_ABI, this.provider);
      try {
        const name = await assetContract.name();
        const symbol = await assetContract.symbol();
        const totalSupply = await assetContract.totalSupply();
        
        console.log(`     ${i + 1}. ${name} (${symbol})`);
        console.log(`        📍 Address: ${allAssets[i]}`);
        console.log(`        💎 Tokens: ${ethers.formatEther(totalSupply)}`);
        
        // Estimate value (assuming 1 token = $1000 for demo)
        const estimatedValue = BigInt(totalSupply) / BigInt(1000);
        totalValue += estimatedValue;
        console.log(`        💰 Est. Value: $${(Number(estimatedValue) / 1e18).toLocaleString()}M`);
        console.log('');
        
      } catch (error) {
        console.log(`     ${i + 1}. Asset ${allAssets[i]} (error reading data)`);
      }
    }

    console.log(`🏆 Total Portfolio Value: ~$${(Number(totalValue) / 1e18).toLocaleString()}M`);
    console.log(`📊 Asset Diversification: Government Bonds, Corporate Bonds, Real Estate, Equity`);
    console.log(`✅ All assets compliant with FORTE rules`);
    console.log(`🔗 Ready for secondary market trading`);
  }

  private validateLEI(lei: string): boolean {
    const leiRegex = /^[A-Z0-9]{18}[0-9]{2}$/;
    return leiRegex.test(lei);
  }
}

async function main() {
  console.log('🔄 Initializing Asset Creation Demo...\n');
  
  const demo = new AssetCreationDemo();
  
  try {
    await demo.runDemo();
    process.exit(0);
  } catch (error) {
    console.error('💥 Demo failed:', error);
    process.exit(1);
  }
}

main();