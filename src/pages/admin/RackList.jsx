import { useState, useEffect } from 'react';
import { Plus, Trash2, Layers, X, Columns, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function RackList() {
  const [items, setItems] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    aisleId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, parentsRes] = await Promise.all([
        api.get('/rack'),
        api.get('/aisle')
      ]);
      setItems(itemsRes.data);
      setParents(parentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Veriler yüklenirken hata oluştu. (Rack)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bu rafı silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/rack/${id}`);
      toast.success('Raf başarıyla silindi.');
      fetchData();
    } catch (error) {
      toast.error('Raf silinirken hata oluştu.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.aisleId) return toast.error('Lütfen bir koridor seçiniz.');
    
    try {
      setIsSubmitting(true);
      await api.post('/rack', {
        name: formData.name,
        aisleId: formData.aisleId
      });
      toast.success('Raf başarıyla eklendi.');
      setIsModalOpen(false);
      setFormData({ name: '', aisleId: '' });
      fetchData();
    } catch (error) {
      toast.error('Raf eklenirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="h-6 w-6 text-blue-600" />
          Raflar
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium">
          <Plus className="h-4 w-4" />
          Yeni Raf Ekle
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raf Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bağlı Koridor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></td></tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{item.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.aisle?.name ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                          <Columns className="h-4 w-4" /> {item.aisle.name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 p-2 hover:bg-red-50 rounded-full"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500">Henüz hiçbir raf eklenmemiş.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500 bg-opacity-75">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Layers className="h-5 w-5 text-blue-600" /> Yeni Raf Ekle</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bağlı Koridor <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Columns className="h-5 w-5 text-gray-400" /></div>
                    <select name="aisleId" required value={formData.aisleId} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 text-gray-900 shadow-sm focus:ring-blue-500 border appearance-none">
                      <option value="" disabled>Seçiniz</option>
                      {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="h-4 w-4 text-gray-400" /></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raf Adı <span className="text-red-500">*</span></label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 p-2.5 border" placeholder="Örn: R1-A" />
                </div>
              </div>
              <div className="flex sm:flex-row-reverse gap-3 pt-5 border-t border-gray-100 mt-6">
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
