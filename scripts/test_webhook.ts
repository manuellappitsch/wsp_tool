
async function testApi() {
    const token = "MeinGeheimerToken1234!"; // Trying the one I suggested in existing docs (Wait, docs said 1234!)
    // Docs said: MeinGeheimerToken1234!

    const payload = {
        email: "lukas.weber@example.com", // Dummy email for test
        firstName: "Lukas",
        lastName: "Weber",
        addCredits: 20
    };

    try {
        const response = await fetch(`http://localhost:3001/api/webhooks/crm?token=${token}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testApi();
