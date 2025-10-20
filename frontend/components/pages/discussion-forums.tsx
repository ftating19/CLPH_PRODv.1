"use client"
import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageSquare, Users, Clock, Plus, Filter, Edit, Trash2, MoreVertical, Check, ChevronsUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSubjects } from "@/hooks/use-subjects"
import { useUser } from "@/contexts/UserContext"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function DiscussionForums() {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [newTopicSubject, setNewTopicSubject] = useState("");
  const [newTopicLoading, setNewTopicLoading] = useState(false);
  const [newTopicError, setNewTopicError] = useState("");
  
  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingForum, setEditingForum] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  
  // Delete states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingForum, setDeletingForum] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Program options for filtering
  const programOptionsRaw = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Information Systems",
    "Bachelor of Library and Information Science",
    "Bachelor of Science in Entertainment and Multimedia Computing"
  ];
  const programOptions = Array.from(new Set(programOptionsRaw));
  
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const [selectedForumId, setSelectedForumId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("all");
  
  // Subject combobox state
  const [subjectFilterComboboxOpen, setSubjectFilterComboboxOpen] = useState(false)
  const [subjectFilterSearchValue, setSubjectFilterSearchValue] = useState("")
  
  // New topic subject combobox state
  const [newTopicSubjectComboboxOpen, setNewTopicSubjectComboboxOpen] = useState(false)
  const [newTopicSubjectSearchValue, setNewTopicSubjectSearchValue] = useState("")
  
  // Edit topic subject combobox state
  const [editSubjectComboboxOpen, setEditSubjectComboboxOpen] = useState(false)
  const [editSubjectSearchValue, setEditSubjectSearchValue] = useState("")
  const [forums, setForums] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingForums, setLoadingForums] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Fetch forums from backend
  React.useEffect(() => {
    setLoadingForums(true);
    const userIdParam = currentUser?.user_id ? `?user_id=${currentUser.user_id}` : "";
    fetch(`http://localhost:4000/api/forums${userIdParam}`)
      .then((res) => res.json())
      .then((data) => {
        setForums(data.forums || []);
      })
      .catch(() => setForums([]))
      .finally(() => setLoadingForums(false));
  }, [currentUser]);

  // Fetch comments for selected forum
  React.useEffect(() => {
    if (!selectedForumId) return;
    setLoadingComments(true);
    fetch(`http://localhost:4000/api/forums/${selectedForumId}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data.comments || []);
      })
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [selectedForumId]);

  // Filter forums based on search term and selected subject
  const filteredForums = forums.filter((forum) => {
    // Subject filter: match subject_id (number) or 'all'
    const matchesSubject = selectedSubject === "all" || String(forum.subject_id) === String(selectedSubject);

    // Search filter: match title, topic, or subject_name
    const keyword = searchTerm.trim().toLowerCase();
    const matchesSearch =
      forum.title.toLowerCase().includes(keyword) ||
      forum.topic.toLowerCase().includes(keyword) ||
      (forum.subject_name && forum.subject_name.toLowerCase().includes(keyword));

    return matchesSubject && (keyword === "" || matchesSearch);
  });

  // Toggle forum comment section
  const handleCommentButtonClick = (forumId: string) => {
    setSelectedForumId(prev => prev === forumId ? null : forumId);
  };

  // Check if user can edit/delete a forum post
  const canManageForum = (forum: any) => {
    if (!currentUser) return false;
    const userRole = currentUser.role?.toLowerCase();
    return forum.created_by === currentUser.user_id || userRole === 'admin';
  };

  // Handle edit forum
  const handleEditForum = (forum: any) => {
    setEditingForum(forum);
    setEditTitle(forum.title);
    setEditDesc(forum.topic);
    setEditSubject(String(forum.subject_id));
    setEditError("");
    setShowEditModal(true);
  };

  // Submit edit
  const handleSubmitEdit = async () => {
    if (!editingForum || !currentUser) return;
    
    setEditLoading(true);
    setEditError("");
    
    try {
      const res = await fetch(`http://localhost:4000/api/forums/${editingForum.forum_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          topic: editDesc,
          subject_id: editSubject,
          user_id: currentUser.user_id
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log('✅ Forum updated successfully, response:', data);
        
        toast({
          title: "Success",
          description: "Forum post updated successfully",
        });
        setShowEditModal(false);
        
        // Refresh forums with proper user_id parameter
        console.log('🔄 Refreshing forums list...');
        const forumsRes = await fetch(`http://localhost:4000/api/forums?user_id=${currentUser.user_id}`);
        const forumsData = await forumsRes.json();
        console.log('📋 Refreshed forums data:', forumsData.forums?.length, 'forums');
        
        // Log first forum to check is_edited field
        if (forumsData.forums && forumsData.forums.length > 0) {
          const sampleForum = forumsData.forums.find((f: any) => f.forum_id === editingForum.forum_id);
          if (sampleForum) {
            console.log('🔍 Updated forum details:', {
              forum_id: sampleForum.forum_id,
              title: sampleForum.title,
              created_at: sampleForum.created_at,
              updated_at: sampleForum.updated_at,
              is_edited: sampleForum.is_edited,
              is_edited_type: typeof sampleForum.is_edited
            });
          }
        }
        
        setForums(forumsData.forums || []);
      } else {
        setEditError(data.error || "Failed to update forum post");
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to update forum post",
        });
      }
    } catch (error) {
      console.error('Error updating forum:', error);
      setEditError("Failed to update forum post. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update forum post. Please try again.",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete forum
  const handleDeleteForum = (forum: any) => {
    setDeletingForum(forum);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingForum || !currentUser) return;
    
    setDeleteLoading(true);
    
    try {
      const res = await fetch(`http://localhost:4000/api/forums/${deletingForum.forum_id}?user_id=${currentUser.user_id}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "Success",
          description: "Forum post deleted successfully",
        });
        setShowDeleteDialog(false);
        setDeletingForum(null);
        // Refresh forums
        const forumsRes = await fetch(`http://localhost:4000/api/forums?user_id=${currentUser.user_id}`);
        const forumsData = await forumsRes.json();
        setForums(forumsData.forums || []);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to delete forum post",
        });
      }
    } catch (error) {
      console.error('Error deleting forum:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete forum post. Please try again.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discussion Forums</h1>
          <p className="text-muted-foreground">Connect with peers and discuss academic topics</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNewTopicModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Topic
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search topics..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {/* Program Filter */}
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
                    const subject = subjects.find(s => String(s.subject_id) === selectedSubject);
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
                          setSelectedSubject(String(subject.subject_id))
                          setSubjectFilterComboboxOpen(false)
                          setSubjectFilterSearchValue("")
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSubject === String(subject.subject_id) ? "opacity-100" : "opacity-0"
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

      {/* New Topic Modal */}
      {showNewTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Create New Forum Topic</h2>
            <p className="text-sm text-muted-foreground mb-6">Start a discussion and connect with your peers</p>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Topic Title</label>
                <Input
                  placeholder="Enter a clear and descriptive title..."
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  className="text-base"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Popover open={newTopicSubjectComboboxOpen} onOpenChange={setNewTopicSubjectComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={newTopicSubjectComboboxOpen}
                      className="w-full justify-between"
                    >
                      {newTopicSubject ? (
                        (() => {
                          const subject = subjects.find(s => String(s.subject_id) === newTopicSubject);
                          return subject ? `${subject.subject_code ? `${subject.subject_code} - ` : ""}${subject.subject_name}` : newTopicSubject;
                        })()
                      ) : (
                        "Select a subject for this discussion"
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search subjects..." 
                        value={newTopicSubjectSearchValue}
                        onValueChange={setNewTopicSubjectSearchValue}
                      />
                      <CommandList>
                        {subjects && subjects
                          .filter((subject) => {
                            const searchTerm = newTopicSubjectSearchValue.toLowerCase();
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
                                setNewTopicSubject(String(subject.subject_id))
                                setNewTopicSubjectComboboxOpen(false)
                                setNewTopicSubjectSearchValue("")
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newTopicSubject === String(subject.subject_id) ? "opacity-100" : "opacity-0"
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
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="What would you like to discuss? Provide details, context, or questions..."
                  value={newTopicDesc}
                  onChange={e => setNewTopicDesc(e.target.value)}
                  className="min-h-[200px] resize-y text-base"
                  rows={8}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Be clear and specific to get the best responses from the community
                </p>
              </div>
            </div>
            
            {newTopicError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mt-4">
                {newTopicError}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNewTopicModal(false);
                  setNewTopicTitle("");
                  setNewTopicDesc("");
                  setNewTopicSubject("");
                  setNewTopicError("");
                }} 
                disabled={newTopicLoading}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-6"
                disabled={newTopicLoading || !newTopicTitle.trim() || !newTopicDesc.trim() || !newTopicSubject}
                onClick={async () => {
                  setNewTopicLoading(true);
                  setNewTopicError("");
                  const created_by = currentUser?.user_id;
                  if (!created_by) {
                    setNewTopicError("User not found. Please log in.");
                    setNewTopicLoading(false);
                    return;
                  }
                  const res = await fetch("http://localhost:4000/api/forums", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: newTopicTitle,
                      topic: newTopicDesc,
                      subject_id: newTopicSubject,
                      created_by
                    })
                  });
                  if (res.ok) {
                    setShowNewTopicModal(false);
                    setNewTopicTitle("");
                    setNewTopicDesc("");
                    setNewTopicSubject("");
                    // Refresh forums
                    fetch("http://localhost:4000/api/forums")
                      .then((r) => r.json())
                      .then((d) => setForums(d.forums || []));
                  } else {
                    setNewTopicError("Failed to create topic. Try again.");
                  }
                  setNewTopicLoading(false);
                }}
              >Create</Button>
            </div>
          </div>
        </div>
      )}

  {/* Facebook-style Forums Feed */}
  <div className="max-w-5xl mx-auto space-y-6">
    {loadingForums ? (
      <Card><CardContent className="p-4 text-center">Loading forums...</CardContent></Card>
    ) : filteredForums.length === 0 ? (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">
            {searchTerm || selectedSubject !== "all"
              ? "No forums found matching your filters."
              : "No forums available."}
          </p>
        </CardContent>
      </Card>
    ) : (
      filteredForums.map((forum) => (
        <Card
          key={forum.forum_id}
          className={`transition-colors mb-4 ${selectedForumId === forum.forum_id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={forum.avatar_url || "/placeholder-user.jpg"} alt={forum.created_by_name} />
                  <AvatarFallback>{forum.created_by_name ? forum.created_by_name.split(' ').map((n: string) => n[0]).join('') : '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{forum.created_by_name}</span>
                    <span className="text-xs text-muted-foreground">
                      • {new Date(forum.created_at).toLocaleString()}
                      {(forum.is_edited === 1 || forum.is_edited === true) && forum.updated_at && (
                        <span className="ml-1 italic">
                          (edited {new Date(forum.updated_at).toLocaleString()})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{forum.subject_name}</Badge>
                    {(forum.is_edited === 1 || forum.is_edited === true) && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                        Edited
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {/* Edit/Delete dropdown menu */}
              {canManageForum(forum) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditForum(forum)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteForum(forum)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <CardTitle className="text-lg mb-1">{forum.title}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">{forum.topic}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-4 pt-2 border-t mt-2">
              <Button
                size="sm"
                variant="ghost"
                className="flex items-center gap-1"
                onClick={async () => {
                  if (!currentUser?.user_id) return;
                  const res = await fetch(`http://localhost:4000/api/forums/${forum.forum_id}/like`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUser.user_id })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setForums(prevForums => prevForums.map(f =>
                      f.forum_id === forum.forum_id
                        ? { ...f, like_count: data.like_count, liked_by_current_user: data.liked }
                        : f
                    ));
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9l-5 5-5-5" /></svg>
                <span className="text-xs">{forum.liked_by_current_user ? 'Unlike' : 'Like'}</span>
                <span className="text-xs font-semibold">{forum.like_count || 0}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex items-center gap-1"
                onClick={() => handleCommentButtonClick(forum.forum_id)}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs">Comment</span>
                <span className="text-xs font-semibold">
                  {typeof forum.comment_count === 'number' ? forum.comment_count : 0}
                </span>
              </Button>
            </div>
            {/* Show comments and input only for selected forum */}
            {selectedForumId === forum.forum_id && (
              <div className="mt-6">
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground">
                    Comments ({comments.length})
                  </div>
                </div>
                <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
                  {loadingComments ? (
                    <div className="text-center text-muted-foreground">Loading comments...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center text-muted-foreground">No comments yet.</div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.comment_id} className="flex space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={"/placeholder-user.jpg"} alt={comment.user_name || comment.user_id} />
                          <AvatarFallback>{comment.user_name ? comment.user_name.split(' ').map((n: string) => n[0]).join('') : comment.user_id}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {currentUser && comment.user_id === currentUser.user_id
                                ? "You"
                                : comment.user_name && comment.user_name.trim() !== ""
                                  ? comment.user_name
                                  : (comment.first_name && comment.last_name)
                                    ? `${comment.first_name} ${comment.last_name}`
                                    : `User ${comment.user_id}`}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    className="flex-1"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                  />
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!newComment.trim()}
                    onClick={async () => {
                      const user_id = currentUser?.user_id;
                      if (!user_id) return;
                      const res = await fetch(`http://localhost:4000/api/forums/${selectedForumId}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id, comment: newComment })
                      });
                      if (res.ok) {
                        setNewComment("");
                        // Refresh comments
                        fetch(`http://localhost:4000/api/forums/${selectedForumId}/comments`)
                          .then((r) => r.json())
                          .then((d) => setComments(d.comments || []));
                        // Refresh forums to update comment counts
                        fetch("http://localhost:4000/api/forums")
                          .then((r) => r.json())
                          .then((d) => setForums(d.forums || []));
                      }
                    }}
                  >Send</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))
    )}
  </div>
  {/* Removed chat area below feed. Now comments appear inside the selected forum card. */}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Edit Forum Post</h2>
            <p className="text-sm text-muted-foreground mb-6">Update your discussion topic</p>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Topic Title</label>
                <Input
                  placeholder="Enter a clear and descriptive title..."
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="text-base"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Popover open={editSubjectComboboxOpen} onOpenChange={setEditSubjectComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={editSubjectComboboxOpen}
                      className="w-full justify-between"
                    >
                      {editSubject ? (
                        (() => {
                          const subject = subjects.find(s => String(s.subject_id) === editSubject);
                          return subject ? `${subject.subject_code ? `${subject.subject_code} - ` : ""}${subject.subject_name}` : editSubject;
                        })()
                      ) : (
                        "Select a subject for this discussion"
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search subjects..." 
                        value={editSubjectSearchValue}
                        onValueChange={setEditSubjectSearchValue}
                      />
                      <CommandList>
                        {subjects && subjects
                          .filter((subject) => {
                            const searchTerm = editSubjectSearchValue.toLowerCase();
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
                                setEditSubject(String(subject.subject_id))
                                setEditSubjectComboboxOpen(false)
                                setEditSubjectSearchValue("")
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  editSubject === String(subject.subject_id) ? "opacity-100" : "opacity-0"
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
              
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="What would you like to discuss? Provide details, context, or questions..."
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="min-h-[200px] resize-y text-base"
                  rows={8}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Be clear and specific to get the best responses from the community
                </p>
              </div>
            </div>
            
            {editError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mt-4">
                {editError}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingForum(null);
                  setEditError("");
                }} 
                disabled={editLoading}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-6"
                disabled={editLoading || !editTitle.trim() || !editDesc.trim() || !editSubject}
                onClick={handleSubmitEdit}
              >
                {editLoading ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this forum post and all its comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
