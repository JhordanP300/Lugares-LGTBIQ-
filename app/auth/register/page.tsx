'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { signUpWithEmail, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (user) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const result = await signUpWithEmail(email, password, name);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <div className='w-full max-w-md text-center'>
          <div className='bg-white rounded-2xl shadow-xl p-8 space-y-4'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
              <UserPlus size={32} className='text-green-600' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900'>¡Cuenta creada!</h2>
            <p className='text-gray-600'>
              Revisa tu correo <strong>{email}</strong> para confirmar tu cuenta.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className='w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors'
            >
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>🌈 Lugares Seguros</h1>
          <p className='text-gray-600'>Crea tu cuenta y únete a la comunidad</p>
        </div>

        {/* Card */}
        <div className='bg-white rounded-2xl shadow-xl p-6 space-y-6'>
          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>Nombre</label>
              <div className='relative'>
                <User size={18} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Tu nombre'
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>Email</label>
              <div className='relative'>
                <Mail size={18} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='email'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='tu@email.com'
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>Contraseña</label>
              <div className='relative'>
                <Lock size={18} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Mínimo 6 caracteres'
                  className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1'>Confirmar contraseña</label>
              <div className='relative'>
                <Lock size={18} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Repite tu contraseña'
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600'
                />
              </div>
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg'>
                {error}
                {error.includes('ya está registrado') && (
                  <div className='mt-2'>
                    <button
                      onClick={() => router.push('/auth/login')}
                      className='text-purple-600 font-semibold hover:text-purple-700 underline'
                    >
                      Ir a iniciar sesión
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2 disabled:opacity-50'
            >
              <UserPlus size={18} />
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {/* Toggle */}
          <div className='text-center text-sm text-gray-600'>
            ¿Ya tienes cuenta?{' '}
            <button onClick={() => router.push('/auth/login')} className='text-purple-600 font-semibold hover:text-purple-700'>
              Inicia sesión
            </button>
          </div>
        </div>

        {/* Back */}
        <div className='text-center mt-4'>
          <button onClick={() => router.push('/')} className='text-sm text-gray-500 hover:text-gray-700'>
            ← Volver al mapa
          </button>
        </div>
      </div>
    </div>
  );
}
