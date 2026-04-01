import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Package, MapPin, CheckCircle2, ChevronRight, Loader2, Warehouse, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import OrderModal from '../../components/orders/OrderModal';

export default function PickingLists() {
  const [pickLists, setPickLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('ALL');
  const [warehouses, setWarehouses] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pickListsRes, warehousesRes] = await Promise.all([
        api.post('/order/pick-lists'),
        api.get('/warehouse')
      ]);
      setPickLists(pickListsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompletePick = async (id) => {
    if (!window.confirm('Tüm ürünleri topladığınızı ve stoktan düşüleceğini onaylıyor musunuz?')) return;
    
    try {
      await api.post(`/order/pick-list/${id}/complete`);
      toast.success('Toplama tamamlandı! Stoklar düştü.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Hata oluştu.');
    }
  };

  const filteredPickLists = selectedWarehouseId === 'ALL' 
    ? pickLists 
    : pickLists.filter(pl => pl.order?.warehouseId === selectedWarehouseId);

  const pendingLists = filteredPickLists.filter(pl => pl.status === 'PENDING');
  const completedLists = filteredPickLists.filter(pl => pl.status === 'COMPLETED');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-600" />
            Toplama Listeleri (Picking)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Depo personeli için aktif toplama ve paketleme görevleri.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100 font-semibold"
        >
          <Plus className="h-5 w-5" />
          Yeni Sipariş Oluştur
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <Warehouse className="h-4 w-4" />
          <select 
            value={selectedWarehouseId} 
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="bg-transparent text-sm font-medium focus:outline-none"
          >
            <option value="ALL">Tüm Depolar</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 relative max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            placeholder="Sipariş no ile ara..."
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      ) : pendingLists.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <ClipboardList className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Şu an toplanacak iş emri yok</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
            Yeni bir sipariş geldiğinde veya depo seçiminizi değiştirdiğinizde listeler burada görünecektir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingLists.map((pl) => (
            <div key={pl.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Package className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{pl.order?.orderNumber}</h4>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{pl.order?.warehouse?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Bekliyor
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(pl.createdAt).toLocaleTimeString('tr-TR')}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase">Toplanacak Ürünler</span>
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">{pl.items?.length || 0} Kalem</span>
                </div>
                <div className="space-y-4">
                  {pl.items?.map((item) => (
                    <div key={item.id} className="flex items-start justify-between group">
                      <div className="flex gap-3">
                        <div className="mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 group-hover:scale-150 transition-all" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-tight">{item.product?.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                              <MapPin className="h-3 w-3" />
                              {item.sourceRack?.name}
                            </span>
                            <span className="text-[10px] text-gray-300">|</span>
                            <span className="text-[10px] text-indigo-500 font-mono italic">{item.product?.sku}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-indigo-900">{item.quantity} <small className="text-[10px] font-normal text-gray-400 ml-0.5">ADET</small></p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Customer Info */}
                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search className="w-3 h-3 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">Müşteri: <span className="font-bold text-gray-700">{pl.order?.customerName}</span></p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => handleCompletePick(pl.id)}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-green-600 border-2 border-green-500 text-green-600 hover:text-white px-4 py-2.5 rounded-2xl font-bold transition-all group"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Toplamayı Tamamla
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Done Header */}
      {completedLists.length > 0 && (
        <div className="pt-10">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Tamamlananlar</h2>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedLists.map(pl => (
              <div key={pl.id} className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 opacity-75">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <CheckCircle2 className="h-4 w-4 text-green-500" />
                     <span className="text-sm font-bold text-gray-700">{pl.order?.orderNumber}</span>
                   </div>
                   <span className="text-[10px] text-gray-400 italic">Hazır</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">{pl.order?.customerName} - {pl.order?.warehouse?.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <OrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </div>
  );
}
