'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { useAuthState } from '@/hooks/useAuthState';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/* ---------------- Zod schema ---------------- */

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email je obavezan')
    .email('Email nije validan'),
  password: z
    .string()
    .min(7, 'Lozinka je obavezna i mora imati najmanje 7 karaktera'),
});

type LoginForm = z.infer<typeof loginSchema>;

/* ---------------- Page ---------------- */

export default function LoginPage() {
  const { status } = useAuthState();
  const router = useRouter();

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/home');
    }
  }, [status, router]);

  

  function validate(nextForm: LoginForm) {
    const result = loginSchema.safeParse(nextForm);

    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: typeof errors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof LoginForm;
      fieldErrors[field] = issue.message;
    }

    setErrors(fieldErrors);
    return false;
  }

  function updateField<K extends keyof LoginForm>(key: K, value: string) {
    const nextForm = { ...form, [key]: value };
    setForm(nextForm);
    validate(nextForm);
  }

  const isValid = Object.keys(errors).length === 0 &&
    form.email !== '' &&
    form.password !== '';

 

  async function submit() {
    if (!isValid || submitting) return;

    setSubmitting(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setErrors({ password: 'Pogrešan email ili lozinka' });
      setSubmitting(false);
      return;
    }

    router.replace('/home');
  }



  if (status === 'loading') {
    return <h1 className="text-center mt-20">Učitavanje...</h1>;
  }

  if (status === 'authenticated') {
    return <h1 className="text-center mt-20">Preusmeravanje...</h1>;
  }

 

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <Card className="w-full max-w-sm border-green-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-black-700 text-center">
            FON Portal - Studentski Servisi
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Email adresa</Label>
            <Input
              type="email"
              placeholder="ime.prezime@fon.bg.ac.rs"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Lozinka</Label>
            <Input
              type="password"
              value={form.password}
              onChange={e => updateField('password', e.target.value)}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <Button
            type="button"
            onClick={submit}
            disabled={!isValid || submitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Prijavljivanje...' : 'Prijava'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
