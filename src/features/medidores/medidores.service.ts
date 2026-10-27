import NetInfo from '@react-native-community/netinfo';

import { medidoresService } from '@/axios/api.services';
import { getDb } from '@/db/database';

import type { Medidor } from './medidores.types';
import { validarCodigoMedidor } from './medidores.validator';

interface MedidorRow {
  codigo: string;
  direccion: string;
  sector: string;
  numero_cuenta: string;
  estado: string;
  ultima_lectura: number;
  fecha_lectura: string;
  promedio_mensual: number;
  cached_at: string;
}

const toMedidor = (r: MedidorRow): Medidor => ({
  codigo: r.codigo,
  direccion: r.direccion,
  sector: r.sector,
  numeroCuenta: r.numero_cuenta,
  estado: r.estado,
  ultimaLectura: r.ultima_lectura,
  fechaLectura: r.fecha_lectura,
  promedioMensual: r.promedio_mensual,
});

const hoy = () => new Date().toISOString().slice(0, 10);

async function leerCache(codigo: string): Promise<MedidorRow | null> {
  const db = await getDb();
  return db.getFirstAsync<MedidorRow>('SELECT * FROM medidores_cache WHERE codigo = ?', [codigo]);
}

async function guardarCache(m: Medidor): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO medidores_cache
      (codigo, direccion, sector, numero_cuenta, estado, ultima_lectura, fecha_lectura, promedio_mensual, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      m.codigo,
      m.direccion,
      m.sector,
      m.numeroCuenta,
      m.estado,
      m.ultimaLectura,
      m.fechaLectura,
      m.promedioMensual,
      new Date().toISOString(),
    ],
  );
}

export async function obtenerMedidor(codigo: string): Promise<Medidor> {
  // R2: código inválido no toca red ni BD.
  const validacion = validarCodigoMedidor(codigo);
  if (!validacion.esValido) {
    throw new Error(validacion.mensajeError);
  }

  // R3: caché del día se sirve sin descargar de nuevo.
  const cache = await leerCache(codigo);
  if (cache && cache.cached_at.slice(0, 10) === hoy()) {
    return toMedidor(cache);
  }

  const red = await NetInfo.fetch();
  const hayRed = red.isConnected === true && red.isInternetReachable !== false;

  if (hayRed) {
    try {
      const remoto = await medidoresService.getByCodigo(codigo);
      if (!remoto) throw new Error('Medidor no encontrado');
      await guardarCache(remoto);
      return remoto;
    } catch (e) {
      // Sin respuesta de red: se usa el dato local aunque sea de otro día.
      if (cache) return toMedidor(cache);
      throw e;
    }
  }

  if (cache) return toMedidor(cache);
  throw new Error('Sin conexión y el medidor no está en caché local');
}
