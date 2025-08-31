"use client"
import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageSquare, Users, Clock, Plus, Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSubjects } from "@/hooks/use-subjects"
import { useUser } from "@/contexts/UserContext"

export default function DiscussionForums() {
  // ...existing code...
  const { currentUser } = useUser();
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [newTopicSubject, setNewTopicSubject] = useState("");
  const [newTopicLoading, setNewTopicLoading] = useState(false);
  const [newTopicError, setNewTopicError] = useState("");
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const [selectedForumId, setSelectedForumId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [forums, setForums] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingForums, setLoadingForums] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Fetch forums from backend
  React.useEffect(() => {
    setLoadingForums(true);
    fetch("http://localhost:4000/api/forums")
      .then((res) => res.json())
      .then((data) => {
        setForums(data.forums || []);
      })
      .catch(() => setForums([]))
      .finally(() => setLoadingForums(false));
  }, []);

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
          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={subjectsLoading || !!subjectsError}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={subjectsLoading ? "Loading..." : subjectsError ? "Error loading subjects" : "Filter by subject"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {!subjectsLoading && !subjectsError && subjects.map((subject) => (
                <SelectItem key={subject.subject_id} value={String(subject.subject_id)}>
                  {subject.subject_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* New Topic Modal */}
      {showNewTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Forum Topic</h2>
            <div className="space-y-3">
              <Input
                placeholder="Title"
                value={newTopicTitle}
                onChange={e => setNewTopicTitle(e.target.value)}
              />
              <Input
                placeholder="Description"
                value={newTopicDesc}
                onChange={e => setNewTopicDesc(e.target.value)}
              />
              <Select
                value={newTopicSubject}
                onValueChange={setNewTopicSubject}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects && subjects.map((subject) => (
                    <SelectItem key={subject.subject_id} value={String(subject.subject_id)}>{subject.subject_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newTopicError && <div className="text-red-500 text-sm mt-2">{newTopicError}</div>}
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowNewTopicModal(false)} disabled={newTopicLoading}>Cancel</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
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
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={forum.avatar_url || "/placeholder-user.jpg"} alt={forum.created_by_name} />
                <AvatarFallback>{forum.created_by_name ? forum.created_by_name.split(' ').map((n: string) => n[0]).join('') : '?'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{forum.created_by_name}</span>
                  <span className="text-xs text-muted-foreground">• {new Date(forum.created_at).toLocaleString()}</span>
                </div>
                <Badge variant="secondary" className="text-xs mt-1">{forum.subject_name}</Badge>
              </div>
            </div>
            <CardTitle className="text-lg mb-1">{forum.title}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">{forum.topic}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-4 pt-2 border-t mt-2">
              <Button size="sm" variant="ghost" className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9l-5 5-5-5" /></svg>
                <span className="text-xs">Like</span>
                <span className="text-xs font-semibold">{forum.likes || 0}</span>
              </Button>
              <Button size="sm" variant="ghost" className="flex items-center gap-1" onClick={() => setSelectedForumId(forum.forum_id)}>
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
    </div>
  )
}
