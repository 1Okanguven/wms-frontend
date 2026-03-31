import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, X, Building2, Tags, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const SKU_PREFIX_MAP = {
  'ELEKTRONIK': 'ELK',
  'GIDA': 'GDA',
  'MOBILYA': 'MOB',
  'GIYIM': 'GYM',
  'KOZMETIK': 'KOZ',
  'HIRDAVAT': 'HRD'
};

const generateSkuPrefix = (categoryName) => {
  if (!categoryName) return '';

  // Türkçe karakter dönüşümü
  const charMap = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'C', 'Ğ': 'G', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
  };
  
  let processed = categoryName.split('').map(char => charMap[char] || char).join('').toUpperCase();

  // Map içinde varsa döndür
  if (SKU_PREFIX_MAP[processed]) return SKU_PREFIX_MAP[processed];

  // Fallback: Sesli harfleri at ve ilk 3 harfi/sessiz harfi al
  let consonants = processed.replace(/[AEIOU]/g, '');
  if (consonants.length >= 3) return consonants.substring(0, 3);
  
  return processed.substring(0, 3);
};

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    barcode: '',
    categoryId: '',
    companyId: '',
    unit: '',
    hasExpiration: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, companiesRes] = await Promise.all([
        api.get('/product'),
        api.get('/category'),
        api.get('/company')
      ]);
      setItems(productsRes.data.data);
      setCategories(categoriesRes.data);
      setCompanies(companiesRes.data);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/product/${id}`);
      toast.success('Ürün başarıyla silindi.');
      fetchData();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Ürün silinirken hata oluştu.');
    }
  };

  const handleInputChange = (e) => {
    let { name, value, type, checked } = e.target;
    
    // Validasyonlar ve Dönüşümler
    if (name === 'barcode') {
      // Sadece rakam kabul et ve max 13 hane
      value = value.replace(/\D/g, '').substring(0, 13);
    }

    if (name === 'sku') {
      // Büyük harf yap ve boşlukları tireye çevir
      value = value.toUpperCase().replace(/\s+/g, '-');
    }

    setFormData(prev => {
      const nextData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Kategori değiştiğinde otomatik SKU Öneki üret
      if (name === 'categoryId') {
        const selectedCat = categories.find(c => c.id === value);
        if (selectedCat) {
          const prefix = generateSkuPrefix(selectedCat.name);
          nextData.sku = `${prefix}-`;
        }
      }

      return nextData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyId) return toast.error('Lütfen bir şirket seçiniz.');
    if (!formData.categoryId) return toast.error('Lütfen bir kategori seçiniz.');
    if (!formData.unit) return toast.error('Lütfen bir ölçü birimi seçiniz.');

    try {
      setIsSubmitting(true);
      const payload = {
        sku: formData.sku,
        name: formData.name,
        barcode: formData.barcode || null,
        categoryId: formData.categoryId,
        companyId: formData.companyId,
        unit: formData.unit,
        hasExpiration: formData.hasExpiration
      };

      await api.post('/product', payload);
      toast.success('Ürün başarıyla eklendi.');
      setIsModalOpen(false);
      // Reset form
      setFormData({
        sku: '',
        name: '',
        barcode: '',
        categoryId: '',
        companyId: '',
        unit: '',
        hasExpiration: false
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Ürün eklenirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          Ürün Katalogu (Master Data)
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Yeni Ürün Ekle
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün Adı</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barkod</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şirket</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birim</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKT Takibi</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((product) => (
                  <tr key={product.id || product.sku} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.barcode || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.company?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.category?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product.hasExpiration ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Evet
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Hayır
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors inline-flex"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-10 w-10 text-gray-300 mb-2" />
                      <p>Henüz hiçbir ürün eklenmemiş.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal Panel */}
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center gap-2" id="modal-title">
                    <Package className="h-5 w-5 text-blue-600" />
                    Yeni Ürün Ekle
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Şirket ve Kategori */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
                        Bağlı Olduğu Şirket <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Building2 className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="companyId"
                          id="companyId"
                          required
                          value={formData.companyId}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border bg-white appearance-none"
                        >
                          <option value="" disabled>Şirket Seçiniz</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Tags className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="categoryId"
                          id="categoryId"
                          required
                          value={formData.categoryId}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border bg-white appearance-none"
                        >
                          <option value="" disabled>Kategori Seçiniz</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SKU ve Ürün Adı */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                        Ürün Kodu (SKU) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="sku"
                        id="sku"
                        required
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                        placeholder="Örn: ELK-001"
                      />
                      <p className="mt-1 text-[10px] text-gray-400 italic">Kategori seçildiğinde otomatik önek eklenir.</p>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Ürün Adı <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                        placeholder="Örn: Akıllı Telefon"
                      />
                    </div>
                  </div>

                  {/* Barkod ve Ölçü Birimi */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                        Evrensel Barkod
                      </label>
                      <input
                        type="text"
                        name="barcode"
                        id="barcode"
                        maxLength={13}
                        value={formData.barcode}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                        placeholder="Örn: 8690123456789"
                      />
                      <p className="mt-1 text-[10px] text-gray-500 font-medium italic">13 haneli EAN-13 standardı (Sadece rakam)</p>
                    </div>

                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                        Ölçü Birimi <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="unit"
                        id="unit"
                        required
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white"
                      >
                        <option value="" disabled>Seçiniz</option>
                        <option value="ADET">ADET</option>
                        <option value="KG">KG</option>
                        <option value="KOLI">KOLI</option>
                        <option value="LITRE">LITRE</option>
                        <option value="PALET">PALET</option>
                      </select>
                    </div>
                  </div>

                  {/* SKT */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center pt-2">
                      <div className="flex items-center h-5">
                        <input
                          id="hasExpiration"
                          name="hasExpiration"
                          type="checkbox"
                          checked={formData.hasExpiration}
                          onChange={handleInputChange}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="hasExpiration" className="font-medium text-gray-700 cursor-pointer">
                          SKT Takibi Zorunlu mu?
                        </label>
                        <p className="text-gray-500 text-xs mt-0.5">Ürün depoya girerken ve çıkarken SKT sorulur.</p>
                      </div>
                    </div>
                  </div>

                  {/* Submit / İptal butonları */}
                  <div className="mt-8 sm:flex sm:flex-row-reverse border-t border-gray-100 pt-5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? 'Ekleniyor...' : 'Kaydet'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                    >
                      İptal
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
