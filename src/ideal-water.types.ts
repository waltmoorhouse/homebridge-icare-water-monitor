export type ConfigOptions = {
  experimental: boolean
  userId: string
  authToken: string
  name: string
  filterAlerts: boolean
  chlorineAlerts: boolean
  qualityBulb: boolean
  customAlerts: CustomAlert[]
}

export type CustomAlert = {
  alertName: string
  alertType: string
  sensor: string
  comparator: string
  value: number
}

export type Dashboard = {
  temperature: Sensor;
  orp: Sensor;
  ph: Sensor;
  rssi: Sensor;
  battery: Sensor;
  free_chlore: Sensor;
  conductivity: Sensor;
  tds: Sensor;
  computed_state: ComputedState;
  nb_actions: number;
  reports: Report[];
  last_update_date: string;
  device_position: string;
  weather: Weather;
}

export type Sensor = {
  id: number;
  data_type: DataType;
  value: number;
  value_time: string;
  exclusion_reason: null;
  is_valid: boolean;
  average_value: number | null;
  trend: number | null;
  color: Color | null;
}

export type Color = {
  h: number;
  s: number;
  l: number;
}

export type DataType = {
  name: string;
  unit: null | string;
  id: number;
  slug: string;
}

export type ComputedState = {
  color: Color;
  value: number;
}

export type Report = {
  title: null;
  content: null | string;
  image_url: null | string;
  link_url: null | string;
}

export type Weather = {
  id: number;
  temp: number;
}

export type Action = {
  creation_date: string;
  updated_at: string;
  id: number;
  action_type: ActionType;
  product: Product | null;
  value_recommendation: number | null;
  value_done: null;
  date_recommendation: string;
  date_done: null | string;
  status: Status;
  message_formatted: string;
  description_formatted: string;
}

export type ActionType = {
  name: string;
  description: string;
  message: string;
  id: number;
  slug: string;
  data_type: ActionDataType;
}

export type ActionDataType = {
  name: Name;
  unit: null | string;
  id: number;
  slug: Slug;
}

export enum Name {
  FreeChlore = 'Free chlore',
  ORPAverage = 'ORP average',
  Optimisation = 'optimisation',
}

export enum Slug {
  FreeChlore = 'free_chlore',
  Optimisation = 'optimisation',
  OrpAverage = 'orp_average',
}

export type Product = {
  name: string;
  description: string;
  id: number;
  reference: null;
  conditioning: Conditioning;
  type: Conditioning;
  brand: Brand;
  image_url: string;
  technical_sheet_url: null;
  is_pool_product: boolean;
  is_pool_additional_product: boolean;
  packing: Conditioning;
  relevant: boolean;
  formula_formatted: null;
  unit_old: string;
}

export type Brand = {
  id: number;
  name: string;
}

export type Conditioning = {
  translation: string;
  id: number;
  slug: string;
}

export enum Status {
  Ok = 'ok',
  Waiting = 'waiting',
}
