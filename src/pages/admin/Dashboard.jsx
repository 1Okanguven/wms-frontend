import { Package, Lock } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <Package className="mx-auto h-16 w-16 text-blue-600 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Yapım Aşamasında...</p>
      </div>
    </div>
  );
}
