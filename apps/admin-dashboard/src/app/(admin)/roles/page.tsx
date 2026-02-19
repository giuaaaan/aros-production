"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Plus, 
  Users, 
  Key,
  Check,
  X,
  Edit2,
  Trash2,
  UserCog,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

const availablePermissions: Permission[] = [
  { id: "org:read", resource: "Organizations", action: "Read", description: "View organizations" },
  { id: "org:create", resource: "Organizations", action: "Create", description: "Create new organizations" },
  { id: "org:update", resource: "Organizations", action: "Update", description: "Edit organizations" },
  { id: "org:delete", resource: "Organizations", action: "Delete", description: "Delete organizations" },
  { id: "user:read", resource: "Users", action: "Read", description: "View users" },
  { id: "user:create", resource: "Users", action: "Create", description: "Create users" },
  { id: "user:update", resource: "Users", action: "Update", description: "Edit users" },
  { id: "user:delete", resource: "Users", action: "Delete", description: "Delete users" },
  { id: "analytics:read", resource: "Analytics", action: "Read", description: "View analytics" },
  { id: "reports:read", resource: "Reports", action: "Read", description: "View reports" },
  { id: "reports:export", resource: "Reports", action: "Export", description: "Export reports" },
  { id: "system:read", resource: "System", action: "Read", description: "View system health" },
  { id: "system:manage", resource: "System", action: "Manage", description: "Manage system settings" },
  { id: "flags:read", resource: "Feature Flags", action: "Read", description: "View feature flags" },
  { id: "flags:write", resource: "Feature Flags", action: "Write", description: "Manage feature flags" },
  { id: "experiments:read", resource: "Experiments", action: "Read", description: "View experiments" },
  { id: "experiments:write", resource: "Experiments", action: "Write", description: "Manage experiments" },
  { id: "audit:read", resource: "Audit Logs", action: "Read", description: "View audit logs" },
  { id: "roles:read", resource: "Roles", action: "Read", description: "View roles" },
  { id: "roles:write", resource: "Roles", action: "Write", description: "Manage roles" },
];

const mockRoles: Role[] = [
  {
    id: "1",
    name: "Super Admin",
    description: "Full access to all features and settings",
    permissions: availablePermissions.map(p => p.id),
    userCount: 2,
    isSystem: true,
  },
  {
    id: "2",
    name: "Admin",
    description: "Manage organizations, users, and view analytics",
    permissions: ["org:read", "org:create", "org:update", "user:read", "user:create", "user:update", "analytics:read", "reports:read", "reports:export", "system:read", "flags:read", "flags:write", "experiments:read", "audit:read"],
    userCount: 5,
    isSystem: true,
  },
  {
    id: "3",
    name: "Support",
    description: "View organizations and users, no edit permissions",
    permissions: ["org:read", "user:read", "analytics:read", "system:read", "audit:read"],
    userCount: 8,
    isSystem: true,
  },
  {
    id: "4",
    name: "Analyst",
    description: "View analytics and reports only",
    permissions: ["analytics:read", "reports:read", "reports:export"],
    userCount: 3,
    isSystem: false,
  },
];

const resourceGroups = [
  { name: "Organizations", permissions: availablePermissions.filter(p => p.resource === "Organizations") },
  { name: "Users", permissions: availablePermissions.filter(p => p.resource === "Users") },
  { name: "Analytics & Reports", permissions: availablePermissions.filter(p => p.resource === "Analytics" || p.resource === "Reports") },
  { name: "System", permissions: availablePermissions.filter(p => p.resource === "System") },
  { name: "Feature Management", permissions: availablePermissions.filter(p => p.resource === "Feature Flags" || p.resource === "Experiments") },
  { name: "Security", permissions: availablePermissions.filter(p => p.resource === "Audit Logs" || p.resource === "Roles") },
];

export default function RolesPage() {
  const [roles] = useState<Role[]>(mockRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(mockRoles[0]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("roles");

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(search.toLowerCase()) ||
      role.description.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalRoles: roles.length,
    systemRoles: roles.filter(r => r.isSystem).length,
    customRoles: roles.filter(r => !r.isSystem).length,
    totalUsers: roles.reduce((sum, r) => sum + r.userCount, 0),
  };

  return (
    <div>
      <Header
        title="Role Management"
        description="Manage roles and permissions for admin users"
      />
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Roles</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalRoles}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">System Roles</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.systemRoles}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCog className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Custom Roles</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.customRoles}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Assigned Users</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="users">User Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4 mt-4">
            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Input
                  placeholder="Search roles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Role
              </Button>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Role List */}
              <div className="space-y-2">
                {filteredRoles.map((role) => (
                  <Card
                    key={role.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedRole?.id === role.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedRole(role)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{role.name}</CardTitle>
                            {role.isSystem && (
                              <Badge variant="outline" className="text-xs">System</Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs mt-1">
                            {role.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          {role.permissions.length} permissions
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {role.userCount} users
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {/* Role Details */}
              {selectedRole && (
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{selectedRole.name}</CardTitle>
                        {selectedRole.isSystem && (
                          <Badge variant="outline">System Role</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {selectedRole.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      {!selectedRole.isSystem && (
                        <Button variant="outline" size="sm" className="gap-2 text-red-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="text-sm font-medium mb-3">Permissions</h4>
                    <div className="space-y-4">
                      {resourceGroups.map((group) => {
                        const groupPerms = group.permissions.filter(p => 
                          selectedRole.permissions.includes(p.id)
                        );
                        if (groupPerms.length === 0) return null;
                        
                        return (
                          <div key={group.name}>
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              {group.name}
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {groupPerms.map((perm) => (
                                <Badge
                                  key={perm.id}
                                  variant="secondary"
                                  className="font-normal"
                                >
                                  {perm.action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Permissions</CardTitle>
                <CardDescription>
                  Available permissions in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {resourceGroups.map((group) => (
                    <div key={group.name}>
                      <h4 className="text-sm font-medium mb-3">{group.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.permissions.map((perm) => (
                          <div
                            key={perm.id}
                            className="flex items-start gap-3 p-3 rounded-lg border"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                  {perm.id}
                                </code>
                                <Badge variant="outline" className="text-xs">
                                  {perm.action}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {perm.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Assignments</CardTitle>
                <CardDescription>
                  Manage which users have which roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>User assignment management coming soon</p>
                  <p className="text-sm mt-1">
                    Currently {stats.totalUsers} users assigned across {stats.totalRoles} roles
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
