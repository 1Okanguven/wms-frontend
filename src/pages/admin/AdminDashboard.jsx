import { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  ArrowRightLeft, 
  Warehouse,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState({
    totalStock: 0,
    lowStockAlerts: 0,
    todaysMovements: 0,
    totalWarehouses: 0,
    criticalStocks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/summary');
      const resData = response.data;
      

      setData({
        totalStock: resData.overview?.totalStock || resData.totalStock || 0,

        lowStockAlerts: Array.isArray(resData.lowStockAlerts) ? resData.lowStockAlerts.length : (resData.lowStockAlerts || 0),
        todaysMovements: resData.overview?.todaysMovements || resData.todaysMovements || 0,
        totalWarehouses: resData.overview?.totalWarehouses || resData.totalWarehouses || 0,

        criticalStocks: Array.isArray(resData.lowStockAlerts) ? resData.lowStockAlerts : (resData.criticalStocks || [])
      });
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Özet veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      toast.loading('PDF hazırlanıyor...', { id: 'pdf-toast' });
      const response = await api.get('/dashboard/export/low-stock/pdf', { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'stok_raporu.pdf');
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      toast.success('PDF başarıyla indirildi.', { id: 'pdf-toast' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF indirilirken hata oluştu.', { id: 'pdf-toast' });
    }
  };

  const statCards = [
    { name: 'Toplam Stok (Adet)', value: data.totalStock, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Kritik Stok Uyarısı', value: data.lowStockAlerts, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'Bugünkü Hareketler', value: data.todaysMovements, icon: ArrowRightLeft, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Aktif Depo Sayısı', value: data.totalWarehouses, icon: Warehouse, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sistem Özeti</h1>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-shrink-0 text-sm font-medium shadow-sm"
        >
          <Download className="h-4 w-4" />
          PDF Rapor İndir
        </button>
      </div>


      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-5 flex items-center gap-4 transition-transform hover:scale-105">
            <div className={`p-3 rounded-lg flex-shrink-0 ${item.bg}`}>
              <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">{item.name}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>


      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Kritik Stok Uyarıları
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm border-t border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Stok Kodu (SKU)
                </th>
                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Ürün Adı
                </th>
                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Lokasyon
                </th>
                <th scope="col" className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                  Kalan Miktar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.criticalStocks && data.criticalStocks.length > 0 ? (
                data.criticalStocks.map((stock, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {stock.sku || stock.productCode || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {stock.productName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      Genel (Tüm Depolar)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600 font-bold">
                      {stock.totalQuantity ?? stock.currentQuantity ?? 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-10 w-10 text-gray-300 mb-2" />
                      <p>Şu an için kritik seviyede stok uyarısı bulunmamaktadır. 🎉</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
