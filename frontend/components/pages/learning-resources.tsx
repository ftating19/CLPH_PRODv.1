"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Upload, Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSubjects } from "@/hooks/use-subjects"
import { useStudyMaterials } from "@/hooks/use-study-materials"
import { useUser } from "@/contexts/UserContext"

export default function LearningResources() {
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects()
  const { 
    materials, 
    loading: materialsLoading, 
    error: materialsError,
    uploadMaterial,
    downloadMaterial,
    previewMaterial,
    searchMaterials,
    refreshMaterials
  } = useStudyMaterials()
  const { currentUser } = useUser()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    subject: "",
    file: null as File | null
  })

  // Handle search
  const handleSearch = async (value: string) => {
    setSearchTerm(value)
    if (value.trim()) {
      await searchMaterials(value.trim())
    } else {
      await refreshMaterials()
    }
  }

  // Filter materials based on selected subject
  const filteredMaterials = materials.filter((material) => {
    if (selectedSubject === "all") return true
    // Note: You might need to add subject filtering logic here
    // depending on how subjects are related to materials
    return true
  })

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed!')
        e.target.value = ''
        return
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB!')
        e.target.value = ''
        return
      }
      
      setUploadForm(prev => ({ ...prev, file }))
    }
  }

  // Handle upload submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadForm.title.trim()) {
      alert('Please enter a title')
      return
    }
    
    if (!uploadForm.file) {
      alert('Please select a PDF file')
      return
    }
    
    if (!currentUser) {
      alert('You must be logged in to upload materials')
      return
    }

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('title', uploadForm.title.trim())
      formData.append('description', uploadForm.description.trim())
      formData.append('subject', uploadForm.subject.trim() || 'General')
      formData.append('uploaded_by', currentUser.user_id.toString())
      formData.append('file', uploadForm.file)

      await uploadMaterial(formData)
      
      // Reset form and close modal
      setUploadForm({
        title: "",
        description: "",
        subject: "",
        file: null
      })
      setShowUploadModal(false)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Learning Resources</h1>
          <p className="text-muted-foreground">Share and access academic materials</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowUploadModal(true)}
          disabled={!currentUser}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Resource
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search resources..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={subjectsLoading || !!subjectsError}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={subjectsLoading ? "Loading..." : subjectsError ? "Error loading subjects" : "Filter by subject"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {!subjectsLoading && !subjectsError && subjects.map((subject) => (
                <SelectItem key={subject.subject_id} value={subject.subject_name}>
                  {subject.subject_code ? `${subject.subject_code} - ` : ""}{subject.subject_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading and Error States */}
      {materialsLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading learning resources...</p>
        </div>
      )}

      {materialsError && (
        <div className="text-center py-8">
          <p className="text-red-500">Error: {materialsError}</p>
          <Button 
            variant="outline" 
            onClick={refreshMaterials}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Materials Grid */}
      {!materialsLoading && !materialsError && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "No resources found matching your search." 
                  : "No learning resources available yet. Be the first to upload!"
                }
              </p>
            </div>
          ) : (
            filteredMaterials.map((material) => (
              <Card key={material.material_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <Badge variant="outline">{material.file_type}</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight">{material.title}</CardTitle>
                  <CardDescription>{material.description || "No description provided"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <p>Uploaded by {material.uploaded_by_name}</p>
                      <p>{material.download_count} downloads • {material.view_count} views</p>
                      {material.rating > 0 && <p>Rating: {material.rating}/5.0</p>}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 bg-transparent"
                      onClick={() => previewMaterial(material.material_id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => downloadMaterial(material.material_id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUploadSubmit}>
            <DialogHeader>
              <DialogTitle>Upload Learning Resource</DialogTitle>
              <DialogDescription>
                Upload a PDF file to share with other students. Only PDF files are allowed.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter resource title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={uploadForm.subject} 
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, subject: value }))}
                  disabled={subjectsLoading || !!subjectsError}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={subjectsLoading ? "Loading subjects..." : subjectsError ? "Error loading subjects" : "Select a subject"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!subjectsLoading && !subjectsError && subjects.map((subject) => (
                      <SelectItem key={subject.subject_id} value={subject.subject_name}>
                        {subject.subject_code ? `${subject.subject_code} - ` : ""}{subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this resource covers"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">PDF File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 10MB. Only PDF files are allowed.
                </p>
                {uploadForm.file && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{uploadForm.file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}