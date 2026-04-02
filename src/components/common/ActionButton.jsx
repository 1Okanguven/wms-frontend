import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

/**
 * ActionButton Component
 * Standardized edit and delete actions for tables.
 * Can be easily extended for Role-Based Access Control (RBAC).
 */
export default function ActionButton({ onEdit, onDelete, editTitle = "Düzenle", deleteTitle = "Sil" }) {
  return (
    <div className="flex items-center justify-end gap-2">
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-full transition-colors inline-flex"
          title={editTitle}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors inline-flex"
          title={deleteTitle}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
