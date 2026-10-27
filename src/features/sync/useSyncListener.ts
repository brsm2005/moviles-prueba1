import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { sincronizarLecturasPendientes } from './sync.service';

// R9: dispara la sincronización al pasar de sin red a con red.
export function useSyncListener() {
  useEffect(() => {
    let conectadoAntes = false;
    const unsub = NetInfo.addEventListener((s) => {
      const conectado = s.isConnected === true && s.isInternetReachable !== false;
      if (conectado && !conectadoAntes) {
        sincronizarLecturasPendientes().catch(() => undefined);
      }
      conectadoAntes = conectado;
    });
    return unsub;
  }, []);
}
