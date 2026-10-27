import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
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
import { calcularConsumo } from '@/features/lecturas/calculoConsumo';
import { useLecturaStore } from '@/features/lecturas/useLecturaStore';
import { useMedidorQuery } from '@/features/medidores/useMedidorQuery';

const C = {
  primary: '#004B87',
  accent: '#00A3E0',
  warning: '#F59E0B',
  error: '#EF4444',
  bg: '#F8FAFC',
  card: '#FFFFFF',
};

const NUMERO = /^\d+(\.\d+)?$/;

export default function Paso2LecturaScreen() {
  const router = useRouter();
  const medidorCodigo = useLecturaStore((s) => s.medidorCodigo);
  const estado = useLecturaStore((s) => s.estadoMedidor);
  const confirmacion = useLecturaStore((s) => s.confirmacionAnomalia);
  const { data: medidor, isLoading } = useMedidorQuery(medidorCodigo || null);

  // R5: en Dañado la lectura es opcional; en Normal es obligatoria.
  const lecturaOpcional = estado === 'danado';

  const form = useForm({
    defaultValues: { lectura: useLecturaStore.getState().lecturaActual },
    onSubmit: () => {
      router.push('/registro/confirmacion' as never);
    },
  });

  const validar = useMemo(
    () => (valor: string): string | undefined => {
      if (!valor.trim()) return lecturaOpcional ? undefined : 'La lectura actual es obligatoria';
      if (!NUMERO.test(valor.trim())) return 'Ingrese solo números';
      if (medidor && Number(valor) < medidor.ultimaLectura) {
        return `No puede ser menor a la última lectura (${medidor.ultimaLectura})`;
      }
      return undefined;
    },
    [lecturaOpcional, medidor],
  );

  const actualizar = (valor: string) => {
    const s = useLecturaStore.getState();
    s.setLecturaActual(valor);
    const n = Number(valor);
    const anomalo =
      !!medidor && NUMERO.test(valor.trim()) && calcularConsumo(n, medidor.ultimaLectura, medidor.promedioMensual).esAnomalo;
    s.setEsAnomalo(anomalo);
  };

  if (isLoading || !medidor) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <NetworkStatusBar />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <NetworkStatusBar />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.step}>Paso 2 de 3</Text>
          <Text style={styles.title}>Lectura actual</Text>
          <Text style={styles.codigo}>{medidorCodigo}</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Última lectura</Text>
              <Text style={styles.rowValue}>{medidor.ultimaLectura}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Promedio mensual</Text>
              <Text style={styles.rowValue}>{medidor.promedioMensual}</Text>
            </View>
          </View>

          <form.Field name="lectura" validators={{ onChange: ({ value }) => validar(value) }}>
            {(field) => (
              <View style={styles.group}>
                <Text style={styles.label}>
                  Lectura actual {lecturaOpcional ? '(opcional)' : '(obligatoria)'}
                </Text>
                <TextInput
                  style={[styles.input, field.state.meta.errors.length > 0 && styles.inputError]}
                  value={field.state.value}
                  onChangeText={(t) => {
                    field.handleChange(t);
                    actualizar(t);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />
                {field.state.meta.errors.length > 0 && (
                  <Text style={styles.error}>{String(field.state.meta.errors[0])}</Text>
                )}
              </View>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.values.lectura}>
            {(lectura) => {
              const valida = !validar(lectura);
              const hayLectura = NUMERO.test(lectura.trim());
              const resultado = hayLectura
                ? calcularConsumo(Number(lectura), medidor.ultimaLectura, medidor.promedioMensual)
                : null;
              const anomalo = !!resultado?.esAnomalo;
              const puedeAvanzar = valida && (!anomalo || confirmacion);

              return (
                <>
                  {resultado && (
                    <View style={[styles.card, anomalo && styles.cardAnomalo]}>
                      <Text style={styles.label}>Consumo calculado</Text>
                      <Text style={[styles.consumo, anomalo && { color: C.warning }]}>
                        {resultado.consumo}
                      </Text>
                    </View>
                  )}

                  {anomalo && (
                    <View style={styles.alerta}>
                      <Text style={styles.alertaTitulo}>Consumo alto detectado</Text>
                      <Text style={styles.alertaTexto}>
                        El consumo supera 3 veces el promedio mensual ({medidor.promedioMensual * 3}).
                        La foto del medidor será obligatoria.
                      </Text>
                      <Pressable
                        style={styles.checkRow}
                        onPress={() =>
                          useLecturaStore.getState().setConfirmacionAnomalia(!confirmacion)
                        }>
                        <View style={[styles.checkbox, confirmacion && styles.checkboxOn]}>
                          {confirmacion && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                        <Text style={styles.checkText}>Confirmar que la lectura es correcta</Text>
                      </Pressable>
                    </View>
                  )}

                  <Pressable
                    style={({ pressed }) => [
                      styles.button,
                      !puedeAvanzar && styles.disabled,
                      pressed && { opacity: 0.85 },
                    ]}
                    disabled={!puedeAvanzar}
                    onPress={() => form.handleSubmit()}>
                    <Text style={styles.buttonText}>Siguiente Paso</Text>
                  </Pressable>
                </>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20 },
  step: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: C.accent },
  title: { fontFamily: 'Roboto_700Bold', fontSize: 24, color: C.primary, marginTop: 2 },
  codigo: { fontFamily: 'Roboto_700Bold', fontSize: 16, color: '#475569', marginBottom: 16 },
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
  cardAnomalo: { borderLeftWidth: 4, borderLeftColor: C.warning },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { fontFamily: 'Roboto_400Regular', color: '#64748B', fontSize: 14 },
  rowValue: { fontFamily: 'Roboto_500Medium', color: '#0F172A', fontSize: 15 },
  group: { marginBottom: 16 },
  label: { fontFamily: 'Roboto_500Medium', fontSize: 14, color: C.primary, marginBottom: 6 },
  input: {
    fontFamily: 'Roboto_700Bold',
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 28,
    color: '#0F172A',
    backgroundColor: C.card,
  },
  inputError: { borderColor: C.error },
  error: { fontFamily: 'Roboto_400Regular', color: C.error, fontSize: 13, marginTop: 4 },
  consumo: { fontFamily: 'Roboto_700Bold', fontSize: 32, color: C.primary },
  alerta: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: C.warning,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alertaTitulo: { fontFamily: 'Roboto_700Bold', fontSize: 18, color: '#B45309' },
  alertaTexto: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: '#92400E', marginTop: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, minHeight: 44 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.warning,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxOn: { backgroundColor: C.warning },
  checkMark: { color: '#fff', fontSize: 18, fontFamily: 'Roboto_700Bold' },
  checkText: { flex: 1, fontFamily: 'Roboto_500Medium', fontSize: 15, color: '#92400E' },
  button: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
  buttonText: { fontFamily: 'Roboto_500Medium', color: '#fff', fontSize: 18 },
});
