import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { cancelarRegistro } from '@/features/lecturas/borrador.service';

// Visible en todos los pasos del registro: descarta la captura y vuelve a la búsqueda.
export function BotonCancelarRegistro() {
  const router = useRouter();

  const confirmar = () => {
    Alert.alert('Cancelar registro', 'Se descartará la lectura en curso. ¿Desea cancelar?', [
      { text: 'Seguir editando', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          await cancelarRegistro().catch(() => undefined);
          if (router.canDismiss()) router.dismissAll();
          router.replace('/busqueda');
        },
      },
    ]);
  };

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        onPress={confirmar}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.text}>Cancelar registro</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 20, paddingTop: 10, backgroundColor: '#F8FAFC' },
  btn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: 'Roboto_500Medium', fontSize: 16, color: '#EF4444' },
});
