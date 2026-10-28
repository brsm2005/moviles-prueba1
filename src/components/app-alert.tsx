import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type TipoAlerta = 'error' | 'info' | 'warning' | 'success';

interface AlertaData {
  titulo: string;
  mensaje: string;
  tipo: TipoAlerta;
  acciones?: AccionAlerta[];
}

export interface AccionAlerta {
  texto: string;
  onPress?: () => void;
  secundario?: boolean;
}

const TIPOS: Record<TipoAlerta, { color: string; fondo: string; icono: string }> = {
  error: { color: '#EF4444', fondo: '#FEE2E2', icono: '✕' },
  warning: { color: '#F59E0B', fondo: '#FEF3C7', icono: '!' },
  info: { color: '#00A3E0', fondo: '#E0F2FE', icono: 'i' },
  success: { color: '#10B981', fondo: '#D1FAE5', icono: '✓' },
};

let mostrar: ((a: AlertaData) => void) | null = null;

export function appAlert(
  titulo: string,
  mensaje: string,
  tipo: TipoAlerta = 'info',
  acciones?: AccionAlerta[],
) {
  mostrar?.({ titulo, mensaje, tipo, acciones });
}

// Se monta una sola vez en el layout raíz.
export function AppAlertHost() {
  const [alerta, setAlerta] = useState<AlertaData | null>(null);

  useEffect(() => {
    mostrar = setAlerta;
    return () => {
      mostrar = null;
    };
  }, []);

  const t = alerta ? TIPOS[alerta.tipo] : TIPOS.info;

  return (
    <Modal visible={!!alerta} transparent animationType="fade" onRequestClose={() => setAlerta(null)}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: t.fondo }]}>
            <Text style={[styles.icon, { color: t.color }]}>{t.icono}</Text>
          </View>
          <Text style={styles.title}>{alerta?.titulo}</Text>
          <Text style={styles.message}>{alerta?.mensaje}</Text>
          {(alerta?.acciones ?? [{ texto: 'Entendido' }]).map((a) => (
            <Pressable
              key={a.texto}
              style={({ pressed }) => [
                styles.button,
                a.secundario && styles.buttonSec,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => {
                setAlerta(null);
                a.onPress?.();
              }}>
              <Text style={[styles.buttonText, a.secundario && { color: '#004B87' }]}>{a.texto}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { fontFamily: 'Roboto_700Bold', fontSize: 30 },
  title: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 20,
    color: '#004B87',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    alignSelf: 'stretch',
    backgroundColor: '#004B87',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonSec: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#004B87', marginTop: 8 },
  buttonText: { fontFamily: 'Roboto_500Medium', color: '#FFFFFF', fontSize: 16 },
});
