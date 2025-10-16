// Test script to check what the API actually returns
const http = require('http');

async function testAPI() {
  try {
    const userId = 157; // Your user ID
    const timestamp = Date.now();
    const path = `/api/pre-assessment-results/user/${userId}?_t=${timestamp}`;
    
    console.log('🔍 Fetching from: http://localhost:4000' + path);
    console.log('');
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const jsonData = JSON.parse(data);
        
        console.log('📦 API Response received');
        console.log('Success:', jsonData.success);
        console.log('Results count:', jsonData.results?.length || 0);
        console.log('Timestamp:', jsonData.timestamp ? new Date(jsonData.timestamp).toLocaleString() : 'N/A');
        console.log('');
        
        if (jsonData.results && jsonData.results.length > 0) {
          const result = jsonData.results[0];
          console.log('📊 First Result:');
          console.log('  Score:', `${result.correct_answers}/${result.total_questions} (${result.percentage}%)`);
          console.log('  Answers type:', typeof result.answers);
          console.log('  Answers is array:', Array.isArray(result.answers));
          
          if (result.answers) {
            const answers = typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers;
            console.log('  Answers length:', answers.length);
            console.log('');
            console.log('📝 First Answer:');
            console.log(JSON.stringify(answers[0], null, 2));
            console.log('');
            
            // Count by subject
            const subjectCounts = {};
            answers.forEach(answer => {
              const subjectId = answer.subject_id;
              const subjectName = answer.subject_name || 'Unknown';
              
              if (!subjectCounts[subjectId]) {
                subjectCounts[subjectId] = {
                  name: subjectName,
                  total: 0,
                  correct: 0
                };
              }
              
              subjectCounts[subjectId].total++;
              if (answer.is_correct) {
                subjectCounts[subjectId].correct++;
              }
            });
            
            console.log('📊 Breakdown by Subject (from API):');
            Object.entries(subjectCounts).forEach(([id, data]) => {
              console.log(`  ${data.name}: ${data.correct}/${data.total} correct`);
            });
          }
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
    });
    
    req.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
