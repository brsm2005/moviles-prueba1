import { apiClient } from './apiClient';

export interface Medidor {
  codigo: string;
  direccion: string;
  sector: string;
  numeroCuenta: string;
  estado: string;
  ultimaLectura: number;
  fechaLectura: string;
  promedioMensual: number;
}

export interface Lectura {
  id?: string;
  medidorCodigo: string;
  codigoEmpleado: string;
  estadoMedidor: 'Normal' | 'Inaccesible' | 'Dañado';
  lectura: number | null;
  motivo?: string;
  descripcionDano?: string;
  consumoCalculado: number | null;
  esAnomalo: boolean;
  fotoURL?: string;
  fechaRegistro: string;
}

export const medidoresService = {
  async getByCodigo(codigo: string): Promise<Medidor | null> {
    const { data } = await apiClient.get<Medidor[]>('/medidores', { params: { codigo } });
    return data.find((m) => m.codigo === codigo) ?? null;
  },
};

export const lecturasService = {
  async create(lectura: Lectura): Promise<Lectura> {
    const { data } = await apiClient.post<Lectura>('/lecturas', lectura);
    return data;
  },
  async findByMedidor(medidorCodigo: string): Promise<Lectura[]> {
    const { data } = await apiClient.get<Lectura[]>('/lecturas', { params: { medidorCodigo } });
    return data;
  },
};
