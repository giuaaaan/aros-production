"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Filter, AlertCircle, Shield } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  user: { email: string };
  ip_address: string;
  severity: string;
  created_at: string;
  metadata: any;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [severity, setSeverity] = useState<string>("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/audit";
      if (severity) url += `?severity=${severity}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("it-IT");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "error": return "bg-red-400";
      case "warning": return "bg-yellow-500";
      default: return "bg-blue-500";
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.user?.email?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">
          Tracciamento completo delle attività nel sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Log Attività</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filtra per azione o utente..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun log trovato
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                        <span className="font-medium">{log.action}</span>
                        <Badge variant="outline">{log.resource_type}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Utente: {log.user?.email || "Sistema"} | 
                        IP: {log.ip_address || "N/A"} | 
                        {formatDate(log.created_at)}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Metadata: {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
