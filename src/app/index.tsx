import { useForm } from '@tanstack/react-form';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { appAlert } from '@/components/app-alert';
import { HeaderEpmaps } from '@/components/header-epmaps';
import { EMPLOYEE_CODE_REGEX, getSession, login } from '@/features/auth/auth.service';

const C = {
  primary: '#004B87',
  accent: '#00A3E0',
  error: '#EF4444',
  bg: '#F8FAFC',
  card: '#FFFFFF',
};

const font = (w: 'regular' | 'medium' | 'bold') =>
  ({ regular: 'Roboto_400Regular', medium: 'Roboto_500Medium', bold: 'Roboto_700Bold' })[w];

export default function LoginScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    getSession()
      .then((s) => setHasSession(!!s))
      .finally(() => setChecking(false));
  }, []);

  const form = useForm({
    defaultValues: { codigo: '', clave: '' },
    onSubmit: async ({ value }) => {
      try {
        await login(value.codigo.trim(), value.clave);
        router.replace('/busqueda' as never);
      } catch {
        appAlert('Acceso denegado', 'No se pudo iniciar sesión. Verifique su código y clave.', 'error');
      }
    },
  });

  if (checking) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }
  if (hasSession) return <Redirect href={'/busqueda' as never} />;

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <HeaderEpmaps />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.lead}>Ingrese con su código de empleado para comenzar la jornada.</Text>

          <form.Field
            name="codigo"
            validators={{
              onChange: ({ value }) =>
                !value.trim()
                  ? 'El código de empleado es obligatorio'
                  : !EMPLOYEE_CODE_REGEX.test(value.trim())
                    ? 'Use 3 a 20 caracteres (letras, números o guion)'
                    : undefined,
            }}>
            {(field) => (
              <View style={styles.group}>
                <Text style={styles.label}>Código de empleado</Text>
                <TextInput
                  style={[styles.input, field.state.meta.errors.length > 0 && styles.inputError]}
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="Ej. EMP-1001"
                  placeholderTextColor="#94A3B8"
                />
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                  <Text style={styles.error}>{String(field.state.meta.errors[0])}</Text>
                )}
              </View>
            )}
          </form.Field>

          <form.Field
            name="clave"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? 'La clave es obligatoria'
                  : value.length < 4
                    ? 'La clave debe tener al menos 4 caracteres'
                    : undefined,
            }}>
            {(field) => (
              <View style={styles.group}>
                <Text style={styles.label}>Clave</Text>
                <TextInput
                  style={[styles.input, field.state.meta.errors.length > 0 && styles.inputError]}
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="••••••"
                  placeholderTextColor="#94A3B8"
                />
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                  <Text style={styles.error}>{String(field.state.meta.errors[0])}</Text>
                )}
              </View>
            )}
          </form.Field>


          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  (!canSubmit || isSubmitting) && styles.buttonDisabled,
                  pressed && { opacity: 0.85 },
                ]}
                disabled={!canSubmit || isSubmitting}
                onPress={() => form.handleSubmit()}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Ingresar  →</Text>
                )}
              </Pressable>
            )}
          </form.Subscribe>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: C.primary,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  title: { fontFamily: font('bold'), fontSize: 24, color: C.primary },
  lead: { fontFamily: font('regular'), fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 20 },
  group: { marginBottom: 16 },
  label: { fontFamily: font('medium'), fontSize: 14, color: C.primary, marginBottom: 6 },
  input: {
    fontFamily: font('regular'),
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#1E293B',
    backgroundColor: '#F1F5F9',
  },
  inputError: { borderColor: C.error },
  error: { fontFamily: font('regular'), color: C.error, fontSize: 13, marginTop: 4 },
  button: {
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderBottomWidth: 4,
    borderBottomColor: '#00325C',
    elevation: 5,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: font('bold'), color: '#fff', fontSize: 18, letterSpacing: 0.5 },
});
