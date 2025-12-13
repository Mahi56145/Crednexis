import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/auth";
import { NeonButton } from "@/components/ui/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const LoginPage = () => {
  const { loginWithGoogle, loginWithPassword, registerWithPassword, googleClientId, status } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("login");
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const handleFormChange = (field) => (event) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCredential = useCallback(
    async (response) => {
      try {
        await loginWithGoogle(response.credential);
        navigate("/dashboard");
      } catch (err) {
        setError(err.message || "Unable to authenticate");
      }
    },
    [loginWithGoogle, navigate]
  );

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      if (activeTab === "login") {
        await loginWithPassword(formValues.email, formValues.password);
      } else {
        if (formValues.password !== formValues.confirm) {
          setError("Passwords do not match");
          return;
        }
        await registerWithPassword({
          email: formValues.email,
          password: formValues.password,
          name: formValues.name || undefined,
        });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed");
    }
  };

  useEffect(() => {
    if (!googleClientId) return;
    const scriptId = "google-identity";
    const existing = document.getElementById(scriptId);
    const initialize = () => {
      if (window.google && buttonRef.current) {
        window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleCredential });
        window.google.accounts.id.renderButton(buttonRef.current, { theme: "filled_blue", size: "large", width: 280 });
      }
    };
    if (existing) {
      initialize();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.onload = initialize;
    document.body.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, [googleClientId, handleCredential]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl glass-card-cyan rounded-3xl shadow-2xl border border-border/60 p-8 sm:p-10 lg:p-14"
      >
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-2">Secure Access</p>
            <h1 className="text-3xl font-bold text-foreground mb-6">Sign in to CredNexis</h1>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-2 bg-glass-bg/70">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form className="space-y-4" onSubmit={handleManualSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={formValues.email} onChange={handleFormChange("email")} required disabled={status === "loading"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={formValues.password} onChange={handleFormChange("password")} required disabled={status === "loading"} minLength={8} />
                  </div>
                  <NeonButton type="submit" variant="cyan" className="w-full" disabled={status === "loading"}>
                    {status === "loading" ? "Authenticating..." : "Continue"}
                  </NeonButton>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form className="space-y-4" onSubmit={handleManualSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Analyst Name" value={formValues.name} onChange={handleFormChange("name")} disabled={status === "loading"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-register">Email</Label>
                    <Input id="email-register" type="email" placeholder="you@example.com" value={formValues.email} onChange={handleFormChange("email")} required disabled={status === "loading"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-register">Password</Label>
                    <Input id="password-register" type="password" placeholder="Minimum 8 characters" value={formValues.password} onChange={handleFormChange("password")} required minLength={8} disabled={status === "loading"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" placeholder="Re-enter password" value={formValues.confirm} onChange={handleFormChange("confirm")} required minLength={8} disabled={status === "loading"} />
                  </div>
                  <NeonButton type="submit" variant="pink" className="w-full" disabled={status === "loading"}>
                    {status === "loading" ? "Creating workspace..." : "Create Account"}
                  </NeonButton>
                </form>
              </TabsContent>
            </Tabs>
          </div>
          <div className="space-y-6 rounded-2xl bg-glass-bg/60 p-6 border border-border/50">
            {googleClientId ? (
              <>
                <p className="text-sm text-muted-foreground text-center">Prefer using your Google Workspace identity?</p>
                <div ref={buttonRef} className="flex justify-center" />
                <p className="text-xs text-muted-foreground text-center">
                  Continuing gives CredNexis permission to analyze your uploaded files securely.
                </p>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground text-sm">Add VITE_GOOGLE_CLIENT_ID to enable one-click Google sign-in.</p>
                <NeonButton variant="outline-cyan" onClick={() => navigate("/")}>Back Home</NeonButton>
              </div>
            )}
            {googleClientId && (
              <>
                <Separator className="bg-border/60" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Need SSO disabled? Use the email/password option on the left.</p>
                  <p>Passwords are encrypted with bcrypt before storage.</p>
                </div>
              </>
            )}
          </div>
        </div>
        {status === "loading" && <p className="text-sm text-center text-neon-cyan mt-6">Finalizing secure session...</p>}
        {error && <p className="text-sm text-center text-neon-pink mt-6">{error}</p>}
      </motion.div>
    </div>
  );
};

export default LoginPage;
