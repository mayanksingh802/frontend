import LoginForm from "@/app/components/auth/LoginForm";
import LoginPromo from "@/app/components/auth/LoginPromo";

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-card">
        <section className="login-left">
          <div className="login-brand">
            <div className="brand-icon">C</div>
            <span>CORPIZ</span>
          </div>

          <LoginForm />
        </section>

        <LoginPromo />
      </div>

      <footer className="login-footer">
        © 2024, CORPIZ. All Rights Reserved.
      </footer>
    </main>
  );
}