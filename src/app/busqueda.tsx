import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

import { appAlert } from '@/components/app-alert';
import { HeaderEpmaps } from '@/components/header-epmaps';
import { logout } from '@/features/auth/auth.service';
import { useLecturaStore } from '@/features/lecturas/useLecturaStore';
import { validarCodigoMedidor } from '@/features/medidores/medidores.validator';
import { useMedidorQuery } from '@/features/medidores/useMedidorQuery';

const C = {
  primary: '#004B87',
  accent: '#00A3E0',
  error: '#EF4444',
  bg: '#F8FAFC',
  card: '#FFFFFF',
};

export default function BusquedaScreen() {
  const router = useRouter();
  const [codigoConsulta, setCodigoConsulta] = useState<string | null>(null);
  const query = useMedidorQuery(codigoConsulta);
  const medidor = query.data ?? null;
  const errorConsulta = query.error
    ? query.error instanceof Error
      ? query.error.message
      : 'No se pudo consultar el medidor'
    : '';

  useEffect(() => {
    if (errorConsulta) {
      const noRed = /conexi/i.test(errorConsulta);
      const dup = /registrad|mes/i.test(errorConsulta);
      appAlert(
        noRed ? 'Sin conexión' : dup ? 'Medidor ya registrado' : 'Medidor no encontrado',
        errorConsulta,
        noRed || dup ? 'warning' : 'error',
      );
    }
  }, [errorConsulta, query.errorUpdatedAt]);

  const form = useForm({
    defaultValues: { codigo: '' },
    onSubmit: ({ value }) => {
      setCodigoConsulta(value.codigo);
    },
  });

  const filas: [string, string][] = medidor
    ? [
        ['Dirección', medidor.direccion],
        ['Sector', medidor.sector],
        ['Número de cuenta', medidor.numeroCuenta],
        ['Estado', medidor.estado],
        ['Última lectura', String(medidor.ultimaLectura)],
        ['Fecha última lectura', medidor.fechaLectura],
        ['Promedio mensual', String(medidor.promedioMensual)],
      ]
    : [];

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <HeaderEpmaps />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
            <Pressable
              style={({ pressed }) => [styles.logout, pressed && { opacity: 0.85 }]}
              onPress={() =>
                Alert.alert('Cerrar sesión', '¿Desea cerrar la sesión actual?', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                      await logout();
                      router.replace('/' as never);
                    },
                  },
                ])
              }>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>Consultar medidor</Text>
          <Pressable
            onPress={() => router.push('/historial' as never)}
            style={({ pressed }) => [styles.btnHistorial, pressed && { opacity: 0.85 }]}>
            <Text style={styles.btnHistorialText}>📋  Ver historial de lecturas</Text>
          </Pressable>

          <form.Field
            name="codigo"
            validators={{
              onChange: ({ value }) => validarCodigoMedidor(value).mensajeError,
            }}>
            {(field) => {
              const err = field.state.meta.errors[0];
              return (
                <View style={styles.group}>
                  <Text style={styles.label}>Código del medidor</Text>
                  <TextInput
                    style={[styles.input, !!err && field.state.value.length > 0 && styles.inputError]}
                    value={field.state.value}
                    onChangeText={(t) => {
                      field.handleChange(t.toUpperCase());
                      setCodigoConsulta(null);
                    }}
                    onBlur={field.handleBlur}
                    maxLength={10}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="MED-123456"
                    placeholderTextColor="#94A3B8"
                  />
                  {!!err && field.state.value.length > 0 && (
                    <Text style={styles.error}>{String(err)}</Text>
                  )}
                </View>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(s) => [s.canSubmit, s.values.codigo] as const}>
            {([canSubmit, codigo]) => {
              const isSubmitting = query.isFetching;
              const habilitado = validarCodigoMedidor(codigo).esValido && canSubmit && !isSubmitting;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    !habilitado && styles.disabled,
                    pressed && { opacity: 0.85 },
                  ]}
                  disabled={!habilitado}
                  onPress={() => form.handleSubmit()}>
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Buscar</Text>
                  )}
                </Pressable>
              );
            }}
          </form.Subscribe>

          {medidor && (
            <View style={styles.card}>
              <Text style={styles.codigo}>{medidor.codigo}</Text>
              {filas.map(([k, v]) => (
                <View key={k} style={styles.row}>
                  <Text style={styles.rowLabel}>{k}</Text>
                  <Text style={styles.rowValue}>{v}</Text>
                </View>
              ))}
              <Pressable
                style={({ pressed }) => [styles.button, styles.cta, pressed && { opacity: 0.85 }]}
                onPress={() => {
                  const s = useLecturaStore.getState();
                  if (s.medidorCodigo !== medidor.codigo) {
                    s.resetFormulario();
                    s.setMedidorCodigo(medidor.codigo);
                  }
                  router.push('/registro/paso1-estado' as never);
                }}>
                <Text style={styles.buttonText}>Iniciar Registro</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logout: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.error,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
  },
  btnHistorial: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: C.accent,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  btnHistorialText: { fontFamily: 'Roboto_700Bold', color: C.primary, fontSize: 16 },
  logoutText: { fontFamily: 'Roboto_500Medium', color: C.error, fontSize: 14 },
  screen: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  scroll: { padding: 20 },
  title: { fontFamily: 'Roboto_700Bold', fontSize: 24, color: C.primary, marginBottom: 16 },
  group: { marginBottom: 16 },
  label: { fontFamily: 'Roboto_500Medium', fontSize: 14, color: C.primary, marginBottom: 6 },
  input: {
    fontFamily: 'Roboto_700Bold',
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 22,
    letterSpacing: 1,
    color: '#1E293B',
    backgroundColor: '#F1F5F9',
  },
  inputError: { borderColor: C.error },
  error: { fontFamily: 'Roboto_400Regular', color: C.error, fontSize: 13, marginTop: 4 },
  consultaError: { marginTop: 12, fontSize: 15 },
  button: {
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#00325C',
    elevation: 5,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  disabled: { opacity: 0.45 },
  buttonText: { fontFamily: 'Roboto_700Bold', color: '#fff', fontSize: 18, letterSpacing: 0.5 },
  cta: { marginTop: 16, backgroundColor: '#0076C6', borderBottomColor: '#005A99' },
  card: {
    marginTop: 20,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    elevation: 3,
    shadowColor: C.primary,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 5,
    borderLeftColor: C.accent,
  },
  codigo: { fontFamily: 'Roboto_700Bold', fontSize: 22, color: C.primary, marginBottom: 8 },
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
});
