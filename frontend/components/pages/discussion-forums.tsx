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

export default function DiscussionForums() {
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
    const matchesSearch = forum.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         forum.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === "all" || forum.subject_id === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discussion Forums</h1>
          <p className="text-muted-foreground">Connect with peers and discuss academic topics</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
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
                <SelectItem key={subject.subject_id} value={subject.subject_name}>
                  {subject.subject_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Forums List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Forum Topics</h2>
          {loadingForums ? (
            <Card><CardContent className="p-4 text-center">Loading forums...</CardContent></Card>
          ) : filteredForums.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground">
                  {searchTerm || selectedSubject !== "all" 
                    ? "No forums found matching your filters." 
                    : "No forums available."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredForums.map((forum) => (
              <Card
                key={forum.forum_id}
                className={`cursor-pointer transition-colors ${selectedForumId === forum.forum_id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                onClick={() => setSelectedForumId(forum.forum_id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{forum.title}</CardTitle>
                  <CardDescription className="text-sm">{forum.topic}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Badge variant="secondary">Subject: {forum.subject_id}</Badge>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>By {forum.created_by}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(forum.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedForumId ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle>Forum Discussion</CardTitle>
                <CardDescription>Comments & Replies</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                  {loadingComments ? (
                    <div className="text-center text-muted-foreground">Loading comments...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center text-muted-foreground">No comments yet.</div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.comment_id} className="flex space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={"/placeholder-user.jpg"} alt={comment.user_id} />
                          <AvatarFallback>{comment.user_id}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">User {comment.user_id}</span>
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
                      // TODO: Replace with actual user_id
                      const user_id = 1;
                      const res = await fetch(`http://localhost:4000/api/forums/${selectedForumId}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id, comment: newComment })
                      });
                      if (res.ok) {
                        setNewComment("");
                        // Refresh comments
                        const data = await res.json();
                        fetch(`http://localhost:4000/api/forums/${selectedForumId}/comments`)
                          .then((r) => r.json())
                          .then((d) => setComments(d.comments || []));
                      }
                    }}
                  >Send</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Select a forum topic to start chatting</h3>
                <p className="text-muted-foreground">
                  Choose a forum topic from the left to join the conversation
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
