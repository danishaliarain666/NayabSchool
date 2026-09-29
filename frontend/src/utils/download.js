import api from '../services/api';
import toast from 'react-hot-toast';

export async function downloadWithAuth(url, filename) {
  try {
    const res = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([res.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  } catch {
    toast.error('Download failed');
  }
}
