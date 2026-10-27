import { getDb } from '@/db/database';

import { limpiarBorrador } from './borrador.service';
import type { EstadoMedidor } from './useLecturaStore';

export interface DatosLecturaLocal {
  medidorCodigo: string;
  estadoMedidor: EstadoMedidor;
  lectura: number | null;
  motivo?: string;
  descripcionDano?: string;
  consumoCalculado: number | null;
  fotoUri: string | null;
}

const ETIQUETA_ESTADO: Record<EstadoMedidor, string> = {
  normal: 'Normal',
  inaccesible: 'Inaccesible',
  danado: 'Dañado',
};

// R4: queda PENDIENTE (sincronizado = 0) hasta que la cola la envíe.
export async function guardarLecturaLocal(datos: DatosLecturaLocal): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    `INSERT INTO lecturas_pendientes
      (medidor_codigo, lectura, estado_medidor, motivo, descripcion_dano,
       consumo_calculado, foto_uri, fecha_registro, sincronizado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      datos.medidorCodigo,
      datos.lectura,
      ETIQUETA_ESTADO[datos.estadoMedidor],
      datos.motivo ?? null,
      datos.descripcionDano ?? null,
      datos.consumoCalculado,
      datos.fotoUri,
      new Date().toISOString(),
    ],
  );

  // R8: el borrador ya no es necesario una vez guardada la lectura.
  await limpiarBorrador();
  return res.lastInsertRowId;
}
