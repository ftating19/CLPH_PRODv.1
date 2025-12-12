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

  // Filter tutors who match weak subjects
  const subjectMatchedTutors = tutors.filter(tutor => weakSubjectIds.includes(tutor.subject_id));

  // Score tutors: subject match (100% since all match), rating (sort by rating)
  const scoredTutors = subjectMatchedTutors.map(tutor => {
    let score = 0;
    // All match subject, so score is based on rating only
    score += (parseFloat(tutor.avg_rating) / 5) * 100;
    return { ...tutor, score };
  });

  // Prioritize 5-star tutors first
  const fiveStarTutors = scoredTutors.filter(tutor => parseFloat(tutor.avg_rating) >= 5);
  const otherTutors = scoredTutors.filter(tutor => parseFloat(tutor.avg_rating) < 5);

  // Sort both groups by score descending
  fiveStarTutors.sort((a, b) => b.score - a.score);
  otherTutors.sort((a, b) => b.score - a.score);

  // Combine, prioritizing 5-star tutors, then others, up to limit
  const recommended = [...fiveStarTutors, ...otherTutors].slice(0, limit);
  return recommended;
};

module.exports = { getRecommendedTutors };