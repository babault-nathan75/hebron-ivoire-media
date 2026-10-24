import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Eye, EyeOff, KeyRound, LoaderCircle, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

type Mode = "password" | "otp";

export default function AdminLogin() {
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onLoggedIn = async () => {
    await utils.auth.me.invalidate();
  };
  const loginPassword = trpc.auth.loginWithPassword.useMutation({
    onSuccess: onLoggedIn,
    onError: (e) => toast.error(e.message),
  });
  const requestOtp = trpc.auth.requestOtp.useMutation({
    onSuccess: () => {
      setCodeSent(true);
      toast.success("Si cet e-mail est autorisé, un code vient d’être envoyé.");
    },
    onError: (e) => toast.error(e.message),
  });
  const verifyOtp = trpc.auth.verifyOtp.useMutation({
    onSuccess: onLoggedIn,
    onError: (e) => toast.error(e.message),
  });
  const busy = loginPassword.isPending || requestOtp.isPending || verifyOtp.isPending;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "password") loginPassword.mutate({ email, password });
    else if (!codeSent) requestOtp.mutate({ email });
    else verifyOtp.mutate({ email, code });
  }

  return (
    <form onSubmit={submit} className="admin-login">
      <div className="admin-login-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "password"} className={mode === "password" ? "is-active" : ""} onClick={() => setMode("password")}>
          <Lock size={13} /> Mot de passe
        </button>
        <button type="button" role="tab" aria-selected={mode === "otp"} className={mode === "otp" ? "is-active" : ""} onClick={() => setMode("otp")}>
          <Mail size={13} /> Code par e-mail
        </button>
      </div>

      <label className="admin-field">
        <Mail size={16} />
        <input type="email" required autoComplete="email" placeholder="E-mail administrateur" value={email} onChange={(e) => setEmail(e.target.value)} disabled={codeSent && mode === "otp"} />
      </label>

      {mode === "password" && (
        <label className="admin-field">
          <Lock size={16} />
          <input type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="admin-eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} title={showPassword ? "Masquer" : "Afficher"}>
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </label>
      )}

      {mode === "otp" && codeSent && (
        <label className="admin-field">
          <KeyRound size={16} />
          <input className="admin-code" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="one-time-code" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        </label>
      )}

      <button className="admin-submit" type="submit" disabled={busy}>
        {busy ? <LoaderCircle className="spin" size={16} /> : null}
        {mode === "password" ? "Se connecter" : codeSent ? "Valider le code" : "Recevoir un code"}
        {!busy && <ArrowUpRight size={16} />}
      </button>

      {mode === "otp" && (
        <p className="admin-hint">
          {codeSent ? "Saisissez le code à 6 chiffres reçu par e-mail (valable 10 minutes)." : "Un code à usage unique sera envoyé à votre adresse."}
          {codeSent && <> <button type="button" onClick={() => { setCodeSent(false); setCode(""); }}>Changer d’adresse / renvoyer</button></>}
        </p>
      )}
    </form>
  );
}
