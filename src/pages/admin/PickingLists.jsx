import { ClipboardList } from 'lucide-react';

export default function PickingLists() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          Toplama Listeleri
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Aktif iş emirleri ve toplama görevleri bu alanda listelenecektir.
        </p>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Henüz İş Emri Yok</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Henüz toplanacak iş emri/sipariş bulunmuyor.
            <br />
            Sipariş oluşturulduğunda listeler burada görüntülenecektir.
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Yakında aktif olacak
          </div>
        </div>
      </div>
    </div>
  );
}
