import { Suspense } from "react"
import Layout from "@/components/dashboard/layout"
import PreAssessments from "@/components/pages/pre-assessments"

export default function PreAssessmentsPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <PreAssessments />
      </Suspense>
    </Layout>
  )
}