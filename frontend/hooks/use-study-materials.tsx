import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'


export interface StudyMaterial {
  material_id: number
  title: string
  description: string
  file_path: string
  uploaded_by: number
  uploaded_by_name: string
  status: string
  download_count: number
  rating: number
  file_type: string
  view_count: number
  subject: string
  program: string
}

// Added discussion types
export interface DiscussionPost {
  id: number
  title: string
  content: string
  author_id: number
  author_name: string
  created_at: string
  updated_at?: string
}

export interface DiscussionComment {
  id: number
  post_id: number
  content: string
  author_id: number
  author_name: string
  created_at: string
  updated_at?: string
}

export function useStudyMaterials() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('https://api.cictpeerlearninghub.com/api/study-materials')
      const data = await response.json()

      if (data.success) {
        setMaterials(data.materials || [])
      } else {
        throw new Error(data.error || 'Failed to fetch study materials')
      }
    } catch (err) {
      console.error('Error fetching study materials:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch study materials')
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  const uploadMaterial = async (materialData: FormData) => {
    try {
      const response = await fetch('https://api.cictpeerlearninghub.com/api/study-materials', {
        method: 'POST',
        body: materialData
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Upload Submitted",
          description: "Your file has been uploaded and is pending review. You will be notified once it's approved.",
          variant: "default"
        })
        
        // Refresh the materials list
        await fetchMaterials()
        return result.material
      } else {
        throw new Error(result.error || 'Failed to upload study material')
      }
    } catch (err) {
      console.error('Error uploading study material:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload study material'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const downloadMaterial = async (materialId: number) => {
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/study-materials/${materialId}/download`)
      const result = await response.json()

      if (result.success) {
        // Open the serve URL in a new tab/window so browser handles preview/download.
        // This avoids issues with cross-origin download attribute behavior.
        try {
          window.open(result.file_path, '_blank')
        } catch (e) {
          // Fallback: create and click anchor if window.open is blocked
          const link = document.createElement('a')
          link.href = result.file_path
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }

        // Refresh materials to update download count
        await fetchMaterials()
      } else {
        throw new Error(result.error || 'Failed to download material')
      }
    } catch (err) {
      console.error('Error downloading material:', err)
      toast({
        title: "Error",
        description: "Failed to download material",
        variant: "destructive"
      })
    }
  }

  const previewMaterial = async (materialId: number) => {
    try {
      // Open the server-served preview endpoint in a new tab so the API streams the PDF.
      // Use configured API base if available so local/dev environments work correctly.
      const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')) || 'https://api.cictpeerlearninghub.com'

      // Try to find the material in the cached list to determine its status.
      const material = materials.find(m => m.material_id === materialId as number) as StudyMaterial | undefined

      // Use the pending-materials serve endpoint for items that are still pending (covers files stored under pending-resources),
      // otherwise use the normal study-materials serve endpoint for active resources.
      const serveUrl = material && material.status === 'pending'
        ? `${apiBase}/api/pending-materials/${materialId}/serve`
        : `${apiBase}/api/study-materials/${materialId}/serve`
      window.open(serveUrl, '_blank')
      // The serve endpoint will increment the view count; refresh list to reflect changes
      await fetchMaterials()
    } catch (err) {
      console.error('Error previewing material:', err)
      toast({
        title: "Error",
        description: "Failed to preview material",
        variant: "destructive"
      })
    }
  }

  const deleteMaterial = async (materialId: number) => {
    try {
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/study-materials/${materialId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Study material deleted successfully",
          variant: "default"
        })
        
        // Refresh the materials list
        await fetchMaterials()
      } else {
        throw new Error(result.error || 'Failed to delete study material')
      }
    } catch (err) {
      console.error('Error deleting study material:', err)
      toast({
        title: "Error",
        description: "Failed to delete study material",
        variant: "destructive"
      })
    }
  }

  const searchMaterials = async (searchTerm: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/study-materials/search/${encodeURIComponent(searchTerm)}`)
      const data = await response.json()

      if (data.success) {
        setMaterials(data.materials || [])
      } else {
        throw new Error(data.error || 'Failed to search study materials')
      }
    } catch (err) {
      console.error('Error searching study materials:', err)
      setError(err instanceof Error ? err.message : 'Failed to search study materials')
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  // New: edit a discussion post
  const editPost = async (postId: number, payload: { title?: string; content?: string }) => {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')) || 'https://api.cictpeerlearninghub.com'
      const response = await fetch(`${apiBase}/api/discussions/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Post Updated",
          description: "Your post was updated successfully.",
          variant: "default"
        })
        return result.post as DiscussionPost
      } else {
        throw new Error(result.error || 'Failed to update post')
      }
    } catch (err) {
      console.error('Error updating post:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update post'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  // New: edit a comment on a discussion post
  const editComment = async (commentId: number, payload: { content: string }) => {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')) || 'https://api.cictpeerlearninghub.com'
      const response = await fetch(`${apiBase}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Comment Updated",
          description: "Your comment was updated successfully.",
          variant: "default"
        })
        return result.comment as DiscussionComment
      } else {
        throw new Error(result.error || 'Failed to update comment')
      }
    } catch (err) {
      console.error('Error updating comment:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update comment'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  return {
    materials,
    loading,
    error,
    refreshMaterials: fetchMaterials,
    uploadMaterial,
    downloadMaterial,
    previewMaterial,
    deleteMaterial,
    searchMaterials,
    // Expose new functions so UI can allow editing
    editPost,
    editComment
  }
}
