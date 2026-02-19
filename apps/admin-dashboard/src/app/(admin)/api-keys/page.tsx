"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff,
  Trash2,
  RefreshCw,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
  scopes: string[];
  status: "active" | "revoked" | "expired";
  rate_limit: number;
  usage_count: number;
}

const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production API Key",
    key: "ak_live_51Hx9m2eZvKYlo2C0xJq4pL8nM3kQ7wR5tY6uI9oP0aS1dF4gH7jK0lZ3xC6vB9nM2qW5eR8tY1uI4oP7aS0dF3g",
    prefix: "ak_live_51Hx",
    created_at: "2026-01-15T10:00:00Z",
    last_used_at: "2026-02-19T08:30:00Z",
    scopes: ["read:organizations", "read:analytics", "write:appointments"],
    status: "active",
    rate_limit: 1000,
    usage_count: 4523,
  },
  {
    id: "2",
    name: "Staging API Key",
    key: "ak_test_42Jy0n3fAwKLmp3D1yKr5qM9oN4lR8xS6uV0wI1pQ2bT5cH8kL1mN4pA7dF0gH3jK6lN9qW2eR5tY8uI1oP4aS7dF0gH3j",
    prefix: "ak_test_42Jy",
    created_at: "2026-02-01T14:00:00Z",
    last_used_at: "2026-02-18T16:45:00Z",
    scopes: ["read:organizations", "read:analytics", "read:users", "write:users"],
    status: "active",
    rate_limit: 100,
    usage_count: 234,
  },
  {
    id: "3",
    name: "Mobile App Key",
    key: "ak_live_73Kz2p5hBxMNop6E3zLs8t0pQ7mU1yV3wX2zJ4qR5cT8dI9lM2nO5pB8eG1hI4kL7mN0qW3eR6tY9uI2oP5aS8dF1gH4j",
    prefix: "ak_live_73Kz",
    created_at: "2025-12-01T09:00:00Z",
    last_used_at: "2026-01-20T11:00:00Z",
    expires_at: "2026-06-01T00:00:00Z",
    scopes: ["read:organizations"],
    status: "expired",
    rate_limit: 500,
    usage_count: 8912,
  },
  {
    id: "4",
    name: "Integration Partner",
    key: "ak_live_84La3q6iCyNOpq7F4aMt9u1qR8nV2zW4xY3aK5rS6dU9eJ0mN3oP6qC9fH2iJ5kL8mN1qW4eR7tY0uI3oP6aS9dF2gH5j",
    prefix: "ak_live_84La",
    created_at: "2026-01-20T16:00:00Z",
    scopes: ["read:organizations", "read:analytics"],
    status: "revoked",
    rate_limit: 2000,
    usage_count: 156,
  },
];

const availableScopes = [
  { id: "read:organizations", name: "Read Organizations", description: "View organization data" },
  { id: "write:organizations", name: "Write Organizations", description: "Create and modify organizations" },
  { id: "read:users", name: "Read Users", description: "View user data" },
  { id: "write:users", name: "Write Users", description: "Create and modify users" },
  { id: "read:analytics", name: "Read Analytics", description: "Access analytics and reports" },
  { id: "read:appointments", name: "Read Appointments", description: "View appointments" },
  { id: "write:appointments", name: "Write Appointments", description: "Create and modify appointments" },
  { id: "read:system", name: "Read System", description: "View system health" },
  { id: "admin", name: "Admin", description: "Full admin access" },
];

const statusConfig = {
  active: { label: "Active", color: "bg-green-500/10 text-green-500", icon: CheckCircle },
  revoked: { label: "Revoked", color: "bg-red-500/10 text-red-500", icon: XCircle },
  expired: { label: "Expired", color: "bg-gray-500/10 text-gray-500", icon: Clock },
};

function formatDate(dateString?: string): string {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 30) return `${diffInDays} days ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

export default function ApiKeysPage() {
  const [apiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredKeys = apiKeys.filter(
    (key) =>
      key.name.toLowerCase().includes(search.toLowerCase()) ||
      key.prefix.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter((k) => k.status === "active").length,
    revoked: apiKeys.filter((k) => k.status === "revoked").length,
    expired: apiKeys.filter((k) => k.status === "expired").length,
    totalUsage: apiKeys.reduce((sum, k) => sum + k.usage_count, 0),
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("API key copied to clipboard!");
  };

  return (
    <div>
      <Header
        title="API Access Management"
        description="Manage API keys and access tokens"
      />
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Keys</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Revoked</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.revoked}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-muted-foreground">Expired</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.expired}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Calls</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalUsage.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-600">Security Notice</p>
              <p className="text-sm text-muted-foreground mt-1">
                API keys provide full access to your data. Keep them secure and never share them publicly.
                Rotate keys regularly and revoke unused keys immediately.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Input
              placeholder="Search API keys..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Create API Key
          </Button>
        </div>

        {/* API Keys List */}
        <div className="space-y-4">
          {filteredKeys.map((apiKey) => {
            const status = statusConfig[apiKey.status];
            const StatusIcon = status.icon;
            const isShowing = showKey === apiKey.id;

            return (
              <Card key={apiKey.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-lg", status.color)}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                          <Badge variant="outline" className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          Prefix: <code className="text-xs bg-muted px-1 rounded">{apiKey.prefix}</code>
                          {" • "}
                          Created: {formatDate(apiKey.created_at)}
                          {apiKey.expires_at && (
                            <>
                              {" • "}
                              Expires: {formatDate(apiKey.expires_at)}
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apiKey.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setShowKey(isShowing ? null : apiKey.id)}
                          >
                            {isShowing ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                            {isShowing ? "Hide" : "Show"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* API Key Display */}
                  <div className="mb-4">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      API Key
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all">
                        {isShowing ? apiKey.key : `${apiKey.key.slice(0, 20)}...${apiKey.key.slice(-4)}`}
                      </code>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Last Used</p>
                      <p className="font-medium">{formatRelativeTime(apiKey.last_used_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Requests</p>
                      <p className="font-medium">{apiKey.usage_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rate Limit</p>
                      <p className="font-medium">{apiKey.rate_limit}/min</p>
                    </div>
                  </div>

                  {/* Scopes */}
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Scopes ({apiKey.scopes.length})
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {apiKey.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="font-normal">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredKeys.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No API keys found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first API key to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
