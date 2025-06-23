/**
 * Debug Demo - Find where the original demo is hanging
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('🔍 DEBUG DEMO - Step by step testing');
console.log('═══════════════════════════════════════');

async function debugDemo() {
  try {
    console.log('✅ Step 1: Environment loaded');
    
    console.log('⚡ Step 2: Testing ethers provider...');
    const provider = new ethers.JsonRpcProvider(process.env.FORTE_RPC_URL || 'http://localhost:8545');
    console.log('✅ Step 2: Provider created');
    
    console.log('👤 Step 3: Testing wallet...');
    const wallet = new ethers.Wallet(
      process.env.FORTE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      provider
    );
    console.log('✅ Step 3: Wallet created');
    
    console.log('📋 Step 4: Testing file read...');
    const fs = await import('fs/promises');
    const policyContent = await fs.readFile('policies/institutional-rwa-complete.json', 'utf-8');
    const policy = JSON.parse(policyContent);
    console.log(`✅ Step 4: Policy loaded (${policy.rules.length} rules)`);
    
    console.log('🔧 Step 5: Testing SDK import...');
    const ForteSDKManager = await import('./sdk.ts');
    console.log('✅ Step 5: SDK imported');
    
    console.log('🏗️ Step 6: Testing SDK construction...');
    const sdk = new ForteSDKManager.default();
    console.log('✅ Step 6: SDK constructed');
    
    console.log('🎯 Step 7: Testing policy setup...');
    const policyId = await sdk.setupPolicy('policies/institutional-rwa-complete.json');
    console.log(`✅ Step 7: Policy setup complete (${policyId})`);
    
    console.log('\n🎉 DEBUG COMPLETE - All steps working!');
    console.log('The issue must be elsewhere...');
    
  } catch (error) {
    console.error('💥 Error at step:', error);
    console.error('Stack:', error.stack);
  }
}

debugDemo().catch(console.error);
