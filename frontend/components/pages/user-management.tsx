"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Search, MoreHorizontal, UserPlus, Filter, Download, Mail, Phone, ArrowUpDown, ChevronUp, ChevronDown, Grid3x3, TableIcon } from "lucide-react"

import UserAccountModal from "@/components/modals/useraccount_modal"
import UserDetailsModal, { UserActionsDropdown } from "@/components/modals/user-details-modal"
import EditUserModal from "@/components/modals/admin-edituser-modal"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/UserContext"
import { useRouter } from "next/navigation"
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

interface User {
  user_id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  program: string;
  role: string;
  status: string;
  year_level?: string;
  first_login: number;
  created_at: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const { currentUser } = useUser();
  const router = useRouter();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof User | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table'); // Default to table view
  const [currentPage, setCurrentPage] = useState(1);

  // Additional security check within the component
  useEffect(() => {
    if (currentUser && currentUser.role?.toLowerCase() !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access User Management.",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [currentUser, router, toast]);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by role
    if (selectedRole !== "all") {
      filtered = filtered.filter(user => user.role.toLowerCase() === selectedRole.toLowerCase());
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.first_name.toLowerCase().includes(searchLower) ||
        user.last_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.program.toLowerCase().includes(searchLower) ||
        (user.middle_name && user.middle_name.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [users, searchTerm, selectedRole, sortColumn, sortDirection]);

  // Calculate pagination
  const itemsPerPage = viewMode === 'card' ? 12 : 10; // 12 for card view, 10 for table view
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  // Reset to page 1 when view mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  const handleSort = (column: keyof User) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:4000/api/users', {
        headers: {
          'x-user-id': currentUser?.user_id ? String(currentUser.user_id) : '',
          'x-user-role': currentUser?.role || '',
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };    const handleAddUser = async (userData: any) => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.user_id ? String(currentUser.user_id) : '',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Refresh the user list
      await fetchUsers();
      
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  // Helper functions
  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  const handleCloseUserDetailsModal = () => {
    setShowUserDetailsModal(false);
    setSelectedUser(null);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setShowEditUserModal(true);
    // Close details modal if it's open
    setShowUserDetailsModal(false);
  };

  const handleCloseEditUserModal = () => {
    setShowEditUserModal(false);
    setUserToEdit(null);
  };

  const handleUserUpdated = () => {
    fetchUsers(); // Refresh the user list
  };

  const handleDeactivateUser = (user: User) => {
    setUserToDeactivate(user);
    setShowDeactivateModal(true);
  };

  const confirmDeactivateUser = async () => {
    if (!userToDeactivate) return;

    try {
      const response = await fetch(`http://localhost:4000/api/admin/edit-user/${userToDeactivate.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-id': currentUser?.user_id ? String(currentUser.user_id) : '',
        },
        body: JSON.stringify({
          first_name: userToDeactivate.first_name,
          middle_name: userToDeactivate.middle_name,
          last_name: userToDeactivate.last_name,
          email: userToDeactivate.email,
          program: userToDeactivate.program,
          role: userToDeactivate.role,
          status: 'Inactive',
          year_level: userToDeactivate.year_level
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate user');
      }

      toast({
        title: "Success",
        description: `User ${userToDeactivate.first_name} ${userToDeactivate.last_name} has been deactivated.`,
        duration: 3000,
      });

      // Refresh the user list
      fetchUsers();
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate user. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setShowDeactivateModal(false);
      setUserToDeactivate(null);
    }
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

    const getBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role.toLowerCase()) {
      case 'admin': return 'destructive';
      case 'faculty': return 'default';
      case 'tutor': return 'outline';
      case 'student': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and their roles</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowAddUserModal(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users by name, email, or program..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className={`rounded-none ${viewMode === 'card' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`rounded-none ${viewMode === 'table' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  <TableIcon className="h-4 w-4 mr-2" />
                  Table
                </Button>
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="tutor">Tutor</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || selectedRole !== "all") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedRole("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {loading ? 'Loading users...' : 
             searchTerm || selectedRole !== "all" 
               ? `Showing ${filteredUsers.length} of ${users.length} users`
               : `${users.length} total users registered`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <MoreHorizontal className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Error Loading Users
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                  {error}
                </p>
                <Button onClick={fetchUsers} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm || selectedRole !== "all" ? "No matching users found" : "No users found"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                {searchTerm || selectedRole !== "all" 
                  ? "Try adjusting your search criteria or filters."
                  : "Get started by adding your first user to the platform."
                }
              </p>
              {!(searchTerm || selectedRole !== "all") && (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowAddUserModal(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First User
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Card View */}
              {viewMode === 'card' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedUsers.map((user) => (
                      <Card key={user.user_id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                                {getUserInitials(user.first_name, user.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate text-sm">
                                {user.first_name} {user.middle_name && `${user.middle_name} `}{user.last_name}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <UserActionsDropdown 
                              user={user} 
                              onViewDetails={handleViewUserDetails}
                              onEditUser={handleEditUser}
                              onDeactivateUser={handleDeactivateUser}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant={getBadgeVariant(user.role)} className="text-xs">
                              {user.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {user.status === 'Active' ? 'Active' : user.status}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-muted-foreground truncate">
                                {user.program}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Joined {formatDate(user.created_at)}
                            </div>
                            {user.first_login === 0 && (
                              <div className="text-xs text-amber-600 dark:text-amber-400">
                                First login pending
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewUserDetails(user)}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Pagination info */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                      {(searchTerm || selectedRole !== "all") && (
                        <span className="ml-2 text-blue-600">
                          (filtered from {users.length} total)
                        </span>
                      )}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground mr-2">
                        Page {currentPage} of {totalPages || 1}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('first_name')}
                            className="h-8 px-2 hover:bg-transparent"
                          >
                            Name
                            {sortColumn === 'first_name' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('email')}
                            className="h-8 px-2 hover:bg-transparent"
                          >
                            Email
                            {sortColumn === 'email' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('role')}
                            className="h-8 px-2 hover:bg-transparent"
                          >
                            Role
                            {sortColumn === 'role' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('program')}
                            className="h-8 px-2 hover:bg-transparent"
                          >
                            Program
                            {sortColumn === 'program' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('year_level')}
                            className="h-8 px-2 hover:bg-transparent"
                          >
                            Year Level
                            {sortColumn === 'year_level' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('status')}
                            className="h-8 px-2 hover:bg-transparent"
                          >
                            Status
                            {sortColumn === 'status' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            onClick={() => handleSort('created_at')}
                            className="h-8 px-2 hover:bg-transparent"
                          >
                            Joined
                            {sortColumn === 'created_at' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((user, index) => (
                        <TableRow key={user.user_id} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-muted-foreground">
                            {((currentPage - 1) * itemsPerPage) + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-semibold">
                                  {getUserInitials(user.first_name, user.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {user.first_name} {user.middle_name && `${user.middle_name} `}{user.last_name}
                                </span>
                                {user.first_login === 0 && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400">
                                    First login pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getBadgeVariant(user.role)} className="text-xs">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{user.program}</TableCell>
                          <TableCell className="text-sm">{user.year_level || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.status === 'Active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewUserDetails(user)}
                              >
                                View
                              </Button>
                              <UserActionsDropdown 
                                user={user} 
                                onViewDetails={handleViewUserDetails}
                                onEditUser={handleEditUser}
                                onDeactivateUser={handleDeactivateUser}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination info */}
                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                      {(searchTerm || selectedRole !== "all") && (
                        <span className="ml-2 text-blue-600">
                          (filtered from {users.length} total)
                        </span>
                      )}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground mr-2">
                        Page {currentPage} of {totalPages || 1}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>      {/* User Account Modal */}
      <UserAccountModal 
        open={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleAddUser}
      />

      {/* User Details Modal */}
      <UserDetailsModal 
        user={selectedUser}
        isOpen={showUserDetailsModal}
        onClose={handleCloseUserDetailsModal}
        onEditUser={handleEditUser}
      />

      {/* Edit User Modal */}
      <EditUserModal 
        user={userToEdit}
        isOpen={showEditUserModal}
        onClose={handleCloseEditUserModal}
        onUserUpdated={handleUserUpdated}
      />

      {/* Deactivate User Confirmation Modal */}
      <AlertDialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User Account</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDeactivate && (
                <>
                  Are you sure you want to deactivate <strong>{userToDeactivate.first_name} {userToDeactivate.last_name}</strong>'s account?
                  <br /><br />
                  This will disable their access to the system. They will no longer be able to log in or use any features.
                  <br /><br />
                  This action can be reversed by reactivating the account later.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeactivateModal(false);
              setUserToDeactivate(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeactivateUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Deactivate Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
