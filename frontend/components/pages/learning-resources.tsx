"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Upload, Search, Filter, X, Check, ChevronsUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiUrl } from "@/lib/api-config"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StarRating } from "@/components/ui/star-rating"
import { useSubjects } from "@/hooks/use-subjects"
import { useStudyMaterials } from "@/hooks/use-study-materials"
import { useUser } from "@/contexts/UserContext"
import { cn } from "@/lib/utils"

export default function LearningResources() {
  // Program options
  const programOptionsRaw = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Information Systems",
    "Bachelor of Library and Information Science",
    "Bachelor of Science in Entertainment and Multimedia Computing"
  ];
  // Remove duplicates from program options
  const programOptions = Array.from(new Set(programOptionsRaw));

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
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>("all")
  
  // Subject combobox state
  const [subjectFilterComboboxOpen, setSubjectFilterComboboxOpen] = useState(false)
  const [subjectFilterSearchValue, setSubjectFilterSearchValue] = useState("")
  
  // Form subject combobox state
  const [formSubjectComboboxOpen, setFormSubjectComboboxOpen] = useState(false)
  const [formSubjectSearchValue, setFormSubjectSearchValue] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Get user role from context, default to 'student' if not available
  const userRole = currentUser?.role?.toLowerCase() || 'student'
  const userProgram = currentUser?.program || ""
  
  // Program state for learning resource creation
  const [resourceProgram, setResourceProgram] = useState(userRole === "admin" ? "" : userProgram)
  
  // Update resourceProgram when currentUser loads or changes
  useEffect(() => {
    if (currentUser && userRole !== "admin") {
      setResourceProgram(currentUser.program || "");
    }
  }, [currentUser, userRole]);
  
  // Debug logging for user info
  if (process.env.NODE_ENV === 'development') {
    console.log('Learning Resources - Current User Info:', {
      role: userRole,
      program: userProgram,
      resourceProgram: resourceProgram,
      fullUser: currentUser
    })
  }
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    subject: "",
    file: null as File | null
  })

  // Rating state
  const [materialRatings, setMaterialRatings] = useState<Record<number, {
    averageRating: number;
    totalRatings: number;
    userRating: number | null;
    userComment: string | null;
  }>>({})

  // Handle search
  const handleSearch = async (value: string) => {
    setSearchTerm(value)
    if (value.trim()) {
      await searchMaterials(value.trim())
    } else {
      await refreshMaterials()
    }
  }

  // Filter materials based on selected subject and program
  const filteredMaterials = materials.filter((material) => {
    // Subject filter
    const matchesSubject = selectedSubject === "all" || material.subject === selectedSubject;
    
    // Program filter - for students, automatically filter by their program
    let matchesProgram = true
    if (userRole === "student") {
      // For students, only show materials that exactly match their program
      matchesProgram = !!(material.program && material.program === userProgram)
      
      // Debug logging for program filtering
      if (process.env.NODE_ENV === 'development') {
        console.log(`Material "${material.title}": program="${material.program}", userProgram="${userProgram}", matches=${matchesProgram}`)
      }
    } else if (userRole === "admin" && selectedProgramFilter !== "all") {
      // For admins, apply the selected program filter
      matchesProgram = material.program === selectedProgramFilter
    }

    return matchesSubject && matchesProgram;
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
      
      // Validate file size (200MB limit)
      if (file.size > 200 * 1024 * 1024) {
        alert('File size must be less than 200MB!')
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

    // Validate program is selected
    if (!resourceProgram || resourceProgram.trim() === '') {
      alert('Please select a program')
      return
    }

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('title', uploadForm.title.trim())
      formData.append('description', uploadForm.description.trim())
      formData.append('subject', uploadForm.subject.trim() || 'General')
      formData.append('uploaded_by', currentUser.user_id.toString())
      formData.append('program', resourceProgram)
      formData.append('file', uploadForm.file)

      console.log('=== LEARNING RESOURCE UPLOAD DEBUG ===');
      console.log('Resource Program State:', resourceProgram);
      console.log('User Program:', userProgram);
      console.log('User Role:', userRole);
      console.log('FormData program value:', formData.get('program'));
      console.log('====================================');

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

  // Fetch material ratings
  const fetchMaterialRatings = async (materialId: number) => {
    try {
      const [avgResponse, userResponse] = await Promise.all([
        fetch(apiUrl(`/api/materials/${materialId}/rating`),
        currentUser ? fetch(apiUrl(`/api/materials/${materialId}/rating/${currentUser.user_id}`)) : Promise.resolve(null)
      ])

      const avgData = await avgResponse.json()
      const userData = userResponse ? await userResponse.json() : null

      if (avgData.success) {
        setMaterialRatings(prev => ({
          ...prev,
          [materialId]: {
            averageRating: avgData.average_rating || 0,
            totalRatings: avgData.total_ratings || 0,
            userRating: userData?.success && userData.userRating ? userData.userRating.rating : null,
            userComment: userData?.success && userData.userRating ? userData.userRating.comment : null
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching material ratings:', error)
    }
  }

  // Handle material rating
  const handleRateMaterial = async (materialId: number, rating: number, comment?: string) => {
    if (!currentUser) {
      alert('Please log in to rate materials')
      return
    }

    try {
      const response = await fetch(apiUrl(`/api/materials/${materialId}/rating`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.user_id,
          rating,
          comment: comment || null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Update the material ratings state
        setMaterialRatings(prev => ({
          ...prev,
          [materialId]: {
            averageRating: data.average_rating || 0,
            totalRatings: data.total_ratings || 0,
            userRating: rating,
            userComment: comment || null
          }
        }))
        
        // Refresh materials to get updated ratings
        await refreshMaterials()
      } else {
        alert(data.error || 'Failed to submit rating')
      }
    } catch (error) {
      console.error('Error rating material:', error)
      alert('Failed to submit rating')
    }
  }

  // Load ratings for all materials when materials change
  useEffect(() => {
    if (materials && materials.length > 0) {
      materials.forEach(material => {
        if (!materialRatings[material.material_id]) {
          fetchMaterialRatings(material.material_id)
        }
      })
    }
  }, [materials, currentUser])

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
          {/* Program Filter - Available for all users */}
          <Select 
            value={selectedProgramFilter} 
            onValueChange={(value) => {
              setSelectedProgramFilter(value)
              setSelectedSubject('all') // Reset subject when program changes
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programOptions.map((program) => (
                <SelectItem key={program} value={program}>
                  {program}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Subject Filter - Searchable combobox */}
          <Popover open={subjectFilterComboboxOpen} onOpenChange={setSubjectFilterComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={subjectFilterComboboxOpen}
                className="w-[280px] justify-between"
                disabled={subjectsLoading || !!subjectsError}
              >
                {selectedSubject === "all" ? (
                  <>
                    All Subjects
                    {selectedProgramFilter !== 'all' && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({subjects.filter((subject) => {
                          if (Array.isArray(subject.program)) {
                            return subject.program.includes(selectedProgramFilter)
                          } else if (typeof subject.program === 'string') {
                            try {
                              const programArray = JSON.parse(subject.program)
                              return Array.isArray(programArray) && programArray.includes(selectedProgramFilter)
                            } catch {
                              return subject.program === selectedProgramFilter
                            }
                          }
                          return false
                        }).length} available)
                      </span>
                    )}
                  </>
                ) : (
                  (() => {
                    const subject = subjects.find(s => s.subject_name === selectedSubject);
                    return subject ? `${subject.subject_code ? `${subject.subject_code} - ` : ""}${subject.subject_name}` : selectedSubject;
                  })()
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
              <Command>
                <CommandInput 
                  placeholder={subjectsLoading ? "Loading..." : subjectsError ? "Error loading subjects" : "Search subjects..."} 
                  value={subjectFilterSearchValue}
                  onValueChange={setSubjectFilterSearchValue}
                  disabled={subjectsLoading || !!subjectsError}
                />
                <CommandList>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      setSelectedSubject("all")
                      setSubjectFilterComboboxOpen(false)
                      setSubjectFilterSearchValue("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedSubject === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Subjects
                    {selectedProgramFilter !== 'all' && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({subjects.filter((subject) => {
                          if (Array.isArray(subject.program)) {
                            return subject.program.includes(selectedProgramFilter)
                          } else if (typeof subject.program === 'string') {
                            try {
                              const programArray = JSON.parse(subject.program)
                              return Array.isArray(programArray) && programArray.includes(selectedProgramFilter)
                            } catch {
                              return subject.program === selectedProgramFilter
                            }
                          }
                          return false
                        }).length} available)
                      </span>
                    )}
                  </CommandItem>
                  {!subjectsLoading && !subjectsError && subjects
                    .filter((subject) => {
                      if (selectedProgramFilter === 'all') return true
                      if (Array.isArray(subject.program)) {
                        return subject.program.includes(selectedProgramFilter)
                      } else if (typeof subject.program === 'string') {
                        try {
                          const programArray = JSON.parse(subject.program)
                          return Array.isArray(programArray) && programArray.includes(selectedProgramFilter)
                        } catch {
                          return subject.program === selectedProgramFilter
                        }
                      }
                      return false
                    })
                    .filter((subject) => {
                      const searchTerm = subjectFilterSearchValue.toLowerCase();
                      return (
                        subject.subject_name.toLowerCase().includes(searchTerm) ||
                        (subject.subject_code && subject.subject_code.toLowerCase().includes(searchTerm))
                      );
                    })
                    .map((subject) => (
                      <CommandItem
                        key={subject.subject_id}
                        value={`${subject.subject_code || ''} ${subject.subject_name}`.trim()}
                        onSelect={() => {
                          setSelectedSubject(subject.subject_name)
                          setSubjectFilterComboboxOpen(false)
                          setSubjectFilterSearchValue("")
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSubject === subject.subject_name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {subject.subject_code ? `${subject.subject_code} - ` : ""}{subject.subject_name}
                      </CommandItem>
                    ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
                      {material.subject && material.subject !== 'General' && (
                        <Badge variant="secondary">{material.subject}</Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight">{material.title}</CardTitle>
                  <CardDescription>{material.description || "No description provided"}</CardDescription>
                  {material.program && (
                    <div className="text-xs text-muted-foreground">
                      Program: {material.program}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <p>Uploaded by {material.uploaded_by_name}</p>
                      <p>{material.download_count} downloads • {material.view_count} views</p>
                    </div>
                    
                    {/* Star Rating Component */}
                    <div className="flex items-center space-x-2">
                      <StarRating
                        rating={materialRatings[material.material_id]?.averageRating || material.rating || 0}
                        totalRatings={materialRatings[material.material_id]?.totalRatings || 0}
                        userRating={materialRatings[material.material_id]?.userRating}
                        userComment={materialRatings[material.material_id]?.userComment}
                        onRate={(rating, comment) => handleRateMaterial(material.material_id, rating, comment)}
                        readonly={!currentUser}
                        size="sm"
                        showCount={true}
                        allowComments={true}
                      />
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
        <DialogContent className="max-w-2xl">
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
                <Label htmlFor="program">Program *</Label>
                {userRole === "admin" ? (
                  <Select 
                    value={resourceProgram} 
                    onValueChange={setResourceProgram}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programOptions.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="program"
                    value={resourceProgram}
                    disabled
                    className="bg-muted"
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Popover open={formSubjectComboboxOpen} onOpenChange={setFormSubjectComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={formSubjectComboboxOpen}
                      className="w-full justify-between"
                      disabled={subjectsLoading || !!subjectsError}
                    >
                      {uploadForm.subject ? (
                        (() => {
                          const subject = subjects.find(s => s.subject_name === uploadForm.subject);
                          return subject ? `${subject.subject_code ? `${subject.subject_code} - ` : ""}${subject.subject_name}` : uploadForm.subject;
                        })()
                      ) : (
                        subjectsLoading ? "Loading subjects..." : subjectsError ? "Error loading subjects" : "Select a subject"
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search subjects..." 
                        value={formSubjectSearchValue}
                        onValueChange={setFormSubjectSearchValue}
                        disabled={subjectsLoading || !!subjectsError}
                      />
                      <CommandList>
                        {!subjectsLoading && !subjectsError && subjects
                          .filter((subject) => {
                            const searchTerm = formSubjectSearchValue.toLowerCase();
                            return (
                              subject.subject_name.toLowerCase().includes(searchTerm) ||
                              (subject.subject_code && subject.subject_code.toLowerCase().includes(searchTerm))
                            );
                          })
                          .map((subject) => (
                            <CommandItem
                              key={subject.subject_id}
                              value={`${subject.subject_code || ''} ${subject.subject_name}`.trim()}
                              onSelect={() => {
                                setUploadForm(prev => ({ ...prev, subject: subject.subject_name }))
                                setFormSubjectComboboxOpen(false)
                                setFormSubjectSearchValue("")
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  uploadForm.subject === subject.subject_name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {subject.subject_code ? `${subject.subject_code} - ` : ""}{subject.subject_name}
                            </CommandItem>
                          ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                  Maximum file size: 200MB. Only PDF files are allowed. All uploads are reviewed by faculty.
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