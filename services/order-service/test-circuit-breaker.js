const CircuitBreaker = require('opossum');

// 1. Mocking the AWS SNS send function
// We make it always fail to simulate AWS SNS being down or unreachable.
const mockSnsSend = async (command) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('Simulated AWS SNS Network Timeout / Connection Refused'));
        }, 100);
    });
};

// 2. Circuit Breaker Options (matches your order.controller.js)
const breakerOptions = {
    timeout: 3000, 
    errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
    resetTimeout: 3000 // Shortened to 3 seconds for faster testing (normally 10s)
};

const snsCircuitBreaker = new CircuitBreaker(mockSnsSend, breakerOptions);

// 3. Registering Fallback and Events
snsCircuitBreaker.fallback((command, error) => {
    console.log(`[FALLBACK] -> SNS is down. Returning fallback response safely. Error: ${error.message}`);
    return { fallback: true };
});

snsCircuitBreaker.on('open', () => console.log('\n🔴 [STATE: OPEN] Circuit Breaker tripped! Future requests will be blocked automatically (Fast Failure).\n'));
snsCircuitBreaker.on('halfOpen', () => console.log('\n🟡 [STATE: HALF-OPEN] Testing the connection to SNS again...\n'));
snsCircuitBreaker.on('close', () => console.log('\n🟢 [STATE: CLOSED] Connection restored!\n'));
snsCircuitBreaker.on('fire', () => console.log('🔥 Firing request to SNS...'));
snsCircuitBreaker.on('reject', () => console.log('❌ Request REJECTED! Circuit is open, skipped hitting AWS to save resources.'));

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function runTest() {
    console.log("=== Starting Circuit Breaker Resilience Test ===\n");

    console.log("PHASE 1: Causing Failures to Open the Circuit");
    // Fire 6 requests rapidly. They will fail and trigger the fallback.
    // Since threshold is 50%, the circuit will OPEN after a few tries.
    for (let i = 1; i <= 6; i++) {
        console.log(`\n--- Request ${i} ---`);
        try {
            await snsCircuitBreaker.fire({ Message: `OrderEvent ${i}` });
        } catch (e) {
            console.log(`Caught error: ${e.message}`);
        }
        await delay(200);
    }

    console.log("\nPHASE 2: Waiting for the Reset Timeout (3 seconds)...");
    await delay(3100);

    console.log("\nPHASE 3: Testing Half-Open State");
    console.log("The next request should try to hit SNS one more time to see if it recovered.");
    console.log(`\n--- Request 7 ---`);
    try {
        await snsCircuitBreaker.fire({ Message: `OrderEvent 7` });
    } catch (e) {}

    console.log("\n=== Test Complete ===");
}

runTest();
