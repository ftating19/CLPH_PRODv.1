// Test script for tutor pre-assessment endpoints
const axios = require('axios');

const BASE_URL = 'https://api.cictpeerlearninghub.com/api';

// Test data
const testPreAssessment = {
  title: 'Math Tutor Assessment',
  description: 'Assessment for prospective math tutors',
  created_by: 1, // Assuming user ID 1 exists
  program: 'BSIT',
  year_level: '3rd Year',
  duration: 45,
  duration_unit: 'minutes',
  difficulty: 'Medium'
};

const testQuestions = [
  {
    question_text: 'What is 2 + 2?',
    question_type: 'multiple-choice',
    options: ['3', '4', '5', '6'],
    correct_answer: '4',
    explanation: 'Basic addition: 2 + 2 = 4',
    points: 1,
    difficulty: 'Easy'
  },
  {
    question_text: 'Explain the Pythagorean theorem.',
    question_type: 'essay',
    correct_answer: 'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.',
    explanation: 'This is a fundamental theorem in geometry.',
    points: 3,
    difficulty: 'Medium'
  }
];

async function testTutorPreAssessmentEndpoints() {
  console.log('🧪 Testing Tutor Pre-Assessment Endpoints...\n');

  try {
    // Test 1: Create tutor pre-assessment
    console.log('1️⃣ Testing CREATE tutor pre-assessment...');
    const createResponse = await axios.post(`${BASE_URL}/tutor-pre-assessments`, testPreAssessment);
    
    if (createResponse.data.success) {
      console.log('✅ Created tutor pre-assessment:', createResponse.data.preAssessment.title);
      const assessmentId = createResponse.data.preAssessment.id;

      // Test 2: Get tutor pre-assessment by ID
      console.log('\n2️⃣ Testing GET tutor pre-assessment by ID...');
      const getResponse = await axios.get(`${BASE_URL}/tutor-pre-assessments/${assessmentId}`);
      
      if (getResponse.data.success) {
        console.log('✅ Retrieved tutor pre-assessment:', getResponse.data.preAssessment.title);
      }

      // Test 3: Get all tutor pre-assessments
      console.log('\n3️⃣ Testing GET all tutor pre-assessments...');
      const getAllResponse = await axios.get(`${BASE_URL}/tutor-pre-assessments`);
      
      if (getAllResponse.data.success) {
        console.log(`✅ Retrieved ${getAllResponse.data.total} tutor pre-assessments`);
      }

      // Test 4: Create questions for the assessment
      console.log('\n4️⃣ Testing CREATE questions (bulk)...');
      const questionsResponse = await axios.post(`${BASE_URL}/tutor-pre-assessment-questions/bulk`, {
        pre_assessment_id: assessmentId,
        questions: testQuestions
      });
      
      if (questionsResponse.data.success) {
        console.log(`✅ Created ${questionsResponse.data.total} questions`);

        // Test 5: Get questions for the assessment
        console.log('\n5️⃣ Testing GET questions for assessment...');
        const getQuestionsResponse = await axios.get(`${BASE_URL}/tutor-pre-assessment-questions/pre-assessment/${assessmentId}`);
        
        if (getQuestionsResponse.data.success) {
          console.log(`✅ Retrieved ${getQuestionsResponse.data.total} questions`);
        }
      }

      // Test 6: Update tutor pre-assessment
      console.log('\n6️⃣ Testing UPDATE tutor pre-assessment...');
      const updateData = {
        ...testPreAssessment,
        title: 'Updated Math Tutor Assessment',
        difficulty: 'Hard'
      };
      
      const updateResponse = await axios.put(`${BASE_URL}/tutor-pre-assessments/${assessmentId}`, updateData);
      
      if (updateResponse.data.success) {
        console.log('✅ Updated tutor pre-assessment:', updateResponse.data.preAssessment.title);
      }

      // Test 7: Get by program
      console.log('\n7️⃣ Testing GET by program...');
      const programResponse = await axios.get(`${BASE_URL}/tutor-pre-assessments/program/BSIT`);
      
      if (programResponse.data.success) {
        console.log(`✅ Found ${programResponse.data.total} assessments for BSIT program`);
      }

      // Test 8: Get by year level
      console.log('\n8️⃣ Testing GET by year level...');
      const yearResponse = await axios.get(`${BASE_URL}/tutor-pre-assessments/year-level/3rd%20Year`);
      
      if (yearResponse.data.success) {
        console.log(`✅ Found ${yearResponse.data.total} assessments for 3rd Year`);
      }

      // Test 9: Delete tutor pre-assessment (cleanup)
      console.log('\n9️⃣ Testing DELETE tutor pre-assessment...');
      const deleteResponse = await axios.delete(`${BASE_URL}/tutor-pre-assessments/${assessmentId}`);
      
      if (deleteResponse.data.success) {
        console.log('✅ Deleted tutor pre-assessment');
      }

      console.log('\n🎉 All tests completed successfully!');
      
    } else {
      console.error('❌ Failed to create tutor pre-assessment');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n📝 Make sure the backend server is running on port 3000');
    }
  }
}

// Run tests
testTutorPreAssessmentEndpoints();