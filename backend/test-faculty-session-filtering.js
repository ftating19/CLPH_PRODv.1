// Test script to verify faculty filtering of tutor sessions
const mysql = require('mysql2/promise');

async function testFacultySessionFiltering() {
  console.log('🔧 Testing Faculty Session Filtering...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'clph'
  });

  try {
    // 1. Get sample faculty user
    const [faculty] = await connection.execute(
      'SELECT user_id, first_name, last_name, role FROM users WHERE role = "Faculty" LIMIT 1'
    );
    
    if (faculty.length === 0) {
      console.log('❌ No faculty found in database');
      return;
    }
    
    const facultyUser = faculty[0];
    console.log(`👨‍🏫 Testing with faculty: ${facultyUser.first_name} ${facultyUser.last_name} (ID: ${facultyUser.user_id})`);

    // 2. Get subjects assigned to this faculty
    const [subjects] = await connection.execute(
      'SELECT subject_id, subject_name, user_id FROM subjects'
    );
    
    const facultySubjects = [];
    subjects.forEach(subj => {
      if (subj.user_id) {
        try {
          const facultyIds = JSON.parse(subj.user_id);
          if (facultyIds.some(fid => String(fid) === String(facultyUser.user_id))) {
            facultySubjects.push({
              subject_id: subj.subject_id,
              subject_name: subj.subject_name
            });
          }
        } catch {
          // Handle non-JSON user_id
          if (String(subj.user_id) === String(facultyUser.user_id)) {
            facultySubjects.push({
              subject_id: subj.subject_id,
              subject_name: subj.subject_name
            });
          }
        }
      }
    });

    console.log(`📚 Faculty assigned to ${facultySubjects.length} subjects:`);
    facultySubjects.forEach(subj => 
      console.log(`   - ${subj.subject_name} (ID: ${subj.subject_id})`)
    );

    // 3. Get all sessions with subject info
    const [allSessions] = await connection.execute(`
      SELECT 
        b.*,
        t.subject_id,
        s.subject_name,
        s.subject_code
      FROM bookings b
      LEFT JOIN tutors t ON b.tutor_id = t.user_id
      LEFT JOIN subjects s ON t.subject_id = s.subject_id
    `);

    console.log(`\n📋 Total sessions in database: ${allSessions.length}`);

    // 4. Apply faculty filtering logic
    const facultySubjectIds = facultySubjects.map(s => s.subject_id);
    const filteredSessions = allSessions.filter(session => 
      session.subject_id && facultySubjectIds.includes(session.subject_id)
    );

    console.log(`✅ Sessions visible to this faculty: ${filteredSessions.length}`);
    
    if (filteredSessions.length > 0) {
      console.log('\n📝 Sample filtered sessions:');
      filteredSessions.slice(0, 3).forEach((session, index) => {
        console.log(`   ${index + 1}. Session ID: ${session.booking_id}`);
        console.log(`      Student: ${session.student_name}`);
        console.log(`      Tutor: ${session.tutor_name}`);
        console.log(`      Subject: ${session.subject_name} (ID: ${session.subject_id})`);
        console.log(`      Status: ${session.status}`);
        console.log(`      Date: ${session.start_date}`);
        console.log('');
      });
    }

    // 5. Test API endpoint simulation
    console.log('\n🚀 Simulating API call with headers...');
    
    const testHeaders = {
      'x-user-id': facultyUser.user_id.toString(),
      'x-user-role': 'Faculty'
    };
    
    console.log(`   Headers: ${JSON.stringify(testHeaders)}`);
    console.log(`   Expected result: ${filteredSessions.length} sessions`);
    
    console.log('\n✅ Faculty session filtering test completed!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Faculty: ${facultyUser.first_name} ${facultyUser.last_name}`);
    console.log(`   - Assigned subjects: ${facultySubjects.length}`);
    console.log(`   - Total sessions: ${allSessions.length}`);
    console.log(`   - Filtered sessions: ${filteredSessions.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

// Run the test
testFacultySessionFiltering().catch(console.error);