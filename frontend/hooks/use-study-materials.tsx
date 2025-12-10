import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { apiUrl } from "@/lib/api-config"

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

export function useStudyMaterials() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(apiUrl('/api/study-materials'))
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
      const response = await fetch(apiUrl('/api/study-materials'), {
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
        // Create download link
        const link = document.createElement('a')
        link.href = result.file_path
        link.download = result.title
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
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
      const response = await fetch(`https://api.cictpeerlearninghub.com/api/study-materials/${materialId}/preview`)
      const result = await response.json()

      if (result.success) {
        // Open in new tab for preview
        window.open(result.file_path, '_blank')
        
        // Refresh materials to update view count
        await fetchMaterials()
      } else {
        throw new Error(result.error || 'Failed to preview material')
      }
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
    searchMaterials
  }
}
