import { useEffect, useState } from 'react';
import api from '../services/api';

let cache = null;

export function useSchoolSettings() {
  const [settings, setSettings] = useState(cache || {});

  useEffect(() => {
    if (cache) return;
    api.get('/public/contact-info')
      .then((r) => { cache = r.data.data; setSettings(cache); })
      .catch(() => {});
  }, []);

  return settings;
}
