"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { authService } from "@/app/services/auth/authService";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setAuthenticatedUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await authService.login({
        email: email.trim(),
        password,
      });

      setAuthenticatedUser(result.user);
      router.replace("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-heading">
        <h1>Sign in</h1>
        <p>to access CORPIZ</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        {/* Email */}
        <div className="form-field">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {/* Password */}
        <div className="form-field password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>

        {/* Forgot password */}
        <div className="forgot-password">
          <button type="button">Forgot password?</button>
        </div>
        {error && (
          <p role="alert" className="login-error">
            {error}
          </p>
        )}
        {/* Login */}
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
