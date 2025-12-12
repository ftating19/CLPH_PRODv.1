// Recommendation logic for tutors
const getRecommendedTutors = async (pool, userId, limit = 5) => {
  // Get student's weak subjects from pre-assessment results
  const [weakSubjects] = await pool.query(`
    SELECT subject_id
    FROM pre_assessment_results
    WHERE user_id = ? AND percentage < 82.5
  `, [userId]);

  const weakSubjectIds = weakSubjects.map(s => s.subject_id);

  // Get all approved tutors
  const [tutors] = await pool.query(`
    SELECT 
      t.*, 
      COALESCE(t.ratings, 0) as avg_rating
    FROM tutors t
    WHERE t.status = 'approved'
  `);

  // Score tutors: subject match (40%), rating (60%)
  const scoredTutors = tutors.map(tutor => {
    let score = 0;
    // Subject match
    if (weakSubjectIds.includes(tutor.subject_id)) score += 40;
    // Ratings (out of 5)
    score += (parseFloat(tutor.avg_rating) / 5) * 60;
    return { ...tutor, score };
  });

  // Sort by score descending and return top N
  scoredTutors.sort((a, b) => b.score - a.score);
  return scoredTutors.slice(0, limit);
};

module.exports = { getRecommendedTutors };