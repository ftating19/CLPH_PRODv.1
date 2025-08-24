"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Upload, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSubjects } from "@/hooks/use-subjects"

export default function LearningResources() {
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  
  const resources = [
    {
      id: "1",
      title: "Data Structures and Algorithms Handbook",
      description: "Comprehensive guide covering all major data structures with code examples",
      type: "PDF",
      size: "2.4 MB",
      subject: "Computer Science",
      uploadedBy: "Prof. Johnson",
      uploadDate: "2024-01-15",
      downloads: 234,
      rating: 4.8,
    },
    {
      id: "2",
      title: "Calculus Practice Problems Set",
      description: "Collection of calculus problems with detailed solutions",
      type: "PDF",
      size: "1.8 MB",
      subject: "Mathematics",
      uploadedBy: "Sarah Chen",
      uploadDate: "2024-01-12",
      downloads: 156,
      rating: 4.6,
    },
    {
      id: "3",
      title: "Database Design Tutorial Video",
      description: "Step-by-step tutorial on designing normalized databases",
      type: "MP4",
      size: "45.2 MB",
      subject: "Database Systems",
      uploadedBy: "Mark Rodriguez",
      uploadDate: "2024-01-10",
      downloads: 89,
      rating: 4.9,
    },
    {
      id: "4",
      title: "Java Programming Cheat Sheet",
      description: "Quick reference for Java syntax and common patterns",
      type: "PDF",
      size: "0.8 MB",
      subject: "Programming",
      uploadedBy: "Lisa Wang",
      uploadDate: "2024-01-08",
      downloads: 312,
      rating: 4.7,
    },
  ]

  // Filter resources based on search term and selected subject
  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSubject = selectedSubject === "all" || resource.subject === selectedSubject
    
    return matchesSearch && matchesSubject
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Learning Resources</h1>
          <p className="text-muted-foreground">Share and access academic materials</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
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
            onChange={(e) => setSearchTerm(e.target.value)}
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
                  {subject.subject_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredResources.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || selectedSubject !== "all" 
                ? "No resources found matching your filters." 
                : "No resources available."
              }
            </p>
          </div>
        ) : (
          filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <Badge variant="outline">{resource.type}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{resource.size}</span>
              </div>
              <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">{resource.subject}</Badge>
                <div className="text-sm text-muted-foreground">
                  <p>Uploaded by {resource.uploadedBy}</p>
                  <p>{resource.downloads} downloads</p>
                  <p>Rating: {resource.rating}/5.0</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>
    </div>
  )
}
