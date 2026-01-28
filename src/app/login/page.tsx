// app/login/page.tsx
'use client';
import { useState } from 'react';

type User = { id: number; email: string; ime: string; prezime: string; tip: string } | null;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!res.ok) {
      setError('Invalid credentials');
      return;
    }

    const me = await fetch('/api/auth/me', { credentials: 'include' });
    if (!me.ok) {
      setError('Failed to load user');
      return;
    }
    const data = await me.json();
    setUser(data.user);
  }

  return (
    <main style={{ padding: 20 }}>
      {!user ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label>Password</label>
            <input value={password} type="password" onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit">Sign in</button>
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </form>
      ) : (
        <section>
          <h2>Signed in</h2>
          <div>{user.ime} {user.prezime}</div>
          <div>Role: {user.tip}</div>
        </section>
      )}
    </main>
  );
}
