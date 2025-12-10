# Quick Start: Implementing Top 3 Recommended Features

## 🎯 Feature 1: Notification Center (2 weeks)

### Database Schema
```sql
-- notifications table
CREATE TABLE notifications (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'post_test_assigned', 'session_reminder', 'forum_reply', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500), -- URL to relevant page
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- notification_preferences table
CREATE TABLE notification_preferences (
  preference_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  post_test_assigned BOOLEAN DEFAULT TRUE,
  session_reminders BOOLEAN DEFAULT TRUE,
  forum_replies BOOLEAN DEFAULT TRUE,
  new_materials BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

### Backend API Endpoints
```javascript
// backend/routes/notifications.js
const express = require('express');
const router = express.Router();

// Get user notifications
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { unread } = req.query; // optional filter
  
  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  if (unread === 'true') {
    query += ' AND is_read = FALSE';
  }
  query += ' ORDER BY created_at DESC LIMIT 50';
  
  const notifications = await db.query(query, [userId]);
  res.json({ notifications });
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  const { notificationId } = req.params;
  await db.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = ?', [notificationId]);
  res.json({ success: true });
});

// Mark all as read
router.put('/user/:userId/read-all', async (req, res) => {
  const { userId } = req.params;
  await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
  res.json({ success: true });
});

// Create notification (internal use)
async function createNotification(userId, type, title, message, link) {
  await db.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, message, link]
  );
}

module.exports = { router, createNotification };
```

### Frontend Component
```tsx
// frontend/components/notifications/notification-bell.tsx
"use client"
import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/contexts/UserContext"

export default function NotificationBell() {
  const { currentUser } = useUser()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!currentUser?.user_id) return
    
    fetchNotifications()
    
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [currentUser])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`https://api.cictpeerlearninghub.com/api/notifications/user/${currentUser.user_id}`)
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.notifications?.filter(n => !n.is_read).length || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`https://api.cictpeerlearninghub.com/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`https://api.cictpeerlearninghub.com/api/notifications/user/${currentUser.user_id}/read-all`, {
        method: 'PUT'
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No notifications
              </p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.notification_id}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-accent ${
                    !notif.is_read ? 'bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notif.notification_id)
                    if (notif.link) window.location.href = notif.link
                  }}
                >
                  <div className="font-medium text-sm">{notif.title}</div>
                  <div className="text-xs text-muted-foreground">{notif.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### Integration Points
Add notification creation to existing features:
```javascript
// When post-test is assigned
await createNotification(
  studentId,
  'post_test_assigned',
  'New Post-Test Assigned',
  `${tutorName} assigned you a post-test: ${testTitle}`,
  '/manage-post-test'
);

// 1 hour before session
await createNotification(
  studentId,
  'session_reminder',
  'Upcoming Session',
  `Your tutoring session starts in 1 hour`,
  '/tutor-matching'
);
```

---

## 🎮 Feature 2: Gamification System (2-3 weeks)

### Database Schema
```sql
-- user_points table
CREATE TABLE user_points (
  point_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  points INT NOT NULL,
  reason VARCHAR(100) NOT NULL,
  related_id INT, -- ID of quiz, forum post, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- user_achievements table
CREATE TABLE user_achievements (
  achievement_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  badge_type VARCHAR(50) NOT NULL, -- 'first_quiz', 'perfect_score', '7_day_streak', etc.
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_badge (user_id, badge_type)
);

-- user_streaks table
CREATE TABLE user_streaks (
  user_id INT PRIMARY KEY,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- badge definitions (static data)
CREATE TABLE badge_definitions (
  badge_type VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- emoji or icon name
  points_reward INT DEFAULT 0
);

-- Insert badge definitions
INSERT INTO badge_definitions VALUES
('first_quiz', 'First Steps', 'Completed your first quiz', '🎯', 50),
('perfect_score', 'Perfect!', 'Got 100% on a quiz', '💯', 100),
('discussion_starter', 'Discussion Starter', 'Posted your first forum topic', '💬', 25),
('helpful_tutor', 'Helpful Tutor', 'Received a 5-star rating', '⭐', 50),
('7_day_streak', 'Week Warrior', 'Maintained a 7-day streak', '🔥', 100),
('30_day_streak', 'Month Master', 'Maintained a 30-day streak', '💎', 500),
('subject_master', 'Subject Master', 'Scored 100% on pre-assessment subject', '🎓', 200);
```

### Backend API
```javascript
// backend/services/gamification.js
async function awardPoints(userId, points, reason, relatedId = null) {
  await db.query(
    'INSERT INTO user_points (user_id, points, reason, related_id) VALUES (?, ?, ?, ?)',
    [userId, points, reason, relatedId]
  );
  
  // Check for achievements
  await checkAchievements(userId);
}

async function checkAchievements(userId) {
  // Check quiz-related achievements
  const quizAttempts = await db.query(
    'SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ?',
    [userId]
  );
  
  if (quizAttempts[0].count === 1) {
    await awardBadge(userId, 'first_quiz');
  }
  
  const perfectScores = await db.query(
    'SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ? AND score = 100',
    [userId]
  );
  
  if (perfectScores[0].count > 0) {
    await awardBadge(userId, 'perfect_score');
  }
  
  // Check streak achievements
  const streak = await db.query(
    'SELECT current_streak FROM user_streaks WHERE user_id = ?',
    [userId]
  );
  
  if (streak[0]?.current_streak >= 7) {
    await awardBadge(userId, '7_day_streak');
  }
  
  if (streak[0]?.current_streak >= 30) {
    await awardBadge(userId, '30_day_streak');
  }
}

async function awardBadge(userId, badgeType) {
  try {
    await db.query(
      'INSERT IGNORE INTO user_achievements (user_id, badge_type) VALUES (?, ?)',
      [userId, badgeType]
    );
    
    // Award bonus points
    const badge = await db.query(
      'SELECT points_reward FROM badge_definitions WHERE badge_type = ?',
      [badgeType]
    );
    
    if (badge[0]?.points_reward > 0) {
      await awardPoints(userId, badge[0].points_reward, `Badge: ${badgeType}`);
    }
    
    // Send notification
    await createNotification(
      userId,
      'achievement_earned',
      'New Achievement!',
      `You earned the ${badgeType} badge!`,
      '/profile'
    );
  } catch (error) {
    console.error('Error awarding badge:', error);
  }
}

async function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0];
  
  const streak = await db.query(
    'SELECT * FROM user_streaks WHERE user_id = ?',
    [userId]
  );
  
  if (streak.length === 0) {
    // First activity
    await db.query(
      'INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES (?, 1, 1, ?)',
      [userId, today]
    );
  } else {
    const lastDate = new Date(streak[0].last_activity_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Same day, no update
      return;
    } else if (diffDays === 1) {
      // Consecutive day
      const newStreak = streak[0].current_streak + 1;
      const longestStreak = Math.max(newStreak, streak[0].longest_streak);
      
      await db.query(
        'UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ? WHERE user_id = ?',
        [newStreak, longestStreak, today, userId]
      );
      
      await checkAchievements(userId);
    } else {
      // Streak broken
      await db.query(
        'UPDATE user_streaks SET current_streak = 1, last_activity_date = ? WHERE user_id = ?',
        [today, userId]
      );
    }
  }
}

module.exports = { awardPoints, awardBadge, updateStreak, checkAchievements };
```

### Integration into Existing Features
```javascript
// After quiz completion
const { awardPoints, updateStreak } = require('./services/gamification');

router.post('/quiz-attempts', async (req, res) => {
  // ... save quiz attempt ...
  
  // Award points based on score
  if (score >= 80) {
    await awardPoints(userId, 50, 'Quiz completion', quizId);
  }
  if (score === 100) {
    await awardPoints(userId, 50, 'Perfect score bonus', quizId);
  }
  
  await updateStreak(userId);
  
  res.json({ success: true });
});

// After creating forum post
router.post('/forums', async (req, res) => {
  // ... create forum post ...
  
  await awardPoints(userId, 25, 'Forum post', forumId);
  await updateStreak(userId);
  
  res.json({ success: true });
});
```

### Frontend Components
```tsx
// frontend/components/gamification/points-display.tsx
export function PointsDisplay({ userId }: { userId: number }) {
  const [totalPoints, setTotalPoints] = useState(0)
  
  useEffect(() => {
    fetch(`https://api.cictpeerlearninghub.com/api/gamification/points/${userId}`)
      .then(res => res.json())
      .then(data => setTotalPoints(data.total))
  }, [userId])
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">
        💎 {totalPoints} points
      </Badge>
    </div>
  )
}

// frontend/components/gamification/badges-display.tsx
export function BadgesDisplay({ userId }: { userId: number }) {
  const [badges, setBadges] = useState([])
  
  useEffect(() => {
    fetch(`https://api.cictpeerlearninghub.com/api/gamification/badges/${userId}`)
      .then(res => res.json())
      .then(data => setBadges(data.badges))
  }, [userId])
  
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(badge => (
        <Badge key={badge.badge_type} className="text-lg">
          {badge.icon} {badge.name}
        </Badge>
      ))}
    </div>
  )
}

// frontend/components/gamification/streak-display.tsx
export function StreakDisplay({ userId }: { userId: number }) {
  const [streak, setStreak] = useState(0)
  
  useEffect(() => {
    fetch(`https://api.cictpeerlearninghub.com/api/gamification/streak/${userId}`)
      .then(res => res.json())
      .then(data => setStreak(data.current_streak))
  }, [userId])
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">🔥</span>
      <div>
        <div className="font-bold">{streak} Day Streak</div>
        <div className="text-xs text-muted-foreground">Keep it up!</div>
      </div>
    </div>
  )
}
```

---

## 🤖 Feature 3: Smart Tutor Recommendations (3-4 weeks)

### Database Enhancement
```sql
-- Add specialization tracking
ALTER TABLE tutors ADD COLUMN specializations JSON;

-- Track booking success metrics
CREATE TABLE booking_outcomes (
  outcome_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  tutor_id INT NOT NULL,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  rating INT,
  feedback TEXT,
  completion_status ENUM('completed', 'cancelled', 'no_show') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- Store student weak areas from assessments
CREATE TABLE student_weak_subjects (
  user_id INT,
  subject_id INT,
  performance_score DECIMAL(5,2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, subject_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
);
```

### Recommendation Algorithm
```javascript
// backend/services/recommendations.js
async function getRecommendedTutors(userId, limit = 5) {
  // Get student's weak subjects from assessments
  const weakSubjects = await db.query(`
    SELECT subject_id, performance_score 
    FROM student_weak_subjects 
    WHERE user_id = ? 
    ORDER BY performance_score ASC 
    LIMIT 3
  `, [userId]);
  
  const weakSubjectIds = weakSubjects.map(s => s.subject_id);
  
  // Get all tutors with their metrics
  const tutors = await db.query(`
    SELECT 
      t.*,
      AVG(f.rating) as avg_rating,
      COUNT(DISTINCT b.booking_id) as total_bookings,
      COUNT(DISTINCT CASE WHEN bo.completion_status = 'completed' THEN bo.outcome_id END) as successful_bookings
    FROM tutors t
    LEFT JOIN feedback_ratings f ON t.tutor_id = f.tutor_id
    LEFT JOIN bookings b ON t.tutor_id = b.tutor_id
    LEFT JOIN booking_outcomes bo ON b.booking_id = bo.booking_id
    GROUP BY t.tutor_id
  `);
  
  // Score each tutor
  const scoredTutors = tutors.map(tutor => {
    let score = 0;
    
    // Factor 1: Specialization match (40%)
    const tutorSpecializations = JSON.parse(tutor.specializations || '[]');
    const matchingSubjects = tutorSpecializations.filter(s => 
      weakSubjectIds.includes(s)
    ).length;
    score += (matchingSubjects / Math.max(weakSubjectIds.length, 1)) * 40;
    
    // Factor 2: Rating (30%)
    score += ((tutor.avg_rating || 0) / 5) * 30;
    
    // Factor 3: Availability (20%)
    const availabilityScore = tutor.is_available ? 20 : 0;
    score += availabilityScore;
    
    // Factor 4: Success rate (10%)
    const successRate = tutor.total_bookings > 0
      ? (tutor.successful_bookings / tutor.total_bookings) * 10
      : 5; // neutral score for new tutors
    score += successRate;
    
    return {
      ...tutor,
      recommendation_score: score,
      matching_subjects: matchingSubjects
    };
  });
  
  // Sort by score and return top N
  return scoredTutors
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, limit);
}

module.exports = { getRecommendedTutors };
```

### Frontend Integration
```tsx
// In tutor-matching.tsx, add a new section
const [recommendedTutors, setRecommendedTutors] = useState([])

useEffect(() => {
  if (!currentUser?.user_id) return
  
  fetch(`https://api.cictpeerlearninghub.com/api/recommendations/tutors/${currentUser.user_id}`)
    .then(res => res.json())
    .then(data => setRecommendedTutors(data.tutors))
}, [currentUser])

// Display section
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Target className="w-5 h-5" />
      Recommended For You
    </CardTitle>
    <CardDescription>
      Based on your assessment results and learning needs
    </CardDescription>
  </CardHeader>
  <CardContent>
    {recommendedTutors.map(tutor => (
      <div key={tutor.tutor_id} className="border-b pb-3 mb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{tutor.name}</h3>
            <div className="text-sm text-muted-foreground">
              {tutor.specializations.join(', ')}
            </div>
            {tutor.matching_subjects > 0 && (
              <Badge variant="secondary" className="mt-2">
                Matches {tutor.matching_subjects} of your weak areas
              </Badge>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{tutor.avg_rating?.toFixed(1)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {tutor.total_bookings} sessions
            </div>
          </div>
        </div>
      </div>
    ))}
  </CardContent>
</Card>
```

---

## 🚀 Implementation Checklist

### Week 1: Notification Center
- [ ] Create database tables
- [ ] Create backend API endpoints
- [ ] Create notification bell component
- [ ] Integrate with existing features
- [ ] Test notification creation
- [ ] Test notification display
- [ ] Deploy to production

### Week 2-3: Gamification
- [ ] Create database tables
- [ ] Insert badge definitions
- [ ] Create gamification service
- [ ] Integrate point awards into features
- [ ] Create frontend components
- [ ] Add to dashboard and user profile
- [ ] Test achievement unlocking
- [ ] Test streak tracking
- [ ] Deploy to production

### Week 3-4: Smart Recommendations
- [ ] Enhance database schema
- [ ] Create recommendation algorithm
- [ ] Create API endpoint
- [ ] Update tutor matching page
- [ ] Add to dashboard
- [ ] Test with various user scenarios
- [ ] Fine-tune scoring weights
- [ ] Deploy to production

---

## 📊 Testing Scenarios

### Notification Center
1. Create a post-test as tutor → Student should receive notification
2. Book a session → Should get reminder 1 hour before
3. Reply to forum post → Original poster should get notification
4. Mark notification as read → Should update UI
5. Click notification → Should navigate to correct page

### Gamification
1. Complete first quiz → Should earn "First Steps" badge + points
2. Get 100% on quiz → Should earn "Perfect!" badge + bonus points
3. Login 7 days in a row → Should earn "Week Warrior" badge
4. Break streak → Streak should reset to 1
5. Post in forum → Should earn 25 points

### Smart Recommendations
1. Student with low math score → Should see math tutors first
2. Student with high ratings preference → Should see 5-star tutors
3. Student needing multiple subjects → Should see versatile tutors
4. New tutor with no bookings → Should still appear in results
5. Unavailable tutor → Should rank lower than available ones

---

## 💡 Pro Tips

1. **Start Simple**: Implement basic version first, enhance later
2. **Test Thoroughly**: User trust depends on reliability
3. **Monitor Performance**: Track API response times
4. **Get Feedback**: Ask users what they think
5. **Iterate Quickly**: Make improvements based on usage data

---

**Ready to start? Pick one feature and go! 🚀**
