// Script to check pre-assessment data in database
const db = require('./dbconnection/mysql');

async function checkAssessmentData() {
  try {
    // Connect to database first
    await db.connect();
    const pool = await db.getPool();
    
    console.log('\n=== Checking Pre-Assessment Results ===\n');
    
    // Get all results
    const [results] = await pool.query(`
      SELECT 
        par.id,
        par.user_id,
        par.pre_assessment_id,
        par.score,
        par.total_points,
        par.percentage,
        par.correct_answers,
        par.total_questions,
        par.answers,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        pa.title as assessment_title
      FROM pre_assessment_results par
      LEFT JOIN users u ON par.user_id = u.user_id
      LEFT JOIN pre_assessments pa ON par.pre_assessment_id = pa.id
      ORDER BY par.completed_at DESC
      LIMIT 5
    `);
    
    console.log(`Found ${results.length} recent results:\n`);
    
    results.forEach((result, index) => {
      console.log(`\n--- Result #${index + 1} ---`);
      console.log(`User: ${result.user_name} (ID: ${result.user_id})`);
      console.log(`Assessment: ${result.assessment_title}`);
      console.log(`Score: ${result.correct_answers}/${result.total_questions} (${result.percentage}%)`);
      console.log(`Points: ${result.score}/${result.total_points}`);
      
      if (result.answers) {
        let answers;
        try {
          // Handle double-stringified JSON
          answers = result.answers;
          if (typeof answers === 'string') {
            answers = JSON.parse(answers);
          }
          if (typeof answers === 'string') {
            answers = JSON.parse(answers); // Parse again if still a string
          }
          
          console.log(`\nAnswers Array Length: ${Array.isArray(answers) ? answers.length : 'NOT AN ARRAY'}`);
          console.log(`Answers type: ${typeof answers}`);
          
          // Check what fields exist in the first answer
          if (Array.isArray(answers) && answers.length > 0) {
            console.log(`\nFirst Answer Structure:`);
            console.log(JSON.stringify(answers[0], null, 2));
            
            console.log(`\n🔍 Checking fields in first answer:`);
            console.log(`  - Has question_id: ${answers[0].hasOwnProperty('question_id') ? 'YES ✅' : 'NO ❌'}`);
            console.log(`  - Has questionId: ${answers[0].hasOwnProperty('questionId') ? 'YES ✅' : 'NO ❌'}`);
            console.log(`  - Has subject_id: ${answers[0].hasOwnProperty('subject_id') ? 'YES ✅' : 'NO ❌'}`);
            console.log(`  - Has is_correct: ${answers[0].hasOwnProperty('is_correct') ? 'YES ✅' : 'NO ❌'}`);
            console.log(`  - Has user_answer: ${answers[0].hasOwnProperty('user_answer') ? 'YES ✅' : 'NO ❌'}`);
            console.log(`  - Has answer: ${answers[0].hasOwnProperty('answer') ? 'YES ✅' : 'NO ❌'}`);
            
            // Count by subject
            const subjectCounts = {};
            answers.forEach(ans => {
              const subjectId = ans.subject_id;
              const subjectName = ans.subject_name || 'Unknown';
              
              if (!subjectCounts[subjectId]) {
                subjectCounts[subjectId] = {
                  name: subjectName,
                  total: 0,
                  correct: 0
                };
              }
              
              subjectCounts[subjectId].total++;
              if (ans.is_correct) {
                subjectCounts[subjectId].correct++;
              }
            });
            
            console.log(`\nBreakdown by Subject:`);
            Object.entries(subjectCounts).forEach(([subjectId, data]) => {
              console.log(`  ${data.name}: ${data.correct}/${data.total} correct`);
            });
          }
        } catch (e) {
          console.log(`Error parsing answers: ${e.message}`);
          console.log(`Raw answers (first 200 chars): ${JSON.stringify(result.answers).substring(0, 200)}`);
        }
      } else {
        console.log(`No answers data stored`);
      }
    });
    
    console.log('\n=== End of Report ===\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking assessment data:', error);
    process.exit(1);
  }
}

checkAssessmentData();
