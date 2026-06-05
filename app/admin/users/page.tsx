'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { UserProfile, fetchAllUsers, updateUserRole, adminDeleteUser } from '@/app/lib/users-db';
import { createNotification } from '@/app/lib/notifications-db';
import UserTable from '@/app/components/admin/UserTable';
import { Loader2 } from 'lucide-react';

export default function UsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (!profile || userId === profile.id) return;
    setProcessingId(userId);
    const success = await updateUserRole(userId, newRole);
    if (success) {
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
    }
    setProcessingId(null);
  };

  const handleDelete = async (userId: string) => {
    if (!profile || userId === profile.id) return;
    setProcessingId(userId);
    const success = await adminDeleteUser(userId);
    if (success) {
      loadUsers();
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
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600'
          >
            <option value='all'>Todos ({users.length})</option>
            <option value='admin'>Admins ({users.filter((u) => u.role === 'admin').length})</option>
            <option value='user'>Usuarios ({users.filter((u) => u.role === 'user').length})</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='animate-spin text-purple-600' size={40} />
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
