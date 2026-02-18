"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, CheckCircle2, AlertCircle, Shield, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type InviteStatus = "validating" | "valid" | "invalid" | "expired" | "used" | null;

// Wrapper with Suspense for useSearchParams
export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupForm />
    </Suspense>
  );
}

function SignupLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    </div>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const inviteCodeFromUrl = searchParams.get("invite");
  
  const [token, setToken] = useState(tokenFromUrl || "");
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>(tokenFromUrl ? "validating" : null);
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const supabase = createClient();

  // Valida token all'apertura pagina
  useEffect(() => {
    if (tokenFromUrl) {
      validateToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const validateToken = async (tokenToValidate: string) => {
    setInviteStatus("validating");
    try {
      const res = await fetch(`/api/admin/invites/verify?token=${tokenToValidate}`);
      const data = await res.json();
      
      if (res.ok && data.valid) {
        setInviteStatus("valid");
        setInviteRole(data.role);
      } else if (res.status === 410) {
        setInviteStatus(data.error === "Token expired" ? "expired" : "used");
      } else {
        setInviteStatus("invalid");
      }
    } catch {
      setInviteStatus("invalid");
    }
  };

  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    setPasswordStrength(score);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validazioni
    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri");
      setLoading(false);
      return;
    }

    // Verifica token se presente
    if (token) {
      const res = await fetch(`/api/admin/invites/verify?token=${token}`);
      if (!res.ok) {
        setError("Token di invito non valido o scaduto");
        setLoading(false);
        return;
      }
    }

    try {
      // 1. Crea utente in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError("Errore nella creazione utente");
        return;
      }

      // 2. Crea profilo con ruolo appropriato
      const role = inviteRole || "viewer";
      const { error: profileError } = await (supabase
        .from("profiles") as any)
        .insert({
          id: authData.user.id,
          role,
        });

      if (profileError) {
        setError("Errore nel creare il profilo utente");
        return;
      }

      // 3. Marca invito come usato
      if (token) {
        await fetch("/api/admin/invites/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, user_id: authData.user.id }),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError("Errore imprevisto durante la registrazione");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-yellow-500";
    if (passwordStrength === 3) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return "Debole";
    if (passwordStrength === 2) return "Media";
    if (passwordStrength === 3) return "Buona";
    return "Forte";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-2xl leading-none">AROS</h1>
            <p className="text-sm text-muted-foreground">Enterprise Admin Console</p>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Registrazione Admin</CardTitle>
            <CardDescription className="text-center">
              {inviteStatus === "valid" 
                ? "Completa la registrazione con il tuo invito" 
                : "Inserisci un token di invito valido"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Account Creato!</h3>
                <p className="text-muted-foreground mb-4">
                  Reindirizzamento al login in corso...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 flex items-start gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Stato invito */}
                {inviteStatus && (
                  <div className={`p-3 rounded-lg border ${
                    inviteStatus === "valid" ? "bg-green-500/10 border-green-500/20" :
                    inviteStatus === "validating" ? "bg-blue-500/10 border-blue-500/20" :
                    "bg-red-500/10 border-red-500/20"
                  }`}>
                    <div className="flex items-center gap-2">
                      {inviteStatus === "valid" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">
                            Invito valido - Ruolo: {inviteRole}
                          </span>
                        </>
                      ) : inviteStatus === "validating" ? (
                        <>
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          <span className="text-sm text-blue-600">Verifica invito...</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">
                            {inviteStatus === "expired" ? "Invito scaduto" :
                             inviteStatus === "used" ? "Invito già utilizzato" :
                             "Invito non valido"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Input token */}
                {!tokenFromUrl && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Token Invito
                    </label>
                    <Input
                      type="text"
                      placeholder="Incolla il token di invito..."
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value);
                        if (e.target.value.length > 20) {
                          validateToken(e.target.value);
                        }
                      }}
                      required
                      disabled={loading}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Richiedi un invito all&apos;amministratore del sistema
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="tu@azienda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      checkPasswordStrength(e.target.value);
                    }}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  {password && (
                    <div className="space-y-1">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full ${
                              i <= passwordStrength ? getStrengthColor() : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${
                        passwordStrength <= 1 ? "text-red-500" :
                        passwordStrength === 2 ? "text-yellow-500" :
                        passwordStrength === 3 ? "text-blue-500" :
                        "text-green-500"
                      }`}>
                        {getStrengthLabel()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Conferma Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || inviteStatus === "invalid" || inviteStatus === "expired" || inviteStatus === "used"}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creazione account...
                    </>
                  ) : (
                    "Crea Account Admin"
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <a href="/login" className="text-sm text-primary hover:underline">
                ← Hai già un account? Accedi
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by Enterprise Security System © 2026 AROS
        </p>
      </div>
    </div>
  );
}
