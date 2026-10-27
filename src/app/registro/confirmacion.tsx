import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NetworkStatusBar } from '@/components/network-status-bar';
import { calcularConsumo } from '@/features/lecturas/calculoConsumo';
import { guardarLecturaLocal } from '@/features/lecturas/lecturas.service';
import { useLecturaStore } from '@/features/lecturas/useLecturaStore';
import { useMedidorQuery } from '@/features/medidores/useMedidorQuery';
import { guardarFotoPermanente } from '@/utils/fileSystemStorage';

const C = {
  primary: '#004B87',
  accent: '#00A3E0',
  warning: '#F59E0B',
  error: '#EF4444',
  bg: '#F8FAFC',
  card: '#FFFFFF',
};

const ETIQUETA = { normal: 'Normal', inaccesible: 'Inaccesible', danado: 'Dañado' } as const;

export default function ConfirmacionScreen() {
  const router = useRouter();
  const datos = useLecturaStore();
  const { data: medidor } = useMedidorQuery(datos.medidorCodigo || null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camaraRef = useRef<CameraView>(null);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const hayLectura = datos.estadoMedidor !== 'inaccesible' && datos.lecturaActual.trim() !== '';
  const consumo =
    hayLectura && medidor
      ? calcularConsumo(Number(datos.lecturaActual), medidor.ultimaLectura, medidor.promedioMensual)
          .consumo
      : null;

  // R7: obligatoria si el consumo es anómalo o el medidor está dañado.
  const fotoObligatoria = datos.esAnomalo || datos.estadoMedidor === 'danado';
  const permisoDenegado = permiso !== null && !permiso.granted && !permiso.canAskAgain;
  const puedeGuardar = !guardando && (!fotoObligatoria || !!datos.fotoUri);

  const abrirCamara = async () => {
    if (!permiso?.granted) {
      const r = await pedirPermiso();
      if (!r.granted) return;
    }
    setCamaraAbierta(true);
  };

  const tomarFoto = async () => {
    try {
      const foto = await camaraRef.current?.takePictureAsync({ quality: 0.6 });
      if (!foto) return;
      datos.setFotoUri(guardarFotoPermanente(foto.uri, datos.medidorCodigo));
      setCamaraAbierta(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la foto. Intente nuevamente.');
    }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarLecturaLocal({
        medidorCodigo: datos.medidorCodigo,
        estadoMedidor: datos.estadoMedidor,
        lectura: hayLectura ? Number(datos.lecturaActual) : null,
        motivo: datos.motivoInaccesibilidad || undefined,
        descripcionDano: datos.descripcionDano || undefined,
        consumoCalculado: consumo,
        fotoUri: datos.fotoUri,
      });
      useLecturaStore.getState().resetFormulario();
      Alert.alert('Lectura guardada', 'Quedó PENDIENTE de envío.', [
        { text: 'Aceptar', onPress: () => router.replace('/busqueda' as never) },
      ]);
    } catch (e) {
      setGuardando(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar la lectura.');
    }
  };

  if (camaraAbierta) {
    return (
      <View style={styles.camaraContenedor}>
        <CameraView ref={camaraRef} style={StyleSheet.absoluteFill} facing="back" />
        <View style={styles.camaraAcciones}>
          <Pressable style={[styles.button, styles.secundario]} onPress={() => setCamaraAbierta(false)}>
            <Text style={styles.buttonText}>Cancelar</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={tomarFoto}>
            <Text style={styles.buttonText}>Capturar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const filas: [string, string][] = [
    ['Medidor', datos.medidorCodigo],
    ['Estado', ETIQUETA[datos.estadoMedidor]],
  ];
  if (datos.estadoMedidor === 'inaccesible') filas.push(['Motivo', datos.motivoInaccesibilidad]);
  if (datos.estadoMedidor === 'danado') filas.push(['Daño', datos.descripcionDano]);
  if (hayLectura) filas.push(['Lectura actual', datos.lecturaActual]);
  if (consumo !== null) filas.push(['Consumo', String(consumo)]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <NetworkStatusBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Paso 3 de 3</Text>
        <Text style={styles.title}>Confirmación</Text>

        <View style={styles.card}>
          {filas.map(([k, v]) => (
            <View key={k} style={styles.row}>
              <Text style={styles.rowLabel}>{k}</Text>
              <Text style={styles.rowValue}>{v}</Text>
            </View>
          ))}
          {datos.esAnomalo && (
            <Text style={styles.anomalia}>Consumo alto confirmado por el técnico</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            Foto del medidor {fotoObligatoria ? '(obligatoria)' : '(opcional)'}
          </Text>
          {datos.fotoUri && <Image source={{ uri: datos.fotoUri }} style={styles.foto} />}
          {permisoDenegado ? (
            <Text style={styles.aviso}>
              El permiso de cámara fue denegado. Actívelo en los ajustes del teléfono
              {fotoObligatoria
                ? ' para poder guardar: en este caso la foto es obligatoria.'
                : '; puede continuar sin foto.'}
            </Text>
          ) : (
            <Pressable
              style={[styles.button, styles.acento]}
              onPress={abrirCamara}>
              <Text style={styles.buttonText}>{datos.fotoUri ? 'Repetir foto' : 'Tomar foto'}</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !puedeGuardar && styles.disabled,
            pressed && { opacity: 0.85 },
          ]}
          disabled={!puedeGuardar}
          onPress={guardar}>
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Guardar Lectura</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20 },
  step: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: C.accent },
  title: { fontFamily: 'Roboto_700Bold', fontSize: 24, color: C.primary, marginBottom: 16 },
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  rowLabel: { fontFamily: 'Roboto_400Regular', color: '#64748B', fontSize: 14 },
  rowValue: {
    fontFamily: 'Roboto_500Medium',
    color: '#0F172A',
    fontSize: 15,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  anomalia: { fontFamily: 'Roboto_500Medium', color: C.warning, marginTop: 10 },
  label: { fontFamily: 'Roboto_500Medium', fontSize: 14, color: C.primary, marginBottom: 10 },
  foto: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  aviso: { fontFamily: 'Roboto_400Regular', color: C.error, fontSize: 14 },
  button: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  acento: { backgroundColor: C.accent },
  secundario: { backgroundColor: '#64748B' },
  disabled: { opacity: 0.45 },
  buttonText: { fontFamily: 'Roboto_500Medium', color: '#fff', fontSize: 18 },
  camaraContenedor: { flex: 1, backgroundColor: '#000' },
  camaraAcciones: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
