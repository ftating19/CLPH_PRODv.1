"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageSquare, Users, Clock, Plus } from "lucide-react"

export default function DiscussionForums() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  const topics = [
    {
      id: "1",
      title: "Data Structures Help",
      description: "Get help with arrays, linked lists, trees, and more",
      category: "Computer Science",
      members: 234,
      posts: 1456,
      lastActivity: "2 minutes ago",
    },
    {
      id: "2",
      title: "Calculus Study Group",
      description: "Collaborative learning for calculus concepts",
      category: "Mathematics",
      members: 189,
      posts: 892,
      lastActivity: "15 minutes ago",
    },
    {
      id: "3",
      title: "Database Design Discussion",
      description: "Share database design patterns and best practices",
      category: "Database Systems",
      members: 156,
      posts: 678,
      lastActivity: "1 hour ago",
    },
  ]

  const messages = [
    {
      id: "1",
      user: "Sarah Chen",
      avatar: "/placeholder-eukew.png",
      message:
        "Can someone help me understand binary tree traversal? I'm confused about the difference between inorder and preorder.",
      timestamp: "2 minutes ago",
      replies: 3,
    },
    {
      id: "2",
      user: "Mark Rodriguez",
      avatar: "/placeholder-mzgr5.png",
      message:
        "Inorder traversal visits left subtree, root, then right subtree. Preorder visits root first, then left and right subtrees.",
      timestamp: "1 minute ago",
      replies: 0,
    },
  ]

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
          <Input placeholder="Search topics..." className="pl-10" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Topics List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Topics</h2>
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className={`cursor-pointer transition-colors ${selectedTopic === topic.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
              onClick={() => setSelectedTopic(topic.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{topic.title}</CardTitle>
                <CardDescription className="text-sm">{topic.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Badge variant="secondary">{topic.category}</Badge>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{topic.members}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{topic.posts}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{topic.lastActivity}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedTopic ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle>Data Structures Help</CardTitle>
                <CardDescription>234 members • 1,456 posts</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.user} />
                        <AvatarFallback>
                          {message.user
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{message.user}</span>
                          <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        {message.replies > 0 && (
                          <Button variant="ghost" size="sm" className="text-xs">
                            {message.replies} replies
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input placeholder="Type your message..." className="flex-1" />
                  <Button className="bg-blue-600 hover:bg-blue-700">Send</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Select a topic to start chatting</h3>
                <p className="text-muted-foreground">
                  Choose a discussion topic from the left to join the conversation
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
