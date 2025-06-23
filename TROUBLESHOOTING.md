# 🔧 TROUBLESHOOTING GUIDE

## Quick Fix Summary
✅ **FIXED**: TypeScript compilation errors  
✅ **FIXED**: dotenv import syntax  
✅ **FIXED**: ethers.js private field compatibility  
✅ **FIXED**: Missing main() function call  

## Step-by-Step Testing

### 1. Validate TypeScript Setup
```bash
npm run test-typescript
```

### 2. Test Quick Demo (No blockchain required)
```bash
npm run quick-demo
```

### 3. Test Full Demo (Requires Anvil)
```bash
# Start Anvil in separate terminal
anvil --load-state anvilState.json

# Run complete demo
npm run complete-demo
```

### 4. Test Individual Components
```bash
# Test FORTE rules only
npm run demo-pass

# Test PYUSD integration
npm run demo-pyusd

# Get PYUSD faucet instructions
npm run pyusd-faucet
```

## Environment Setup

### Required .env Variables
```bash
# Copy .env.example to .env
cp .env.example .env

# Minimum required for local testing
FORTE_RPC_URL=http://localhost:8545
FORTE_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Start Local Blockchain
```bash
# If you have an anvil state file
anvil --load-state anvilState.json

# Or start fresh
anvil

# Deploy contracts if needed
npm run deploy
```

## Common Issues & Solutions

### Issue: "Module has no default export"
**Fixed**: Changed from `import dotenv from 'dotenv'` to `import * as dotenv from 'dotenv'`

### Issue: "Private identifiers are only available when targeting ECMAScript 2015"
**Fixed**: Updated tsconfig.json with `"strict": false` and `"useDefineForClassFields": false`

### Issue: Demo doesn't execute
**Fixed**: Added `main().catch(console.error)` call at end of file

### Issue: Blockchain connection fails
**Expected**: If Anvil isn't running, the demo will show "OFFLINE" status but continue with simulation

## Demo Hierarchy

1. **quick-demo.ts** - Fastest test, no blockchain required
2. **demo.ts** - FORTE rules testing with pass/fail scenarios  
3. **pyusd-demo.ts** - PYUSD cross-border finance demonstration
4. **complete-integration-demo.ts** - Full end-to-end showcase

## Success Indicators

✅ TypeScript compiles without errors  
✅ quick-demo runs and shows all phases  
✅ Blockchain connection works (when Anvil running)  
✅ All 14 FORTE rules load correctly  
✅ PYUSD integration demonstrates cross-border features  

## Next Steps After Fix

1. Run `npm run quick-demo` to validate setup
2. Start Anvil: `anvil --load-state anvilState.json` 
3. Run `npm run complete-demo` for full experience
4. Deploy to testnets for hackathon submission
