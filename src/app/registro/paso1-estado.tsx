import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NetworkStatusBar } from '@/components/network-status-bar';
import {
    guardarBorrador,
    iniciarAutoguardado,
    limpiarBorrador,
    obtenerBorrador,
} from '@/features/lecturas/borrador.service';
import {
    seleccionarDatos,
    useLecturaStore,
    type EstadoMedidor,
} from '@/features/lecturas/useLecturaStore';

const C = {
  primary: '#004B87',
  accent: '#00A3E0',
  warning: '#F59E0B',
  error: '#EF4444',
  bg: '#F8FAFC',
  card: '#FFFFFF',
};

const ESTADOS: { valor: EstadoMedidor; etiqueta: string; color: string }[] = [
  { valor: 'normal', etiqueta: 'Normal', color: C.accent },
  { valor: 'inaccesible', etiqueta: 'Inaccesible', color: C.warning },
  { valor: 'danado', etiqueta: 'Dañado', color: C.error },
];

const MOTIVOS = ['Perro agresivo', 'Predio cerrado', 'Medidor bloqueado', 'Acceso peligroso'];

export default function Paso1EstadoScreen() {
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const detener = useRef<(() => void) | null>(null);

  const store = useLecturaStore;
  const inicial = store.getState();

  const form = useForm({
    defaultValues: {
      estado: inicial.estadoMedidor as EstadoMedidor,
      motivo: inicial.motivoInaccesibilidad,
      descripcion: inicial.descripcionDano,
    },
    onSubmit: ({ value }) => {
      // Inaccesible salta a la confirmación; Normal y Dañado siguen a la lectura.
      const ruta =
        value.estado === 'inaccesible' ? '/registro/confirmacion' : '/registro/paso2-lectura';
      router.push(ruta as never);
    },
  });

  // R8: al entrar, ofrecer continuar o descartar un borrador distinto al estado actual.
  useEffect(() => {
    let activo = true;

    const arrancar = () => {
      if (!activo) return;
      const s = store.getState();
      if (s.medidorCodigo) guardarBorrador(seleccionarDatos(s)).catch(() => undefined);
      detener.current = iniciarAutoguardado();
      setListo(true);
    };

    obtenerBorrador()
      .then((borrador) => {
        if (!activo) return;
        const actual = seleccionarDatos(store.getState());
        if (!borrador || JSON.stringify(borrador) === JSON.stringify(actual)) {
          arrancar();
          return;
        }
        Alert.alert(
          'Captura pendiente',
          `Hay un registro sin terminar del medidor ${borrador.medidorCodigo}.`,
          [
            {
              text: 'Descartar',
              style: 'destructive',
              onPress: () => {
                limpiarBorrador().finally(arrancar);
              },
            },
            {
              text: 'Continuar captura pendiente',
              onPress: () => {
                store.getState().restaurarFormulario(borrador);
                form.reset({
                  estado: borrador.estadoMedidor,
                  motivo: borrador.motivoInaccesibilidad,
                  descripcion: borrador.descripcionDano,
                });
                arrancar();
              },
            },
          ],
          { cancelable: false },
        );
      })
      .catch(arrancar);

    return () => {
      activo = false;
      detener.current?.();
      detener.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <NetworkStatusBar />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.step}>Paso 1 de 3</Text>
          <Text style={styles.title}>Estado del medidor</Text>
          {!!store.getState().medidorCodigo && (
            <Text style={styles.codigo}>{store.getState().medidorCodigo}</Text>
          )}

          <form.Field name="estado">
            {(field) => (
              <View style={styles.estados}>
                {ESTADOS.map((e) => {
                  const activo = field.state.value === e.valor;
                  return (
                    <Pressable
                      key={e.valor}
                      onPress={() => {
                        field.handleChange(e.valor);
                        store.getState().setEstadoMedidor(e.valor);
                        if (e.valor !== 'inaccesible') form.setFieldValue('motivo', '');
                        if (e.valor !== 'danado') form.setFieldValue('descripcion', '');
                      }}
                      style={[
                        styles.estadoCard,
                        activo && { borderColor: e.color, backgroundColor: '#fff' },
                      ]}>
                      <View style={[styles.dot, { backgroundColor: e.color }]} />
                      <Text style={[styles.estadoText, activo && { color: e.color }]}>
                        {e.etiqueta}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.values.estado}>
            {(estado) => (
              <>
                {estado === 'inaccesible' && (
                  <View style={styles.card}>
                    <Text style={styles.label}>Motivo (obligatorio)</Text>
                    <View style={styles.chips}>
                      {MOTIVOS.map((m) => (
                        <Pressable
                          key={m}
                          style={styles.chip}
                          onPress={() => {
                            form.setFieldValue('motivo', m);
                            store.getState().setMotivoInaccesibilidad(m);
                          }}>
                          <Text style={styles.chipText}>{m}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <form.Field
                      name="motivo"
                      validators={{
                        onChange: ({ value, fieldApi }) =>
                          fieldApi.form.getFieldValue('estado') === 'inaccesible' && !value.trim()
                            ? 'El motivo es obligatorio'
                            : undefined,
                      }}>
                      {(field) => (
                        <>
                          <TextInput
                            style={[styles.input, field.state.meta.errors.length > 0 && styles.inputError]}
                            value={field.state.value}
                            onChangeText={(t) => {
                              field.handleChange(t);
                              store.getState().setMotivoInaccesibilidad(t);
                            }}
                            placeholder="Describa el motivo"
                            placeholderTextColor="#94A3B8"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <Text style={styles.error}>{String(field.state.meta.errors[0])}</Text>
                          )}
                        </>
                      )}
                    </form.Field>
                    <Text style={styles.hint}>
                      La lectura queda bloqueada. Pasará directo a la confirmación.
                    </Text>
                  </View>
                )}

                {estado === 'danado' && (
                  <View style={styles.card}>
                    <Text style={styles.label}>Descripción del daño (obligatoria)</Text>
                    <form.Field
                      name="descripcion"
                      validators={{
                        onChange: ({ value, fieldApi }) =>
                          fieldApi.form.getFieldValue('estado') === 'danado' && !value.trim()
                            ? 'La descripción del daño es obligatoria'
                            : undefined,
                      }}>
                      {(field) => (
                        <>
                          <TextInput
                            style={[
                              styles.input,
                              styles.multiline,
                              field.state.meta.errors.length > 0 && styles.inputError,
                            ]}
                            value={field.state.value}
                            onChangeText={(t) => {
                              field.handleChange(t);
                              store.getState().setDescripcionDano(t);
                            }}
                            multiline
                            placeholder="Describa el daño del medidor"
                            placeholderTextColor="#94A3B8"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <Text style={styles.error}>{String(field.state.meta.errors[0])}</Text>
                          )}
                        </>
                      )}
                    </form.Field>
                    <Text style={styles.hint}>
                      La lectura es opcional y la foto será obligatoria en el Paso 3.
                    </Text>
                  </View>
                )}
              </>
            )}
          </form.Subscribe>

          <form.Subscribe
            selector={(s) => [s.values.estado, s.values.motivo, s.values.descripcion] as const}>
            {([estado, motivo, descripcion]) => {
              const completo =
                estado === 'normal' ||
                (estado === 'inaccesible' && motivo.trim().length > 0) ||
                (estado === 'danado' && descripcion.trim().length > 0);
              const habilitado = completo && listo;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    !habilitado && styles.disabled,
                    pressed && { opacity: 0.85 },
                  ]}
                  disabled={!habilitado}
                  onPress={() => form.handleSubmit()}>
                  <Text style={styles.buttonText}>
                    {estado === 'inaccesible' ? 'Ir a confirmación' : 'Continuar a lectura'}
                  </Text>
                </Pressable>
              );
            }}
          </form.Subscribe>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  scroll: { padding: 20 },
  step: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: C.accent },
  title: { fontFamily: 'Roboto_700Bold', fontSize: 24, color: C.primary, marginTop: 2 },
  codigo: { fontFamily: 'Roboto_700Bold', fontSize: 16, color: '#475569', marginBottom: 16 },
  estados: { gap: 10, marginTop: 8, marginBottom: 16 },
  estadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: C.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  estadoText: { fontFamily: 'Roboto_500Medium', fontSize: 18, color: '#334155' },
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
  label: { fontFamily: 'Roboto_500Medium', fontSize: 14, color: C.primary, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.accent,
  },
  chipText: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: C.primary },
  input: {
    fontFamily: 'Roboto_400Regular',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: C.card,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 },
  inputError: { borderColor: C.error },
  error: { fontFamily: 'Roboto_400Regular', color: C.error, fontSize: 13, marginTop: 4 },
  hint: { fontFamily: 'Roboto_400Regular', color: '#64748B', fontSize: 13, marginTop: 10 },
  button: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  disabled: { opacity: 0.45 },
  buttonText: { fontFamily: 'Roboto_500Medium', color: '#fff', fontSize: 18 },
});
