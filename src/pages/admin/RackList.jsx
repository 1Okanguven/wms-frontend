import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Layers, X, Columns, ChevronDown, Search, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ActionButton from '../../components/common/ActionButton';
import LocationBadge from '../../components/common/LocationBadge';

export default function RackList() {
  const { role } = useAuth();
  const [items, setItems] = useState([]);
  const [parents, setParents] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    aisleId: '',
    locationCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, parentsRes, warehouseRes] = await Promise.all([
        api.get('/rack'),
        api.get('/aisle'),
        api.get('/warehouse')
      ]);
      setItems(itemsRes.data);
      setParents(parentsRes.data);
      setWarehouses(warehouseRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemName = item.name || '';
      const locationCode = item.locationCode || '';
      const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           locationCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWarehouse = !selectedWarehouseId || item.aisle?.zone?.warehouse?.id === selectedWarehouseId;
      return matchesSearch && matchesWarehouse;
    });
  }, [items, searchQuery, selectedWarehouseId]);

  const handleEdit = (item) => {
    setEditItem(item);
    const aisle = parents.find(p => p.id === item.aisle?.id);
    

    const suggestedCode = item.code || (item.name ? item.name.split(/[\s-]+/)[0].substring(0, 10).toUpperCase() : '');
    const locationCode = item.locationCode || (aisle ? `${aisle.locationCode}-${suggestedCode}` : '');

    setFormData({
      name: item.name || '',
      code: suggestedCode,
      barcode: item.barcode || '',
      aisleId: item.aisle?.id || '',
      locationCode: locationCode
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setFormData({ name: '', code: '', barcode: '', aisleId: '', locationCode: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu rafı silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/rack/${id}`);
      toast.success('Raf başarıyla silindi.');
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Raf silinirken hata oluştu.');
    }
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'name') {
      value = value.toUpperCase();
    }
    if (name === 'code') {
      value = value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
    }
    
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      

      if (name === 'name' && (!prev.code || prev.code === prev.name.split(/[\s-]+/)[0].substring(0, 10).toUpperCase())) {
        next.code = value.split(/[\s-]+/)[0].substring(0, 10).toUpperCase();
      }
      

      const aisle = parents.find(p => p.id === next.aisleId);
      if (aisle && next.code) {
        next.locationCode = `${aisle.locationCode}-${next.code}`;
        next.barcode = `LOC-${next.locationCode}`; // Live preview for automated barcode
      } else {
        next.locationCode = '';
        next.barcode = '';
      }
      
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.aisleId) return toast.error('Lütfen bir koridor seçiniz.');
    if (!formData.code) return toast.error('Lütfen bir kısa kod giriniz.');
    
    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        code: formData.code,
        aisleId: formData.aisleId
        // Barcode is now automated on backend, sending it is optional but showing it in UI is good
      };
      
      if (editItem) {
        await api.patch(`/rack/${editItem.id}`, payload);
        toast.success('Raf başarıyla güncellendi.');
      } else {
        await api.post('/rack', payload);
        toast.success('Raf başarıyla eklendi.');
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Failed to save rack:', error);
      toast.error(error.response?.data?.message || 'Raf kaydedilirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="h-8 w-8 text-emerald-600" />
          Raf Yönetimi
        </h1>
        {role !== 'WORKER' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            <Plus className="h-5 w-5" />
            Yeni Raf Ekle
          </button>
        )}
      </div>


      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">

        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Raf adı, kodu veya barkodu ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>


        <div className="w-full md:w-64 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none bg-white cursor-pointer"
          >
            <option value="">Tüm Depolar</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="text-xs text-gray-500 md:ml-auto">
          Gösterilen: <span className="font-semibold text-gray-900">{filteredItems.length}</span> / {items.length} kayıt
        </div>
      </div>


      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasyon Kodu / Adı</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hiyerarşi</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Barkod</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <LocationBadge locationCode={item.locationCode} className="mb-1" />
                          <div className="text-xs text-gray-500">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                          <MapPin className="h-3 w-3" />
                          {item.aisle?.zone?.warehouse?.name}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 italic px-2">
                          {item.aisle?.zone?.name} &gt; {item.aisle?.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.barcode ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 w-fit font-mono">
                          {item.barcode}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Barkodsuz</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <ActionButton 
                        onEdit={() => handleEdit(item)}
                        onDelete={() => handleDelete(item.id)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Layers className="h-10 w-10 mb-2 opacity-20" />
                      <p>Kayıt bulunamadı.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" 
              aria-hidden="true"
              onClick={closeModal}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center gap-2" id="modal-title">
                    <Layers className="h-5 w-5 text-emerald-600" />
                    {editItem ? 'Rafı Düzenle' : 'Yeni Raf Ekle'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  

                  {(formData.locationCode || formData.code) && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Lokasyon Kodu Önizleme</span>
                        <span className="text-[10px] text-emerald-400 italic">Otomatik Oluşturulur</span>
                      </div>
                      <div className="mt-1 text-lg font-mono font-bold text-emerald-700 tracking-wider">
                        {formData.locationCode || '---'}
                      </div>
                    </div>
                  )}
                  

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="aisleId" className="block text-sm font-medium text-gray-700 mb-1">
                        Bağlı Olduğu Koridor <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Columns className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="aisleId"
                          id="aisleId"
                          required
                          value={formData.aisleId}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border bg-white appearance-none"
                        >
                          <option value="" disabled>Koridor Seçiniz</option>
                          {parents.map((parent) => (
                            <option key={parent.id} value={String(parent.id)}>
                              {parent.name} ({parent.locationCode})
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Raf Adı <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border"
                        placeholder="Örn: 1. RAF"
                      />
                    </div>
                  </div>


                  <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="code" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                          Kısa Kod (Code) <span className="text-red-500">*</span>
                          <span className="text-[10px] font-normal text-gray-400 font-mono bg-white px-1.5 py-0.5 rounded border">Max 10</span>
                        </label>
                        <input
                          type="text"
                          name="code"
                          id="code"
                          required
                          maxLength={10}
                          value={formData.code}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border font-mono font-bold text-emerald-600 tracking-widest text-center"
                          placeholder="Örn: 01"
                        />
                      </div>
                      <div>
                        <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                          Raf Barkodu
                        </label>
                        <input
                          type="text"
                          name="barcode"
                          id="barcode"
                          readOnly
                          value={formData.barcode}
                          className="block w-full rounded-lg border-gray-200 bg-gray-50 cursor-not-allowed shadow-none focus:ring-0 sm:text-sm p-2.5 border font-mono text-gray-400"
                          placeholder="Otomatik üretilir..."
                        />
                        <span className="text-[10px] text-gray-400 mt-1 block italic">Barkod sistem tarafından otomatik üretilir.</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2.5 bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none disabled:opacity-50 transition-all font-semibold shadow-emerald-200"
                    >
                      {isSubmitting ? 'Kaydediliyor...' : (editItem ? 'Güncelle' : 'Kaydet')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
