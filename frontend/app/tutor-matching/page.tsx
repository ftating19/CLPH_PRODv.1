import { Suspense } from "react"
import TutorMatching from "@/components/pages/tutor-matching"
import Layout from "@/components/dashboard/layout"

export default function TutorMatchingPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <TutorMatching />
      </Suspense>
    </Layout>
  )
}
