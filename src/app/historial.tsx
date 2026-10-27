import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NetworkStatusBar } from '@/components/network-status-bar';
import {
    actualizarLecturaPendiente,
    listarLecturas,
    type LecturaRegistrada,
} from '@/features/lecturas/lecturas.service';

const C = {
  primary: '#004B87',
  accent: '#00A3E0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  bg: '#F8FAFC',
  card: '#FFFFFF',
};

const NUMERO = /^\d+(\.\d+)?$/;

const formatoFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });

export default function HistorialScreen() {
  const router = useRouter();
  const [editando, setEditando] = useState<LecturaRegistrada | null>(null);

  // Refresco periódico para que el chip cambie a ENVIADO cuando sincroniza.
  const { data: lecturas = [] } = useQuery({
    queryKey: ['lecturas'],
    queryFn: listarLecturas,
    staleTime: 0,
    refetchInterval: 5000,
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <NetworkStatusBar />
      <FlatList
        data={lecturas}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.back}>‹ Volver</Text>
            </Pressable>
            <Text style={styles.title}>Historial de lecturas</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Aún no hay lecturas registradas.</Text>}
        renderItem={({ item }) => {
          const pendiente = item.sincronizado === 0;
          return (
            <Pressable
              disabled={!pendiente}
              onPress={() => setEditando(item)}
              style={({ pressed }) => [
                styles.card,
                { borderLeftColor: pendiente ? C.warning : C.success },
                pressed && { opacity: 0.85 },
              ]}>
              <View style={styles.cardHeader}>
                <Text style={styles.codigo}>{item.medidor_codigo}</Text>
                <View style={[styles.chip, { backgroundColor: pendiente ? C.warning : C.success }]}>
                  <Text style={styles.chipText}>{pendiente ? 'PENDIENTE' : 'ENVIADO'}</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {item.estado_medidor} · {formatoFecha(item.fecha_registro)}
              </Text>
              {item.lectura !== null && <Text style={styles.meta}>Lectura: {item.lectura}</Text>}
              {item.consumo_calculado !== null && (
                <Text style={styles.meta}>Consumo: {item.consumo_calculado}</Text>
              )}
              {item.motivo && <Text style={styles.meta}>Motivo: {item.motivo}</Text>}
              {item.descripcion_dano && <Text style={styles.meta}>Daño: {item.descripcion_dano}</Text>}
              {pendiente ? (
                <Text style={styles.editar}>Toque para editar</Text>
              ) : (
                <Text style={styles.bloqueado}>Lectura sincronizada con la oficina - No editable</Text>
              )}
            </Pressable>
          );
        }}
      />

      {editando && <EditarLecturaModal lectura={editando} onClose={() => setEditando(null)} />}
    </SafeAreaView>
  );
}

function EditarLecturaModal({
  lectura,
  onClose,
}: {
  lectura: LecturaRegistrada;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const esInaccesible = lectura.estado_medidor === 'Inaccesible';
  const esDanado = lectura.estado_medidor === 'Dañado';

  const guardar = useMutation({
    mutationFn: (v: { lectura: string; motivo: string; descripcion: string }) =>
      actualizarLecturaPendiente(lectura.id, {
        lectura: esInaccesible || !v.lectura.trim() ? null : Number(v.lectura),
        motivo: esInaccesible ? v.motivo.trim() : null,
        descripcionDano: esDanado ? v.descripcion.trim() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturas'] });
      onClose();
    },
    onError: (e) => {
      Alert.alert('No se pudo guardar', e instanceof Error ? e.message : 'Intente nuevamente');
      queryClient.invalidateQueries({ queryKey: ['lecturas'] });
    },
  });

  const form = useForm({
    defaultValues: {
      lectura: lectura.lectura !== null ? String(lectura.lectura) : '',
      motivo: lectura.motivo ?? '',
      descripcion: lectura.descripcion_dano ?? '',
    },
    onSubmit: ({ value }) => guardar.mutateAsync(value),
  });

  return (
    <Modal animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Editar {lectura.medidor_codigo}</Text>
          <Text style={styles.meta}>Estado: {lectura.estado_medidor}</Text>

          {!esInaccesible && (
            <form.Field
              name="lectura"
              validators={{
                onChange: ({ value }) =>
                  !value.trim()
                    ? esDanado
                      ? undefined
                      : 'La lectura es obligatoria'
                    : !NUMERO.test(value.trim())
                      ? 'Ingrese solo números'
                      : undefined,
              }}>
              {(field) => (
                <View style={styles.group}>
                  <Text style={styles.label}>Lectura actual</Text>
                  <TextInput
                    style={[styles.input, field.state.meta.errors.length > 0 && styles.inputError]}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    keyboardType="numeric"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <Text style={styles.error}>{String(field.state.meta.errors[0])}</Text>
                  )}
                </View>
              )}
            </form.Field>
          )}

          {esInaccesible && (
            <form.Field
              name="motivo"
              validators={{ onChange: ({ value }) => (!value.trim() ? 'El motivo es obligatorio' : undefined) }}>
              {(field) => (
                <View style={styles.group}>
                  <Text style={styles.label}>Motivo</Text>
                  <TextInput
                    style={[styles.input, field.state.meta.errors.length > 0 && styles.inputError]}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <Text style={styles.error}>{String(field.state.meta.errors[0])}</Text>
                  )}
                </View>
              )}
            </form.Field>
          )}

          {esDanado && (
            <form.Field
              name="descripcion"
              validators={{
                onChange: ({ value }) => (!value.trim() ? 'La descripción es obligatoria' : undefined),
              }}>
              {(field) => (
                <View style={styles.group}>
                  <Text style={styles.label}>Descripción del daño</Text>
                  <TextInput
                    style={[styles.input, field.state.meta.errors.length > 0 && styles.inputError]}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    multiline
                  />
                  {field.state.meta.errors.length > 0 && (
                    <Text style={styles.error}>{String(field.state.meta.errors[0])}</Text>
                  )}
                </View>
              )}
            </form.Field>
          )}

          <form.Subscribe
            selector={(s) => [s.values.lectura, s.values.motivo, s.values.descripcion] as const}>
            {([l, m, d]) => {
              const ok =
                (esInaccesible ? m.trim().length > 0 : true) &&
                (esDanado ? d.trim().length > 0 : true) &&
                (esInaccesible || esDanado
                  ? !l.trim() || NUMERO.test(l.trim())
                  : NUMERO.test(l.trim()));
              return (
                <View style={styles.acciones}>
                  <Pressable style={[styles.button, styles.secundario]} onPress={onClose}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, (!ok || guardar.isPending) && styles.disabled]}
                    disabled={!ok || guardar.isPending}
                    onPress={() => form.handleSubmit()}>
                    <Text style={styles.buttonText}>Guardar</Text>
                  </Pressable>
                </View>
              );
            }}
          </form.Subscribe>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  list: { padding: 20, gap: 12 },
  back: { fontFamily: 'Roboto_500Medium', color: C.accent, fontSize: 16, marginBottom: 8 },
  title: { fontFamily: 'Roboto_700Bold', fontSize: 24, color: C.primary, marginBottom: 12 },
  empty: { fontFamily: 'Roboto_400Regular', color: '#64748B', textAlign: 'center', marginTop: 24 },
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codigo: { fontFamily: 'Roboto_700Bold', fontSize: 18, color: C.primary },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chipText: { fontFamily: 'Roboto_700Bold', fontSize: 12, color: '#fff' },
  meta: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: '#475569', marginTop: 4 },
  editar: { fontFamily: 'Roboto_500Medium', fontSize: 13, color: C.accent, marginTop: 8 },
  bloqueado: { fontFamily: 'Roboto_500Medium', fontSize: 13, color: '#047857', marginTop: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  group: { marginTop: 12 },
  label: { fontFamily: 'Roboto_500Medium', fontSize: 14, color: C.primary, marginBottom: 6 },
  input: {
    fontFamily: 'Roboto_400Regular',
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
  error: { fontFamily: 'Roboto_400Regular', color: C.error, fontSize: 13, marginTop: 4 },
  acciones: { flexDirection: 'row', gap: 12, marginTop: 20 },
  button: {
    flex: 1,
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secundario: { backgroundColor: '#64748B' },
  disabled: { opacity: 0.45 },
  buttonText: { fontFamily: 'Roboto_500Medium', color: '#fff', fontSize: 18 },
});
