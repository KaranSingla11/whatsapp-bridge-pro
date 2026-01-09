/**
 * External Keep-Alive Monitor
 * Prevents Render sleep by pinging from external services
 */

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

// List of services to monitor
const SERVICES = [
    {
        name: 'WhatsApp Bridge Pro',
        url: process.env.BRIDGE_URL || 'https://your-app.onrender.com',
        healthPath: '/health',
        keepAlivePath: '/keepalive'
    }
];

// Health check for each service
async function checkService(service) {
    try {
        const response = await axios.get(`${service.url}${service.healthPath}`, {
            timeout: 10000
        });
        
        console.log(`✅ ${service.name}: Healthy (${response.status})`);
        return true;
    } catch (error) {
        console.log(`❌ ${service.name}: Failed - ${error.message}`);
        return false;
    }
}

// Keep-alive ping for each service
async function keepAlive(service) {
    try {
        const response = await axios.get(`${service.url}${service.keepAlivePath}`, {
            timeout: 15000
        });
        
        console.log(`🔄 ${service.name}: Keep-alive sent`);
        return true;
    } catch (error) {
        console.log(`⚠️ ${service.name}: Keep-alive failed - ${error.message}`);
        return false;
    }
}

// Monitoring schedule
async function startMonitoring() {
    console.log('🚀 External monitor started');
    
    // Check health every 2 minutes
    setInterval(async () => {
        console.log('\n📊 Health Check:');
        for (const service of SERVICES) {
            await checkService(service);
        }
    }, 2 * 60 * 1000);

    // Send keep-alive every 5 minutes
    setInterval(async () => {
        console.log('\n💓 Keep-Alive Ping:');
        for (const service of SERVICES) {
            await keepAlive(service);
        }
    }, 5 * 60 * 1000);

    // Initial check
    console.log('\n🔍 Initial Health Check:');
    for (const service of SERVICES) {
        await checkService(service);
    }
}

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        monitor: 'External Keep-Alive',
        status: 'running',
        services: SERVICES.length,
        timestamp: new Date().toISOString()
    });
});

// Start monitoring
startMonitoring();

app.listen(PORT, () => {
    console.log(`🌐 External monitor running on port ${PORT}`);
});
