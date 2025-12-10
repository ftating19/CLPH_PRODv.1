import { Suspense } from "react"
import Layout from "@/components/dashboard/layout"
import FeedbackRating from "@/components/pages/feedback-rating"

export default function FeedbackRatingPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <FeedbackRating />
      </Suspense>
    </Layout>
  )
}
