import { Suspense } from "react"
import Layout from "@/components/dashboard/layout"
import Quizzes from "@/components/pages/quizzes"

export default function QuizzesPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <Quizzes />
      </Suspense>
    </Layout>
  )
}
