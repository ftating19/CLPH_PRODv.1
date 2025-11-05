"use client"
import React, { useState } from "react"
import { Star, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Textarea } from "./textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"

interface StarRatingProps {
  rating: number // Current average rating (0-5)
  totalRatings?: number // Total number of ratings
  userRating?: number | null // User's current rating
  userComment?: string | null // User's current comment
  onRate?: (rating: number, comment?: string) => void // Callback when user rates
  readonly?: boolean // If true, user cannot rate
  size?: "sm" | "md" | "lg" // Star size
  showCount?: boolean // Show rating count
  allowComments?: boolean // Allow user to add comments
}

export function StarRating({
  rating,
  totalRatings = 0,
  userRating = null,
  userComment = null,
  onRate,
  readonly = false,
  size = "md",
  showCount = true,
  allowComments = true
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [comment, setComment] = useState(userComment || "")

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  }

  const handleStarClick = (starRating: number) => {
    if (readonly) return

    if (allowComments) {
      // Open comment dialog
      setSelectedRating(starRating)
      setComment(userComment || "")
      setShowCommentDialog(true)
    } else {
      // Rate immediately without comment
      if (onRate) {
        onRate(starRating)
      }
    }
  }

  const handleSubmitRating = () => {
    if (selectedRating && onRate) {
      onRate(selectedRating, comment.trim() || undefined)
    }
    setShowCommentDialog(false)
    setSelectedRating(null)
  }

  const handleMouseEnter = (starRating: number) => {
    if (!readonly) {
      setHoveredRating(starRating)
    }
  }

  const handleMouseLeave = () => {
    setHoveredRating(null)
  }

  const displayRating = hoveredRating ?? userRating ?? rating

  return (
    <>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((starValue) => {
            const isFilled = starValue <= Math.round(displayRating)
            const isPartial = starValue <= displayRating && starValue > Math.floor(displayRating)

            return (
              <button
                key={starValue}
                type="button"
                disabled={readonly}
                onClick={() => handleStarClick(starValue)}
                onMouseEnter={() => handleMouseEnter(starValue)}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  "relative transition-all",
                  !readonly && "cursor-pointer hover:scale-110",
                  readonly && "cursor-default"
                )}
                aria-label={`Rate ${starValue} stars`}
              >
                <Star
                  className={cn(
                    sizeClasses[size],
                    "transition-all",
                    isFilled || isPartial
                      ? "fill-yellow-400 stroke-yellow-400"
                      : "fill-transparent stroke-gray-300"
                  )}
                />
              </button>
            )
          })}
        </div>

        {showCount && totalRatings > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            {rating.toFixed(1)} ({totalRatings})
          </span>
        )}

        {!readonly && userRating !== null && userRating > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-blue-600 ml-1">
              Your rating: {userRating}
            </span>
            {userComment && (
              <MessageSquare className="w-3 h-3 text-blue-600" />
            )}
          </div>
        )}
      </div>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate {selectedRating ? `${selectedRating} Star${selectedRating > 1 ? 's' : ''}` : ''}</DialogTitle>
            <DialogDescription>
              Share your thoughts about this {allowComments ? '(optional)' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Star Display */}
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <Star
                  key={starValue}
                  className={cn(
                    "w-8 h-8",
                    starValue <= (selectedRating || 0)
                      ? "fill-yellow-400 stroke-yellow-400"
                      : "fill-transparent stroke-gray-300"
                  )}
                />
              ))}
            </div>

            {/* Comment Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Your Review (Optional)
              </label>
              <Textarea
                placeholder="What did you think? Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCommentDialog(false)
                setSelectedRating(null)
                setComment(userComment || "")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitRating}>
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
