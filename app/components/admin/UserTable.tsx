'use client';

import React from 'react';
import { UserProfile } from '@/app/lib/users-db';
import { Shield, User, ArrowUp, ArrowDown, Trash2, Loader2 } from 'lucide-react';

interface UserTableProps {
  users: UserProfile[];
  currentUserId: string;
  onRoleChange: (userId: string, role: 'user' | 'admin') => void;
  onDelete: (userId: string) => void;
  isProcessing: string | null;
}

export default function UserTable({
  users,
  currentUserId,
  onRoleChange,
  onDelete,
  isProcessing,
}: UserTableProps) {
  const roleColors = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    user: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const roleLabels = {
    admin: 'Admin',
    user: 'Usuario',
  };

  if (users.length === 0) {
    return (
      <div className='text-center py-20 bg-white rounded-xl border border-gray-100'>
        <p className='text-gray-500 text-lg'>No hay usuarios que mostrar</p>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
      {/* Vista desktop */}
      <div className='hidden md:block overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-50 border-b border-gray-200'>
            <tr>
              <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase'>
                Usuario
              </th>
              <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase'>
                Rol
              </th>
              <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase'>
                Registrado
              </th>
              <th className='text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const isProcessingThis = isProcessing === user.id;
              return (
                <tr key={user.id} className='hover:bg-gray-50'>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-3'>
                      <div className='w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0'>
                        <User size={16} className='text-purple-600' />
                      </div>
                      <div className='min-w-0'>
                        <p className='font-medium text-gray-900 truncate text-sm'>
                          {user.name}
                          {isCurrentUser && (
                            <span className='text-xs text-purple-600 ml-1'>(tú)</span>
                          )}
                        </p>
                        <p className='text-xs text-gray-500 truncate'>ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        roleColors[user.role]
                      }`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-sm text-gray-600'>
                    {new Date(user.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center justify-end gap-2'>
                      {!isCurrentUser && (
                        <>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => onRoleChange(user.id, 'admin')}
                              disabled={isProcessingThis}
                              className='p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50'
                              title='Hacer admin'
                            >
                              {isProcessingThis ? (
                                <Loader2 className='animate-spin' size={16} />
                              ) : (
                                <ArrowUp size={16} />
                              )}
                            </button>
                          )}
                          {user.role !== 'user' && (
                            <button
                              onClick={() => onRoleChange(user.id, 'user')}
                              disabled={isProcessingThis}
                              className='p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50'
                              title='Degradar a usuario'
                            >
                              <ArrowDown size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar al usuario "${user.name}"? Esta acción no se puede deshacer.`)) {
                                onDelete(user.id);
                              }
                            }}
                            disabled={isProcessingThis}
                            className='p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50'
                            title='Eliminar usuario'
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista móvil */}
      <div className='md:hidden divide-y divide-gray-100'>
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          const isProcessingThis = isProcessing === user.id;
          return (
            <div key={user.id} className='p-4 space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0'>
                  <User size={18} className='text-purple-600' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-gray-900 truncate'>
                    {user.name}
                    {isCurrentUser && (
                      <span className='text-xs text-purple-600 ml-1'>(tú)</span>
                    )}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {new Date(user.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    roleColors[user.role]
                  }`}
                >
                  {roleLabels[user.role]}
                </span>
              </div>

              {!isCurrentUser && (
                <div className='flex gap-2'>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => onRoleChange(user.id, 'admin')}
                      disabled={isProcessingThis}
                      className='flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-50'
                    >
                      {isProcessingThis ? <Loader2 className='animate-spin' size={14} /> : <ArrowUp size={14} />}
                      Hacer admin
                    </button>
                  )}
                  {user.role !== 'user' && (
                    <button
                      onClick={() => onRoleChange(user.id, 'user')}
                      disabled={isProcessingThis}
                      className='flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50'
                    >
                      <ArrowDown size={14} />
                      Degradar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar al usuario "${user.name}"?`)) {
                        onDelete(user.id);
                      }
                    }}
                    disabled={isProcessingThis}
                    className='flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50'
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
