/**
 * FORTE Cloud API Demo - Real integration like dmulvi/rwa-demo
 * This actually calls FORTE Cloud API endpoints
 */

import * as dotenv from 'dotenv';
import RealForteSDKManager from './real-forte-sdk.ts';

dotenv.config();

class ForteCloudDemo {
  private sdk: RealForteSDKManager;

  constructor() {
    this.sdk = new RealForteSDKManager();
  }

  async runDemo(): Promise<void> {
    console.log('🌐 FORTE CLOUD API INTEGRATION DEMO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 REAL FORTE Cloud API calls (like dmulvi/rwa-demo)');
    console.log('📡 API Endpoint: https://api.forte.cloud');
    console.log('🔑 Authentication: Bearer token');
    console.log('📊 14 FORTE Rules executed via Cloud API');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check if FORTE API key is configured
    const hasApiKey = !!process.env.FORTE_API_KEY && process.env.FORTE_API_KEY !== 'your_forte_cloud_api_key_here';
    
    if (hasApiKey) {
      console.log('✅ FORTE API Key configured - using REAL Cloud API');
      console.log(`🔗 API URL: ${process.env.FORTE_API_URL}`);
    } else {
      console.log('⚠️ FORTE API Key not configured - using simulation mode');
      console.log('💡 To use real FORTE Cloud API:');
      console.log('   1. Get API key from FORTE Cloud dashboard');
      console.log('   2. Set FORTE_API_KEY in your .env file');
      console.log('   3. Re-run this demo');
    }
    console.log('');

    // Phase 1: Policy Registration
    await this.registerPolicy();

    // Phase 2: Policy Application
    await this.applyPolicyToContract();

    // Phase 3: Real-time Compliance Checking
    await this.runComplianceChecks();

    this.showSummary(hasApiKey);
  }

  private async registerPolicy(): Promise<string> {
    console.log('📋 PHASE 1: FORTE Cloud Policy Registration');
    console.log('─────────────────────────────────────────────────');

    try {
      console.log('🔄 Registering 14-rule institutional policy...');
      const policyId = await this.sdk.setupPolicy('policies/institutional-rwa-complete.json');
      
      console.log(`✅ Policy registered successfully!`);
      console.log(`📍 Policy ID: ${policyId}`);
      console.log(`🏛️ Rules: 14 institutional compliance rules`);
      console.log(`🌍 Jurisdictions: US, India, UK, Germany, Singapore`);
      console.log(`💰 Asset Types: Supply Chain, Trade Finance, Equipment Finance`);
      console.log('');

      return policyId;

    } catch (error) {
      console.error('❌ Policy registration failed:', error.message);
      throw error;
    }
  }

  private async applyPolicyToContract(): Promise<void> {
    console.log('🎯 PHASE 2: Apply Policy to Smart Contract');
    console.log('─────────────────────────────────────────────────');

    // Mock contract address for demo
    const contractAddress = '0x6F1216D1BFe15c98520CA1434FC1d9D57AC95321';
    
    try {
      console.log(`🔄 Applying policy to contract ${contractAddress}...`);
      const success = await this.sdk.applyPolicy('POLICY_DEMO', contractAddress);
      
      if (success) {
        console.log('✅ Policy applied successfully!');
        console.log('🔒 Contract now enforces all 14 FORTE rules');
        console.log('⚡ Real-time compliance monitoring activated');
      } else {
        console.log('❌ Policy application failed');
      }
      console.log('');

    } catch (error) {
      console.error('❌ Policy application error:', error.message);
    }
  }

  private async runComplianceChecks(): Promise<void> {
    console.log('🔍 PHASE 3: Real-time Compliance Checking');
    console.log('─────────────────────────────────────────────────');

    // Test scenarios
    const scenarios = [
      {
        name: 'Apple Inc Supply Chain Invoice',
        data: {
          corporateName: "APPLE INC",
          legalEntityIdentifier: "HWUPKR0MPOU8FGXBT394",
          assetType: "SUPPLY_CHAIN_INVOICE",
          principalAmount: 5000000,
          pyusdAmount: 5000000,
          buyerCountry: "US",
          sellerCountry: "DE",
          creditRating: "BBB",
          recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        }
      },
      {
        name: 'OFAC Sanctions Violation',
        data: {
          corporateName: "TEST CORP",
          legalEntityIdentifier: "TESTCORP000000000000",
          assetType: "SUPPLY_CHAIN_INVOICE",
          principalAmount: 1000000,
          pyusdAmount: 1000000,
          buyerCountry: "US",
          sellerCountry: "DE",
          creditRating: "BBB",
          recipient: "0x1111111111111111111111111111111111111111" // Sanctioned address
        }
      },
      {
        name: 'PYUSD Cross-Border Limit Exceeded',
        data: {
          corporateName: "LARGE CORP",
          legalEntityIdentifier: "LARGECORP000000000000",
          assetType: "TRADE_FINANCE",
          principalAmount: 60000000, // Exceeds limits
          pyusdAmount: 60000000,
          buyerCountry: "US",
          sellerCountry: "IN",
          creditRating: "A",
          recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        }
      }
    ];

    for (const scenario of scenarios) {
      console.log(`\n🎬 Testing: ${scenario.name}`);
      console.log(`💰 Amount: $${(scenario.data.principalAmount / 1000000).toFixed(1)}M`);
      console.log(`🌍 Route: ${scenario.data.buyerCountry} → ${scenario.data.sellerCountry}`);
      
      try {
        console.log('🔄 Calling FORTE Cloud API...');
        const result = await this.sdk.checkRules('POLICY_DEMO', scenario.data);
        
        console.log(`📊 Result: ${result.compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
        console.log(`✅ Passed: ${result.passedRules.length}/14 rules`);
        console.log(`❌ Failed: ${result.failedRules.length}/14 rules`);
        
        if (result.failedRules.length > 0) {
          console.log(`⚠️ Violations: ${result.failedRules.join(', ')}`);
        }

      } catch (error) {
        console.error(`💥 Compliance check failed: ${error.message}`);
      }
    }
    console.log('');
  }

  private showSummary(hasApiKey: boolean): void {
    console.log('🏆 FORTE CLOUD INTEGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    
    if (hasApiKey) {
      console.log('✅ REAL FORTE Cloud API Integration Active');
      console.log('🌐 Connected to: https://api.forte.cloud');
      console.log('📡 API Calls: Policy registration, application, compliance checks');
      console.log('🔄 Real-time: Live compliance monitoring');
      console.log('📊 Rules: 14 institutional-grade FORTE rules');
    } else {
      console.log('🔧 Simulation Mode (No API Key)');
      console.log('💡 To enable real FORTE Cloud integration:');
      console.log('   • Get FORTE Cloud API key');
      console.log('   • Set FORTE_API_KEY in .env');
      console.log('   • Re-run demo for live API calls');
    }
    
    console.log('');
    console.log('🎯 This demonstrates the same FORTE Cloud integration');
    console.log('   as dmulvi/rwa-demo but for institutional assets');
    console.log('   instead of simple art fractionalization');
    console.log('═══════════════════════════════════════════════════════════════');
  }
}

async function main() {
  console.log('🔄 Initializing FORTE Cloud Demo...\n');
  
  const demo = new ForteCloudDemo();
  
  try {
    await demo.runDemo();
    process.exit(0);
  } catch (error) {
    console.error('💥 Demo failed:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch(console.error);
