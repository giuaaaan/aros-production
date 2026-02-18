"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Plus, 
  Copy, 
  Check, 
  RefreshCw,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Invite {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  inviter: { email: string };
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [expiresIn, setExpiresIn] = useState("24");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async (status?: string) => {
    setLoading(true);
    try {
      let url = "/api/admin/invites";
      if (status) url += `?status=${status}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
      }
    } catch (err) {
      console.error("Error loading invites:", err);
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          expiresInHours: parseInt(expiresIn),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Invito creato! Link: ${data.invite.link}`);
        setEmail("");
        loadInvites();
      } else {
        setError(data.error || "Errore nella creazione invito");
      }
    } catch (err) {
      setError("Errore di rete");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("it-IT");
  };

  const getStatusBadge = (invite: Invite) => {
    if (invite.used_at) {
      return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Usato</Badge>;
    }
    if (new Date(invite.expires_at) < new Date()) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Scaduto</Badge>;
    }
    return <Badge variant="default" className="gap-1 bg-green-500"><Clock className="w-3 h-3" /> Attivo</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Inviti</h1>
          <p className="text-muted-foreground">
            Invita nuovi amministratori nel sistema
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form creazione invito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Crea Nuovo Invito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createInvite} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-500 bg-green-500/10 rounded-lg">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="nuovo.admin@azienda.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={creating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ruolo</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    disabled={creating}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Scadenza (ore)</label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    disabled={creating}
                  >
                    <option value="1">1 ora</option>
                    <option value="24">24 ore</option>
                    <option value="48">48 ore</option>
                    <option value="168">7 giorni</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creazione...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Crea Invito
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sicurezza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Ruoli disponibili:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Admin:</strong> Accesso completo tranne gestione utenti</li>
                <li><strong>Manager:</strong> Dashboard, report, gestione team</li>
                <li><strong>Viewer:</strong> Solo lettura dati e report</li>
              </ul>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <p className="text-sm text-yellow-700">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Gli inviti scadono automaticamente. Ogni link può essere usato solo una volta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista inviti */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Storico Inviti</CardTitle>
            <Button variant="outline" size="sm" onClick={() => loadInvites()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Aggiorna
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all" onClick={() => loadInvites()}>Tutti</TabsTrigger>
              <TabsTrigger value="pending" onClick={() => loadInvites("pending")}>In attesa</TabsTrigger>
              <TabsTrigger value="used" onClick={() => loadInvites("used")}>Usati</TabsTrigger>
              <TabsTrigger value="expired" onClick={() => loadInvites("expired")}>Scaduti</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nessun invito trovato
                </div>
              ) : (
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{invite.email}</span>
                          {getStatusBadge(invite)}
                          <Badge variant="outline">{invite.role}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Scade: {formatDate(invite.expires_at)}
                          {invite.used_at && (
                            <span className="ml-2">| Usato: {formatDate(invite.used_at)}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Invitato da: {invite.inviter?.email}
                        </div>
                      </div>

                      {!invite.used_at && new Date(invite.expires_at) > new Date() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(
                            `${window.location.origin}/signup?token=${invite.id}`,
                            invite.id
                          )}
                        >
                          {copiedId === invite.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending">
              {/* Stessa struttura, filtrata */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
