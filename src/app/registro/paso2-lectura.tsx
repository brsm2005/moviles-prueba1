import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
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

import { HeaderEpmaps } from '@/components/header-epmaps';
import { BotonCancelarRegistro } from '@/components/boton-cancelar-registro';
import { calcularConsumo } from '@/features/lecturas/calculoConsumo';
import { useLecturaStore } from '@/features/lecturas/useLecturaStore';
import { useMedidorQuery } from '@/features/medidores/useMedidorQuery';

const PALETTE = {
  primary: '#004B87',
  secondary: '#0076C6',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  textDark: '#1E293B',
  textMuted: '#64748B',
  btnBackBg: '#F1F5F9',
  warningBorder: '#D97706',
  warningBg: '#FEF3C7',
  warningText: '#92400E',
};

const NUMERO = /^\d+(\.\d+)?$/;

/** Botón estilizado de retorno prominente con esquinas redondeadas */
function BotonVolver({ onPress, label = 'Volver al Paso 1' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btnVolver, pressed && styles.btnVolverPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text style={styles.btnVolverIcon}>‹</Text>
      <Text style={styles.btnVolverText}>{label}</Text>
    </Pressable>
  );
}

export default function Paso2LecturaScreen() {
  const router = useRouter();
  const medidorCodigo = useLecturaStore((s) => s.medidorCodigo);
  const estado = useLecturaStore((s) => s.estadoMedidor);
  const confirmacion = useLecturaStore((s) => s.confirmacionAnomalia);
  const { data: medidor, isLoading } = useMedidorQuery(medidorCodigo || null);

  // R5: En 'danado' la lectura es opcional; en 'normal' es obligatoria.
  const lecturaOpcional = estado === 'danado';

  const form = useForm({
    defaultValues: { lectura: useLecturaStore.getState().lecturaActual },
    onSubmit: () => {
      router.push('/registro/confirmacion' as never);
    },
  });

  const actualizarStore = (valor: string) => {
    const s = useLecturaStore.getState();
    s.setLecturaActual(valor);
    const n = Number(valor);
    const anomalo =
      !!medidor &&
      NUMERO.test(valor.trim()) &&
      calcularConsumo(n, medidor.ultimaLectura, medidor.promedioMensual).esAnomalo;
    s.setEsAnomalo(anomalo);
  };

  /** Validador de negocio R5 y R6 con mensajes destinados a Alert.alert */
  const validarLecturaParaAlerta = (valor: string): { esValido: boolean; motivo?: string } => {
    const limpio = valor.trim();
    if (!limpio) {
      if (lecturaOpcional) return { esValido: true };
      return {
        esValido: false,
        motivo: 'La lectura actual es obligatoria para medidores en estado normal.',
      };
    }
    if (!NUMERO.test(limpio)) {
      return {
        esValido: false,
        motivo: 'La lectura ingresada debe contener exclusivamente números.',
      };
    }
    if (medidor && Number(limpio) < medidor.ultimaLectura) {
      return {
        esValido: false,
        motivo: `La lectura ingresada (${limpio}) no puede ser menor a la lectura anterior (${medidor.ultimaLectura}).`,
      };
    }
    return { esValido: true };
  };

  const handleSiguientePaso = (lecturaActual: string) => {
    const resultado = validarLecturaParaAlerta(lecturaActual);
    if (!resultado.esValido) {
      Alert.alert('Lectura Inválida', resultado.motivo);
      return;
    }

    const n = Number(lecturaActual.trim());
    const hayLectura = NUMERO.test(lecturaActual.trim());
    const esAnomalo =
      !!medidor &&
      hayLectura &&
      calcularConsumo(n, medidor.ultimaLectura, medidor.promedioMensual).esAnomalo;

    if (esAnomalo && !confirmacion) {
      Alert.alert(
        'Confirmación Requerida',
        `El consumo calculado supera 3 veces el promedio mensual (${medidor.promedioMensual * 3}). Debe confirmar la lectura antes de
        continuar.`,
      );
      return;
    }

    form.handleSubmit();
  };

  if (isLoading || !medidor) {
    return (
      <SafeAreaView style={styles.screen} edges={[]}>
        <HeaderEpmaps />
        <BotonCancelarRegistro />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={styles.loadingText}>Cargando datos del medidor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <HeaderEpmaps />
      <BotonCancelarRegistro />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          
          <BotonVolver onPress={() => router.back()} label="‹ Volver al Paso 1" />

          <Text style={styles.step}>Paso 2 de 3</Text>
          <Text style={styles.title}>Lectura actual</Text>
          <Text style={styles.codigo}>Medidor: {medidorCodigo}</Text>

          {/* Tarjeta de referencia de consumo previo */}
          <View style={styles.cardInfo}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Última lectura registrada</Text>
              <Text style={styles.rowValue}>{medidor.ultimaLectura}</Text>
            </View>
            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 8, paddingTop: 8 }]}>
              <Text style={styles.rowLabel}>Promedio mensual</Text>
              <Text style={styles.rowValue}>{medidor.promedioMensual}</Text>
            </View>
          </View>

          {/* Tarjeta Elevada: Formulario de lectura y confirmación de anomalía */}
          <form.Field name="lectura">
            {(field) => (
              <View style={styles.cardElevada}>
                <Text style={styles.inputLabel}>
                  Lectura actual {lecturaOpcional ? '(opcional)' : '(obligatoria)'}
                </Text>
                <TextInput
                  style={styles.inputLectura}
                  value={field.state.value}
                  onChangeText={(t) => {
                    field.handleChange(t);
                    actualizarStore(t);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />

                <form.Subscribe selector={(s) => s.values.lectura}>
                  {(lectura) => {
                    const hayLectura = NUMERO.test(lectura.trim());
                    const resultado = hayLectura
                      ? calcularConsumo(Number(lectura), medidor.ultimaLectura, medidor.promedioMensual)
                      : null;
                    const anomalo = !!resultado?.esAnomalo;

                    return (
                      <>
                        {resultado && (
                          <View style={styles.consumoContainer}>
                            <Text style={styles.consumoLabel}>Consumo calculado</Text>
                            <Text
                              style={[
                                styles.consumoValor,
                                anomalo && { color: PALETTE.warningBorder },
                              ]}>
                              {resultado.consumo} m³
                            </Text>
                          </View>
                        )}

                        {anomalo && (
                          <View style={styles.alertaAnomalia}>
                            <Text style={styles.alertaTitulo}>⚠️ Consumo alto detectado</Text>
                            <Text style={styles.alertaTexto}>
                              El consumo supera 3 veces el promedio mensual ({medidor.promedioMensual * 3}).
                              La fotografía del medidor será obligatoria en el Paso 3.
                            </Text>
                            <Pressable
                              style={styles.checkRow}
                              onPress={() =>
                                useLecturaStore.getState().setConfirmacionAnomalia(!confirmacion)
                              }>
                              <View
                                style={[
                                  styles.checkbox,
                                  confirmacion && styles.checkboxChecked,
                                ]}>
                                {confirmacion && <Text style={styles.checkMark}>✓</Text>}
                              </View>
                              <Text style={styles.checkText}>
                                Confirmo que la lectura ingresada es correcta
                              </Text>
                            </Pressable>
                          </View>
                        )}

                        <Pressable
                          style={({ pressed }) => [
                            styles.botonAvanzar,
                            pressed && { opacity: 0.9 },
                          ]}
                          onPress={() => handleSiguientePaso(lectura)}>
                          <Text style={styles.botonAvanzarText}>Siguiente Paso</Text>
                        </Pressable>
                      </>
                    );
                  }}
                </form.Subscribe>
              </View>
            )}
          </form.Field>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.bg },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: {
    fontFamily: 'Roboto_500Medium',
    color: PALETTE.textMuted,
    fontSize: 15,
    marginTop: 12,
  },
  scroll: { padding: 18, paddingBottom: 36 },

  /* Encabezado Institucional */
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
    paddingBottom: 10,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  logoImage: { width: 140, height: 45 },
  textoEpmaps: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 22,
    color: PALETTE.primary,
    letterSpacing: 1.2,
  },

  /* Botón Volver */
  btnVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.btnBackBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  btnVolverPressed: {
    backgroundColor: PALETTE.border,
    opacity: 0.85,
  },
  btnVolverIcon: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: 'Roboto_700Bold',
    color: PALETTE.primary,
    marginRight: 6,
  },
  btnVolverText: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 14,
    color: PALETTE.primary,
  },

  /* Títulos y metadata */
  step: { fontFamily: 'Roboto_500Medium', fontSize: 14, color: PALETTE.secondary },
  title: { fontFamily: 'Roboto_700Bold', fontSize: 24, color: PALETTE.primary, marginTop: 2 },
  codigo: { fontFamily: 'Roboto_500Medium', fontSize: 15, color: PALETTE.textMuted, marginBottom: 16 },

  /* Tarjeta Info Referencia */
  cardInfo: {
    backgroundColor: PALETTE.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: 'Roboto_400Regular', color: PALETTE.textMuted, fontSize: 14 },
  rowValue: { fontFamily: 'Roboto_700Bold', color: PALETTE.textDark, fontSize: 16 },

  /* Tarjeta Elevada Formulario */
  cardElevada: {
    backgroundColor: PALETTE.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  inputLabel: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 15,
    color: PALETTE.primary,
    marginBottom: 8,
  },
  inputLectura: {
    fontFamily: 'Roboto_700Bold',
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 28,
    color: PALETTE.textDark,
    backgroundColor: PALETTE.bg,
  },

  /* Consumo */
  consumoContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  consumoLabel: { fontFamily: 'Roboto_500Medium', fontSize: 13, color: PALETTE.textMuted },
  consumoValor: { fontFamily: 'Roboto_700Bold', fontSize: 30, color: PALETTE.primary, marginTop: 2 },

  /* Alerta Anomalía */
  alertaAnomalia: {
    backgroundColor: PALETTE.warningBg,
    borderWidth: 1.5,
    borderColor: PALETTE.warningBorder,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  alertaTitulo: { fontFamily: 'Roboto_700Bold', fontSize: 16, color: PALETTE.warningText },
  alertaTexto: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    color: PALETTE.warningText,
    marginTop: 4,
    lineHeight: 18,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, minHeight: 44 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: PALETTE.warningBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  checkMark: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Roboto_700Bold' },
  checkText: { flex: 1, fontFamily: 'Roboto_500Medium', fontSize: 14, color: PALETTE.warningText },

  /* Botón Avanzar */
  botonAvanzar: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  botonAvanzarText: { fontFamily: 'Roboto_500Medium', color: '#FFFFFF', fontSize: 17 },
});