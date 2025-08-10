'use client';

import React, { useState } from 'react';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Select } from '@starter/ui/select';
import { Badge } from '@starter/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@starter/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@starter/ui/table';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Crown,
  Users,
  Filter,
  X 
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  has_llm_access?: boolean;
  company_id?: string;
  companyName?: string;
  protection?: {
    isProtected: boolean;
    isOwner: boolean;
    protectionReason?: string;
    displayBadge: boolean;
    disableActions: string[];
  };
  _creationTime: number;
}

interface UserTableProps {
  users: User[];
  loading?: boolean;
  searchTerm?: string;
  roleFilter?: string;
  onSearchChange?: (search: string) => void;
  onRoleFilterChange?: (role: string) => void;
  onCreateUser?: () => void;
  onEditUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
  showCreateButton?: boolean;
  showCompanyColumn?: boolean;
  title?: string;
  className?: string;
}

const ROLE_LABELS = {
  system_admin: 'System Admin',
  company_admin: 'Company Admin', 
  team_lead: 'Team Lead',
  frontline_worker: 'Frontline Worker'
};

const ROLE_COLORS = {
  system_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  company_admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  team_lead: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  frontline_worker: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

/**
 * Reusable user table component with search and filtering
 * Story 2.6 AC 2.6.1 & AC 2.6.2: User Management Interface
 */
export function UserTable({
  users,
  loading = false,
  searchTerm = '',
  roleFilter = 'all',
  onSearchChange,
  onRoleFilterChange,
  onCreateUser,
  onEditUser,
  onDeleteUser,
  showCreateButton = true,
  showCompanyColumn = false,
  title = 'User Management',
  className = ''
}: UserTableProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  const handleClearSearch = () => {
    onSearchChange?.('');
  };

  const handleClearRoleFilter = () => {
    onRoleFilterChange?.('all');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'system_admin':
        return <Crown className="h-3 w-3" />;
      case 'company_admin':
        return <Shield className="h-3 w-3" />;
      case 'team_lead':
        return <Users className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const isActionDisabled = (user: User, action: string) => {
    return user.protection?.disableActions.includes(action) || false;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title}
            <span className="text-sm font-normal text-muted-foreground">
              ({users.length} users)
            </span>
          </CardTitle>
          
          {showCreateButton && onCreateUser && (
            <Button onClick={onCreateUser} className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Role Filter */}
          <div className="relative min-w-[180px]">
            <Select value={roleFilter} onValueChange={onRoleFilterChange}>
              <option value="all">All Roles</option>
              <option value="system_admin">System Admin</option>
              <option value="company_admin">Company Admin</option>
              <option value="team_lead">Team Lead</option>
              <option value="frontline_worker">Frontline Worker</option>
            </Select>
            {roleFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearRoleFilter}
                className="absolute right-8 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading users...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-sm text-muted-foreground text-center">
              {searchTerm || roleFilter !== 'all' ? 
                'No users match your search criteria.' : 
                'No users found.'
              }
            </div>
            {(searchTerm || roleFilter !== 'all') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  handleClearSearch();
                  handleClearRoleFilter();
                }}
                className="mt-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  {showCompanyColumn && <TableHead>Company</TableHead>}
                  <TableHead>LLM Access</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            {user.protection?.displayBadge && (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300"
                              >
                                <Crown className="h-3 w-3 mr-1" />
                                Owner
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={ROLE_COLORS[user.role]}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{ROLE_LABELS[user.role]}</span>
                      </Badge>
                    </TableCell>
                    
                    {showCompanyColumn && (
                      <TableCell>
                        <div className="text-sm">
                          {user.companyName || 'No Company'}
                        </div>
                      </TableCell>
                    )}
                    
                    <TableCell>
                      {user.has_llm_access ? (
                        <Badge className="bg-green-100 text-green-800">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(user._creationTime)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditUser?.(user)}
                          disabled={isActionDisabled(user, 'role_change')}
                          title={user.protection?.protectionReason}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteUser?.(user)}
                          disabled={isActionDisabled(user, 'delete')}
                          title={user.protection?.protectionReason}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}