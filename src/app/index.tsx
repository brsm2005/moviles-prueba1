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
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    getSession()
      .then((s) => setHasSession(!!s))
      .finally(() => setChecking(false));
  }, []);

  const form = useForm({
    defaultValues: { codigo: '', clave: '' },
    onSubmit: async ({ value }) => {
      setSubmitError('');
      try {
        await login(value.codigo.trim(), value.clave);
        router.replace('/busqueda' as never);
      } catch {
        setSubmitError('No se pudo iniciar sesión. Verifique sus datos.');
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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brand}>EPMAPS</Text>
          <Text style={styles.subtitle}>Lecturas de campo</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>

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

          {!!submitError && <Text style={styles.error}>{submitError}</Text>}

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
                  <Text style={styles.buttonText}>Ingresar</Text>
                )}
              </Pressable>
            )}
          </form.Subscribe>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 28 },
  brand: { fontFamily: font('bold'), fontSize: 36, color: C.primary, letterSpacing: 2 },
  subtitle: { fontFamily: font('regular'), fontSize: 16, color: C.accent, marginTop: 4 },
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderTopWidth: 4,
    borderTopColor: C.accent,
  },
  title: { fontFamily: font('bold'), fontSize: 22, color: C.primary, marginBottom: 16 },
  group: { marginBottom: 16 },
  label: { fontFamily: font('medium'), fontSize: 14, color: C.primary, marginBottom: 6 },
  input: {
    fontFamily: font('regular'),
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    color: '#0F172A',
    backgroundColor: C.card,
  },
  inputError: { borderColor: C.error },
  error: { fontFamily: font('regular'), color: C.error, fontSize: 13, marginTop: 4 },
  button: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: font('medium'), color: '#fff', fontSize: 18 },
});
