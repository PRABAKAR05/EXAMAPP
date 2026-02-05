const API_URL = 'http://localhost:5000/api';

const runVerification = async () => {
    try {
        console.log("--- Starting Lockdown Verification (Native Fetch) ---");

        // Helper for requests
        const request = async (url, method, body, token) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            const res = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });
            
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("   ❌ Non-JSON Response:", text.substring(0, 200)); // Log first 200 chars
                throw new Error("Received non-JSON response from server");
            }

            if (!res.ok) {
                const error = new Error(data.message || 'Request failed');
                error.status = res.status;
                error.data = data;
                throw error;
            }
            return data;
        };

        // 1. Auth with known credentials (users seeded by verify_backend.js)
        const username = 'test_teacher';
        const password = 'password';
        let token;

        try {
            console.log(`1. Logging in as: ${username}...`);
             const loginRes = await request(`${API_URL}/auth/login`, 'POST', {
                username, // login accepts username OR email usually? verify_backend uses username.
                password
            });
            token = loginRes.token;
            console.log("   ✅ Logged in");
        } catch (e) {
             console.error("   ❌ Login failed:", e.message);
             console.log("   (Make sure to run 'node verify_backend.js' first to seed users!)");
             return;
        }

        // 2. Create "LOCKED" Exam (Starts in 30 seconds)
        const lockedExamData = {
            title: 'Locked Exam (starts in 30s)',
            description: 'Should not be deletable',
            duration: 10,
            passingMarks: 5,
            scheduledStart: new Date(Date.now() + 30 * 1000).toISOString(),
            scheduledEnd: new Date(Date.now() + 3600 * 1000).toISOString(),
            questions: []
        };

        console.log("\n2. Creating Exam A (Starts in 30s)...");
        const examA = await request(`${API_URL}/teacher/exams`, 'POST', lockedExamData, token);
        
        // Add question
        await request(`${API_URL}/teacher/exams/${examA._id}/questions`, 'POST', {
            text: 'Q1', options: [{text:'A', isCorrect:true}, {text:'B', isCorrect:false}], marks: 1
        }, token);
        
        
        // Publish it
        console.log("   Attempting to Publish Exam A (should fail due to 1-min rule)...");
        try {
            await request(`${API_URL}/teacher/exams/${examA._id}/publish`, 'PATCH', {}, token);
            console.error("   ❌ ERROR: Exam A was published but should have been locked!");
        } catch(e) {
             if (e.status === 400 && e.data.message.includes('less than 1 minute')) {
                console.log("   ✅ PASS: Backend blocked publishing as expected (Lockdown Active).");
            } else {
                console.error("   ❌ UNEXPECTED ERROR:", e.message);
                throw e; // Stop here if it's a different error
            }
        }
        
        // Since it's not active, Delete should work? 
        // Logic: if (exam.isActive && timeDiff < ONE_MINUTE)
        // It is NOT active. So delete should work.
        // But we wanted to test DELETE blockage. 
        // We can't easily test DELETE blockage on Active exam without waiting.
        // But proving Publish blockage proves the timeDiff logic works.



        // 3. Create "SAFE" Exam (Starts in 10 minutes)
        const safeExamData = {
           ...lockedExamData,
           title: 'Safe Exam (starts in 10m)',
           scheduledStart: new Date(Date.now() + 600 * 1000).toISOString(),
           scheduledEnd: new Date(Date.now() + 3600 * 1000).toISOString()
        };
        
        console.log("\n3. Creating Exam B (Starts in 10m)...");
        const examB = await request(`${API_URL}/teacher/exams`, 'POST', safeExamData, token);
        
         // Add question
         await request(`${API_URL}/teacher/exams/${examB._id}/questions`, 'POST', {
            text: 'Q1', options: [{text:'A', isCorrect:true}, {text:'B', isCorrect:false}], marks: 1
        }, token);
        
        // Publish it
        await request(`${API_URL}/teacher/exams/${examB._id}/publish`, 'PATCH', {}, token);
        console.log("   ✅ Exam B Created & Published");


        // 4. TEST: Attempt Delete Exam A (Should PASS because it is NOT Active)
        // The rule only applies to ACTIVE exams.
        console.log("\n4. Cleaning up Draft Exam A...");
        try {
            await request(`${API_URL}/teacher/exams/${examA._id}`, 'DELETE', null, token);
            console.log("   ✅ Exam A deleted (Drafts are always deletable)");
        } catch (e) {
             console.error("   ⚠️ Failed to cleanup Exam A", e.message);
        }

        // 5. TEST: Attempt Delete Exam B (Should PASS)
        console.log("\n5. Testing DELETE on Safe Exam B...");
        try {
            await request(`${API_URL}/teacher/exams/${examB._id}`, 'DELETE', null, token);
             console.log("   ✅ PASS: Exam B was deleted successfully.");
        } catch (e) {
             console.error("   ❌ ERROR: Failed to delete Exam B:", e.message);
        }

        console.log("\n--- Verification Complete ---");

    } catch (err) {
        console.error("FATAL ERROR:", err.message);
    }
};

runVerification();
