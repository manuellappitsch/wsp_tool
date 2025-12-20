
import 'dotenv/config'

const PROJECT_REF = 'dylocjiremrejotlrwdo';
const PAT = 'sb_secret_ysTTNtT2cgdOWCfoV45oHA_3E1sU51T'; // Hardcoded from history

async function testManagementApi() {
    console.log("Testing Management API with PAT...");

    // Try to get project details
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${PAT}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        console.log("✅ Management API Access Confirmed!");
        const data = await response.json();
        console.log("Project Status:", data.status);
        console.log("Database Host:", data.database?.host); // Might reveal helpful info
    } else {
        console.log(`❌ Management API Failed: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log("Body:", text);
    }
}

testManagementApi();
