# Rating Prompt After Quiz/Flashcard Completion

## Overview
Implemented an automatic rating prompt that appears after users complete quizzes or flashcard sets, encouraging them to provide feedback only if they haven't rated the content before.

## Feature Description
When users finish a quiz or complete all flashcards in a set, they are automatically prompted to rate the content (if they haven't already). This increases user engagement and provides valuable feedback to content creators.

## Implementation Details

### Quizzes Implementation

#### 1. State Management
**File**: `frontend/components/pages/quizzes.tsx`

Added new state variables:
```typescript
const [showRatingPrompt, setShowRatingPrompt] = useState(false)
const [quizToRate, setQuizToRate] = useState<{id: number, title: string} | null>(null)
```

#### 2. Updated closeResultsDialog Function
Modified to show rating prompt after closing quiz results:
```typescript
const closeResultsDialog = () => {
  setShowResultsDialog(false)
  const completedQuizData = quizResults?.quiz
  setQuizResults(null)
  exitQuiz() // Reset all quiz states
  
  // Show rating prompt if user hasn't rated this quiz yet
  if (completedQuizData && currentUser?.user_id && !isPreviewMode) {
    const quizId = completedQuizData.quiz_id || completedQuizData.id
    // Only show rating prompt if user hasn't rated yet
    if (!userRatings[quizId]) {
      setQuizToRate({ id: quizId, title: completedQuizData.title })
      setShowRatingPrompt(true)
    }
  }
}
```

**Smart Logic**:
- Only shows if user is logged in
- Skips if in preview mode
- Checks `userRatings` state to see if user already rated
- Only prompts once per quiz (for first-time raters)

#### 3. Rating Prompt Dialog
Added new dialog component:
```tsx
<Dialog open={showRatingPrompt} onOpenChange={setShowRatingPrompt}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle className="flex items-center space-x-2">
        <Star className="w-5 h-5 text-yellow-500" />
        <span>Rate This Quiz</span>
      </DialogTitle>
      <DialogDescription>
        How would you rate "{quizToRate?.title}"? Your feedback helps improve the learning experience.
      </DialogDescription>
    </DialogHeader>
    <div className="py-6">
      {quizToRate && (
        <StarRating
          rating={0}
          totalRatings={quizRatings[quizToRate.id]?.total_ratings || 0}
          userRating={null}
          userComment={null}
          onRate={(rating, comment) => {
            handleRateQuiz(quizToRate.id, rating, comment)
            setShowRatingPrompt(false)
            setQuizToRate(null)
          }}
          readonly={false}
          size="lg"
          showCount={false}
        />
      )}
    </div>
    <div className="flex justify-end space-x-2">
      <Button 
        variant="outline" 
        onClick={() => {
          setShowRatingPrompt(false)
          setQuizToRate(null)
        }}
      >
        Skip
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

**Features**:
- Shows quiz title in description
- Uses `StarRating` component with comment support
- Large size for better visibility
- "Skip" button for users who don't want to rate
- Automatically closes after rating is submitted

### Flashcards Implementation

#### 1. State Management
**File**: `frontend/components/pages/flashcards.tsx`

Added new state variables:
```typescript
const [showRatingPrompt, setShowRatingPrompt] = useState(false)
const [setToRate, setSetToRate] = useState<{subId: number, subject: string} | null>(null)
```

#### 2. Updated handleNextOrComplete Function
Modified to show rating prompt after completing last flashcard:
```typescript
const handleNextOrComplete = async () => {
  if (!selectedSet || !currentUser) return;
  try {
    const isLastCard = currentCardIndex === selectedSet.cards.length - 1;
    if (isLastCard) {
      // Mark all cards as completed and finish set
      const updatedCards = [...selectedSet.cards];
      for (let i = 0; i < updatedCards.length; i++) {
        if (updatedCards[i].status !== 'completed') {
          await markCompleted(updatedCards[i].id, currentUser.user_id);
          updatedCards[i] = {
            ...updatedCards[i],
            status: 'completed'
          };
        }
      }
      setSelectedSet({
        ...selectedSet,
        cards: updatedCards
      });
      refetchProgress();
      refetchFlashcards();
      
      const completedSubId = selectedSet.sub_id;
      const completedSubject = selectedSet.subject;
      
      // Show completion message and go back to sets
      toast({
        title: "Congratulations!",
        description: "You've completed this flashcard set! 🎉",
        duration: 4000
      });
      
      setTimeout(() => {
        setStudyMode(false);
        
        // Show rating prompt if user hasn't rated this set yet
        if (!userSetRatings[completedSubId]) {
          setSetToRate({ subId: completedSubId, subject: completedSubject });
          setShowRatingPrompt(true);
        }
      }, 2000);
    } else {
      // Just go to next card
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  } catch (error) {
    console.error('Error marking flashcard as completed:', error);
  }
}
```

**Smart Logic**:
- Triggers when user completes the last card in set
- Shows congratulations toast first
- Waits 2 seconds before showing rating prompt (better UX)
- Only shows if user hasn't rated the set before
- Checks `userSetRatings` state

#### 3. Rating Prompt Dialog
Added new dialog component:
```tsx
<Dialog open={showRatingPrompt} onOpenChange={setShowRatingPrompt}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle className="flex items-center space-x-2">
        <Star className="w-5 h-5 text-yellow-500" />
        <span>Rate This Flashcard Set</span>
      </DialogTitle>
      <DialogDescription>
        How would you rate the "{setToRate?.subject}" flashcard set? Your feedback helps improve the learning experience.
      </DialogDescription>
    </DialogHeader>
    <div className="py-6">
      {setToRate && (
        <StarRating
          rating={0}
          totalRatings={setRatings[setToRate.subId]?.total_ratings || 0}
          userRating={null}
          userComment={null}
          onRate={(rating, comment) => {
            handleRateFlashcardSet(setToRate.subId, rating, comment)
            setShowRatingPrompt(false)
            setSetToRate(null)
          }}
          readonly={false}
          size="lg"
          showCount={false}
        />
      )}
    </div>
    <div className="flex justify-end space-x-2">
      <Button 
        variant="outline" 
        onClick={() => {
          setShowRatingPrompt(false)
          setSetToRate(null)
        }}
      >
        Skip
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

## User Experience Flow

### Quiz Completion Flow
1. User takes a quiz
2. Clicks "Submit Quiz"
3. Quiz results dialog appears showing score and answers
4. User clicks "Close Results"
5. **If user hasn't rated the quiz:**
   - Rating prompt dialog appears
   - User can rate (1-5 stars) and optionally add comment
   - Click star → Comment dialog opens → Submit rating
   - OR click "Skip" to dismiss
6. Returns to quiz list

### Flashcard Completion Flow
1. User studies flashcards in study mode
2. Progresses through all cards
3. On last card, clicks "Complete Set"
4. All cards marked as completed
5. Congratulations toast appears: "You've completed this flashcard set! 🎉"
6. Wait 2 seconds
7. Study mode closes, returns to set list
8. **If user hasn't rated the set:**
   - Rating prompt dialog appears
   - User can rate and comment
   - OR click "Skip"
9. Back to normal flashcard set view

## Benefits

### For Users
- **Timely Feedback**: Prompt appears when content is fresh in mind
- **Optional**: Can skip if they don't want to rate
- **No Repetition**: Only shown once per content (first-time completion)
- **Context**: Knows exactly what they're rating (quiz/set name shown)

### For Content Creators
- **Higher Rating Rate**: Automatic prompts increase likelihood of feedback
- **Quality Feedback**: Users rate immediately after completion (fresher memory)
- **More Comments**: Comment feature integrated into prompt
- **Better Data**: More ratings = more accurate average ratings

### For Platform
- **Engagement**: Encourages user interaction beyond passive consumption
- **Quality Control**: More ratings help identify high/low quality content
- **Content Discovery**: Better ratings help users find best resources
- **Analytics**: Track completion-to-rating conversion rate

## Technical Features

### Smart Detection
- Checks if user already rated before showing prompt
- Uses existing `userRatings` and `userSetRatings` state
- No redundant API calls

### Non-Intrusive
- Appears after results/completion, not during activity
- Easy to dismiss with "Skip" button
- Doesn't block user from continuing

### Integrated Functionality
- Uses existing `StarRating` component
- Leverages existing `handleRateQuiz` and `handleRateFlashcardSet` functions
- Includes comment feature (500 char limit)
- Updates state immediately after rating

### Error Handling
- Only shows if user is logged in
- Handles missing data gracefully
- Doesn't break if rating fails

## Configuration

### Timing
**Quizzes**: Prompt appears immediately after closing results dialog
**Flashcards**: Prompt appears 2 seconds after completion toast

To adjust flashcard delay, modify this line in `flashcards.tsx`:
```typescript
setTimeout(() => {
  setStudyMode(false);
  // Show rating prompt...
}, 2000); // Change 2000 to desired milliseconds
```

### Condition for Showing Prompt

**Quizzes**:
```typescript
if (completedQuizData && currentUser?.user_id && !isPreviewMode && !userRatings[quizId])
```

**Flashcards**:
```typescript
if (!userSetRatings[completedSubId])
```

To always show prompt (even if user already rated), remove the condition:
```typescript
// Always show
setShowRatingPrompt(true)
```

## Testing Checklist

### Quizzes
- [ ] Complete quiz → Close results → Rating prompt appears
- [ ] Complete quiz in preview mode → No rating prompt
- [ ] Complete quiz user already rated → No rating prompt
- [ ] Rate via prompt → Rating saved and displayed correctly
- [ ] Add comment via prompt → Comment saved
- [ ] Click "Skip" → Prompt closes, no rating saved
- [ ] Close prompt (X button) → Prompt closes
- [ ] Not logged in → No rating prompt

### Flashcards
- [ ] Complete flashcard set → Completion toast → Rating prompt after 2s
- [ ] Complete set user already rated → No rating prompt
- [ ] Rate via prompt → Rating saved correctly
- [ ] Add comment via prompt → Comment saved
- [ ] Click "Skip" → Prompt closes
- [ ] Complete partial set → No rating prompt (only after ALL cards)
- [ ] Not logged in → No rating prompt

### Integration
- [ ] Rating from prompt updates average rating
- [ ] Rating from prompt shows in StarRating component on list
- [ ] Comment from prompt accessible when editing rating
- [ ] Multiple completions of same quiz/set only show prompt once

## Future Enhancements

### Smarter Prompting
- Show prompt after every 3rd completion (re-engagement)
- Different prompt for retakes: "Would you like to update your rating?"
- A/B test different prompt timing/wording

### Gamification
- Badge for "Helpful Reviewer" (rate 10+ items)
- Points for leaving detailed comments
- Thank you message after rating

### Analytics Dashboard
- Track completion-to-rating conversion rate
- Show which content gets rated most
- Identify drop-off points

### Personalization
- Remember user preference if they always skip
- Adjust prompt frequency based on user engagement
- Customize prompt message based on user performance

## Files Modified

### Frontend
1. `frontend/components/pages/quizzes.tsx`
   - Added `showRatingPrompt` and `quizToRate` state
   - Modified `closeResultsDialog()` function
   - Added rating prompt dialog component

2. `frontend/components/pages/flashcards.tsx`
   - Added `showRatingPrompt` and `setToRate` state
   - Modified `handleNextOrComplete()` function
   - Added rating prompt dialog component

### No Backend Changes Required
All functionality uses existing rating APIs and state management.

## Conclusion

The rating prompt feature successfully encourages users to provide feedback immediately after completing quizzes and flashcard sets. The implementation is smart (only shows to first-time raters), non-intrusive (easy to skip), and fully integrated with the existing rating system including comments.

This feature is expected to significantly increase the number of ratings and improve the quality of feedback, helping both users discover better content and creators understand their audience.
