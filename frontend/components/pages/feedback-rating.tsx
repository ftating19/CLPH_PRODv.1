"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, Send } from "lucide-react"

export default function FeedbackRating() {
  const [systemRating, setSystemRating] = useState(0)

  const StarRating = ({
    rating,
    setRating,
    label,
  }: { rating: number; setRating: (rating: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"
            }`}
            onClick={() => setRating(star)}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback & Rating</h1>
        <p className="text-muted-foreground">Help us improve by sharing your experience</p>
      </div>

      <div className="max-w-xl mx-auto">
        <Card className="bg-white dark:bg-[#0F0F12] border border-gray-200 dark:border-[#1F1F23]">
          <CardHeader>
            <CardTitle>Rate the Platform</CardTitle>
            <CardDescription>Share your experience with the CICT PEER LEARNING HUB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StarRating rating={systemRating} setRating={setSystemRating} label="Overall Platform Rating" />

            <div className="space-y-2">
              <Label htmlFor="system-feedback">What did you like most?</Label>
              <Textarea
                id="system-feedback"
                placeholder="Tell us about your experience with the platform..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="system-suggestions">Suggestions for improvement</Label>
              <Textarea id="system-suggestions" placeholder="How can we make the platform better?" rows={3} />
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Submit Platform Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
