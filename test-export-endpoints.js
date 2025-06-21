const axios = require('axios');
const fs = require('fs');

async function testExportEndpoints() {
    const baseURL = 'http://localhost:4000/api';
    
    // First, let's try to get a valid token by creating one manually
    // In a real scenario, you'd login to get this token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ 
        teacherId: '507f1f77bcf86cd799439011', 
        role: 'admin' 
    }, 'qatarSTSS2024');
    
    console.log('🔐 Generated test token');
    
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    const exportTypes = ['students', 'competitions', 'registrations', 'teachers', 'comprehensive'];
    
    for (const type of exportTypes) {
        try {
            console.log(`\n🔄 Testing ${type} export...`);
            
            const response = await axios.get(`${baseURL}/reports/export/${type}`, {
                headers,
                timeout: 30000
            });
            
            console.log(`✅ ${type} export status:`, response.status);
            console.log(`📊 ${type} export data length:`, response.data.length);
            console.log(`📄 ${type} export preview:`, response.data.substring(0, 200) + '...');
            
            // Save to file for inspection
            fs.writeFileSync(`./test_${type}_export.csv`, response.data);
            console.log(`💾 Saved to test_${type}_export.csv`);
            
        } catch (error) {
            console.error(`❌ Error testing ${type} export:`, {
                status: error.response?.status,
                message: error.message,
                data: error.response?.data
            });
        }
    }
}

testExportEndpoints().catch(console.error);
