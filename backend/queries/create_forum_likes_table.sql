-- Table to track which users liked which forums
CREATE TABLE IF NOT EXISTS forum_likes (
  forum_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (forum_id, user_id)
);
