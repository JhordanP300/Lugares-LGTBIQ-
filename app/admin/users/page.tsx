'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { UserProfile, fetchAllUsers, updateUserRole, adminDeleteUser } from '@/app/lib/users-db';
import { createNotification } from '@/app/lib/notifications-db';
import UserTable from '@/app/components/admin/UserTable';
import { Loader2, X } from 'lucide-react';

export default function UsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (!profile || userId === profile.id) return;
    setProcessingId(userId);
    setError(null);
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      const user = users.find((u) => u.id === userId);
      if (user) {
        await createNotification(
          userId,
          'Rol actualizado',
          `Tu rol ha sido cambiado a ${
            newRole === 'admin' ? 'Administrador' : 'Usuario'
          }.`,
          'system'
        );
      }
      loadUsers();
    } else {
      setError(result.error || 'Error al cambiar rol');
    }
    setProcessingId(null);
  };

  const handleDelete = async (userId: string) => {
    if (!profile || userId === profile.id) return;
    setProcessingId(userId);
    setError(null);
    const result = await adminDeleteUser(userId);
    if (result.success) {
      loadUsers();
    } else {
      setError(result.error || 'Error al eliminar usuario');
    }
    setProcessingId(null);
  };

  const filteredUsers = users.filter(
    (u) => filter === 'all' || u.role === filter
  );

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
          Gestión de Usuarios
        </h1>
        <div className='flex items-center gap-3'>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#189089]'
          >
            <option value='all'>Todos ({users.length})</option>
            <option value='admin'>Admins ({users.filter((u) => u.role === 'admin').length})</option>
            <option value='user'>Usuarios ({users.filter((u) => u.role === 'user').length})</option>
          </select>
        </div>
      </div>

      {error && (
        <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
          <span className='flex-1'>{error}</span>
          <button onClick={() => setError(null)} className='p-0.5 hover:bg-red-100 rounded'>
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='animate-spin text-[#189089]' size={40} />
        </div>
      ) : (
        <UserTable
          users={filteredUsers}
          currentUserId={profile?.id || ''}
          onRoleChange={handleRoleChange}
          onDelete={handleDelete}
          isProcessing={processingId}
        />
      )}
    </div>
  );
}
