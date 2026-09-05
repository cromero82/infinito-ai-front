export interface BilleteOption {
  label: string;
  valor: number;
  imagen: string;
}

/** Denominaciones de Pago en efectivo / Mixto (misma fuente para el asistente de cierre). */
export const BILLETES_COP: readonly BilleteOption[] = [
  {
    label: '$ 100.000',
    valor: 100000,
    imagen: 'assets/img/cash/billete-100mil-medium.png'
  },
  {
    label: '$ 50.000',
    valor: 50000,
    imagen: 'assets/img/cash/billete-50mil-medium.png'
  },
  {
    label: '$ 20.000',
    valor: 20000,
    imagen: 'assets/img/cash/billete-20-mil-medium.png'
  },
  {
    label: '$ 10.000',
    valor: 10000,
    imagen: 'assets/img/cash/billete-10-mil-medium.png'
  },
  {
    label: '$ 5.000',
    valor: 5000,
    imagen: 'assets/img/cash/billete-5-mil-medium.png'
  },
  {
    label: '$ 2.000',
    valor: 2000,
    imagen: 'assets/img/cash/billete-2-mil-small.png'
  }
];
