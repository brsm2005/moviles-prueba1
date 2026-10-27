import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getDb } from '@/db/database';

// R9: indicador de conexión y contador de lecturas pendientes.
export function NetworkStatusBar() {
  const [online, setOnline] = useState(true);
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      setOnline(s.isConnected === true && s.isInternetReachable !== false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const db = await getDb();
        const row = await db.getFirstAsync<{ n: number }>(
          'SELECT COUNT(*) AS n FROM lecturas_pendientes WHERE sincronizado = 0',
        );
        if (activo) setPendientes(row?.n ?? 0);
      } catch {
        // El contador no debe romper la pantalla.
      }
    };
    cargar();
    const t = setInterval(cargar, 5000);
    return () => {
      activo = false;
      clearInterval(t);
    };
  }, []);

  return (
    <View style={[styles.bar, { backgroundColor: online ? '#10B981' : '#F59E0B' }]}>
      <Text style={styles.text}>{online ? '● Con red' : '○ Sin red'}</Text>
      <Text style={styles.text}>Pendientes: {pendientes}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: { fontFamily: 'Roboto_500Medium', color: '#fff', fontSize: 14 },
});
