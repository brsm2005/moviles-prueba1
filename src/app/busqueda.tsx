import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { useMedidorQuery } from '@/features/medidores/useMedidorQuery';
import { validarCodigoMedidor } from '@/features/medidores/medidores.validator';

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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <NetworkStatusBar />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Consultar medidor</Text>

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

          {!!errorConsulta && <Text style={[styles.error, styles.consultaError]}>{errorConsulta}</Text>}

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
                onPress={() => router.push('/registro/paso1-estado' as never)}>
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
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 22,
    letterSpacing: 1,
    color: '#0F172A',
    backgroundColor: C.card,
  },
  inputError: { borderColor: C.error },
  error: { fontFamily: 'Roboto_400Regular', color: C.error, fontSize: 13, marginTop: 4 },
  consultaError: { marginTop: 12, fontSize: 15 },
  button: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
  buttonText: { fontFamily: 'Roboto_500Medium', color: '#fff', fontSize: 18 },
  cta: { marginTop: 16, backgroundColor: C.accent },
  card: {
    marginTop: 20,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
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
