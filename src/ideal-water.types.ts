export type ConfigOptions = {
  experimental: boolean
  email: string
  password: string
  name: string
  locale: string
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

export type LoginResponse = {
  userId: number
  token: string
  locale: string
  created_at: string
}

export type Dashboard = {
  temperature: Sensor
  orp: Sensor
  ph: Sensor
  rssi: Sensor
  battery: Sensor
  free_chlore: Sensor
  conductivity: Sensor
  tds: Sensor
  computed_state: ComputedState
  nb_actions: number
  reports: Report[]
  last_update_date: string
  device_position: string
  weather: Weather
}

export type Sensor = {
  id: number
  data_type: DataType
  value: number
  value_time: string
  exclusion_reason: null
  is_valid: boolean
  average_value: number | null
  trend: number | null
  color: Color | null
}

export type Color = {
  h: number
  s: number
  l: number
}

export type DataType = {
  name: string
  unit: null | string
  id: number
  slug: string
}

export type ComputedState = {
  color: Color
  value: number
}

export type Report = {
  title: null
  content: null | string
  image_url: null | string
  link_url: null | string
}

export type Weather = {
  id: number
  temp: number
}

export type Action = {
  creation_date: string
  updated_at: string
  id: number
  action_type: ActionType
  product: Product | null
  value_recommendation: number | null
  value_done: null
  date_recommendation: string
  date_done: null | string
  status: Status
  message_formatted: string
  description_formatted: string
}

export type ActionType = {
  name: string
  description: string
  message: string
  id: number
  slug: string
  data_type: ActionDataType
}

export type ActionDataType = {
  name: Name
  unit: null | string
  id: number
  slug: Slug
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
  name: string
  description: string
  id: number
  reference: null
  conditioning: Conditioning
  type: Conditioning
  brand: Brand
  image_url: string
  technical_sheet_url: null
  is_pool_product: boolean
  is_pool_additional_product: boolean
  packing: Conditioning
  relevant: boolean
  formula_formatted: null
  unit_old: string
}

export type Brand = {
  id: number
  name: string
}

export type Conditioning = {
  translation: string
  id: number
  slug: string
}

export enum Status {
  Ok = 'ok',
  Waiting = 'waiting',
}

export type UserResponse = {
  id: number
  email: string
  unit_preferences: UnitPreferences
  role: string
  firstname: string
  lastname: string
  pools: Pool[]
  devices: Device[]
  user_platforms: UserPlatform[]
  street: null
  zipcode: null
  city: null
  country: null
  latitude: null
  longitude: null
}

export type Device = {
  status: string
  id: number
  uuid: string
  serial_number: string
  ble_fw_version: string
  wifi_uuid: string
  wifi_fw_version: string
  wifi_mac_address: string
  sigfox_id: null
  sigfox_pac: null
  device_type: DeviceType
  user: null
  hw_version: string
  ping_flag: number
  battery_type: string
  partner: Partner
  product_partner: Partner
  calibrations: Calibrations
  is_orphan: boolean
  init_status: string
  device_position: string
  battery: number
  rssi: number
  sw_version: string
}

export type Calibrations = {
  ph: null
  orp: null
}

export type DeviceType = {
  id: number
  slug: string
}

export type Partner = {
  id: number
  name: string
  logo_url: null | string
}

export type Pool = {
  role: string
  disinfection_type: number
  updated_at: string
  id: number
  user: null
  current: boolean
  volume: number
  device: Device
  pool_configurations: PoolConfiguration[]
  status: string
  configuration: { [key: string]: number | null }
  conditionings: Conditionings
  name: string
  user_is_owner: boolean
  type: string
  uv_sanitizer: boolean
  ozonator: boolean
  filtration_cartridge: boolean
  image_id: string
  street: string
  zipcode: string
  city: string
  country: string
  latitude: number
  longitude: number
}

export type Conditionings = {
  bromine_shock: number
  slow_bromine: number
  chlorine_shock: number
  slow_chlorine: number
  ph_minus: number
  ph_plus: number
  salt: number
  multi_function_chlorine: number
  tac_plus: number
}

export type PoolConfiguration = {
  id: number
  slug: string
  value: string
}

export type UnitPreferences = {
  conductivity: string
  hardness: string
  orp: string
  pressure: string
  product_mass: string
  product_volume: string
  salt: string
  speed: string
  tds: string
  temperature: string
  volume: string
}

export type UserPlatform = {
  user_id: number
  locale: string
  uuid: string
  token: string
  time_zone: string
  os_type: string
  os_version: string
  model: string
  constructor: string
  app_version: string
  brand: string
}
