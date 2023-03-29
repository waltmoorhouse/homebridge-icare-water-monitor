export type ConfigOptions = {
  userId: string
  authToken: string
  name: string
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
