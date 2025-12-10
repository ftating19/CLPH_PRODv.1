import { Suspense } from "react"
import Layout from "@/components/dashboard/layout"
import DiscussionForums from "@/components/pages/discussion-forums"

export default function DiscussionForumsPage() {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <DiscussionForums />
      </Suspense>
    </Layout>
  )
}
