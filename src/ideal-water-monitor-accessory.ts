import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  Characteristic,
  CharacteristicValue,
  Formats,
  HAP,
  Logger,
  Perms,
  Service,
} from 'homebridge'
import {Action, ConfigOptions, CustomAlert, Dashboard} from './ideal-water.types'
import {IdealWaterService} from './ideal-water.service'
import {WaterQualityService} from './experimental/WaterQualityService'
import {Conductivity, FreeChlorine, OxygenReductionPotential, PH, TDS, WaterQuality} from './experimental/Characteristics'

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class IdealWaterMonitorAccessory implements AccessoryPlugin {
  private readonly conductivityCharacteristic: Characteristic
  private readonly freeChlorineCharacteristic: Characteristic
  private readonly oxygenReductionPotentialCharacteristic: Characteristic
  private readonly phCharacteristic: Characteristic
  private readonly totalDissolvedSolidsCharacteristic: Characteristic
  private readonly waterQualityCharacteristic: Characteristic
  private readonly config: ConfigOptions
  private readonly apiService: IdealWaterService
  private readonly batteryService: Service
  private readonly chlorineService: Service
  private readonly filterService: Service
  private readonly informationService: Service
  private readonly lightColorService: Service
  private readonly temperatureService: Service
  private readonly waterQualityService: Service
  private readonly customServices: Service[] = []
  private readonly name: string

  private dashboard: Dashboard | undefined
  private actions: Action[] = []

  constructor(private readonly log: Logger, accessoryConfig: AccessoryConfig, private readonly api: API) {
    this.config = accessoryConfig as unknown as ConfigOptions
    // Setup API service
    this.apiService = new IdealWaterService(this.config, log)
    this.apiService.login().then(() => {
      Promise.all([
        this.apiService.getDashboard().then(dash => this.dashboard = dash!).catch(log.error),
        this.apiService.getActions().then(actions => this.actions = actions!).catch(log.error)
      ]).then(() => setInterval(this.pollForNewData.bind(this), 3600000))
    }).catch(log.error)

    this.name = this.config.name
    // Define Experimental Characteristics
    this.waterQualityCharacteristic = new this.api.hap.Characteristic('Water Quality', WaterQuality.UUID, {
      format: Formats.UINT8,
      perms: [Perms.NOTIFY, Perms.PAIRED_READ],
      minValue: 0,
      maxValue: 5,
      minStep: 1,
      validValues: [0, 1, 2, 3, 4, 5],
    })
    this.conductivityCharacteristic = new api.hap.Characteristic('Conductivity', Conductivity.UUID, {
      format: Formats.FLOAT,
      perms: [Perms.NOTIFY, Perms.PAIRED_READ],
    })
    this.freeChlorineCharacteristic = new api.hap.Characteristic('Free Chlorine', FreeChlorine.UUID, {
      format: Formats.FLOAT,
      perms: [Perms.NOTIFY, Perms.PAIRED_READ],
    })
    this.oxygenReductionPotentialCharacteristic = new api.hap.Characteristic('Oxygen Reduction Potential', OxygenReductionPotential.UUID, {
      format: Formats.INT,
      perms: [Perms.NOTIFY, Perms.PAIRED_READ],
      minValue: 0,
      maxValue: 1000,
      minStep: 1,
    })
    this.phCharacteristic = new api.hap.Characteristic('pH', PH.UUID, {
      format: Formats.FLOAT,
      perms: [Perms.NOTIFY, Perms.PAIRED_READ],
      minValue: 0,
      maxValue: 14,
    })
    this.totalDissolvedSolidsCharacteristic = new api.hap.Characteristic('Total Dissolved Solids', TDS.UUID, {
      format: Formats.INT,
      perms: [Perms.PAIRED_READ, Perms.NOTIFY],
    })

    // Ensure workable config
    if (!this.config.customAlerts) {
      this.config.customAlerts = []
    }

    // Information Service
    this.informationService = new api.hap.Service.AccessoryInformation()
      .setCharacteristic(api.hap.Characteristic.Manufacturer, 'Ideal Water Care')
      .setCharacteristic(api.hap.Characteristic.Model, 'iCare')
      .setCharacteristic(api.hap.Characteristic.ConfiguredName, this.config.name)

    // // Temperature Service Setup
    this.temperatureService = new api.hap.Service.TemperatureSensor()
    this.temperatureService.setCharacteristic(api.hap.Characteristic.Name, this.config.name + ' Temperature')
    this.temperatureService.getCharacteristic(api.hap.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this))

    // Battery Service
    this.batteryService = new api.hap.Service.Battery()
    this.batteryService.setCharacteristic(api.hap.Characteristic.Name, `${this.config.name} Battery Level`)
    this.batteryService.getCharacteristic(api.hap.Characteristic.BatteryLevel)
      .onGet(this.getBatteryLevel.bind(this))
    this.batteryService.getCharacteristic(api.hap.Characteristic.StatusLowBattery)
      .onGet(this.getBatteryStatus.bind(this))

    // Filter Service
    this.filterService = new api.hap.Service.FilterMaintenance('Filter Maintenance', 'Filter Maintenance')
    this.filterService.getCharacteristic(api.hap.Characteristic.FilterChangeIndication)
      .onGet(this.getFilterChangeIndicator.bind(this))
    this.filterService.getCharacteristic(api.hap.Characteristic.ResetFilterIndication)
      .onSet(this.resetFilterIndication.bind(this))

    // Chlorine Service
    this.chlorineService = new api.hap.Service.FilterMaintenance('Chlorine Level', 'Chlorine Monitor')
    this.chlorineService.getCharacteristic(api.hap.Characteristic.FilterChangeIndication)
      .onGet(this.getChlorineIndicator.bind(this))
    this.chlorineService.getCharacteristic(api.hap.Characteristic.ResetFilterIndication)
      .onSet(this.resetChlorineIndication.bind(this))

    // Light Color Service
    this.lightColorService = new this.api.hap.Service.Lightbulb('Water Quality Color', 'Water Quality Color')
    this.lightColorService.setCharacteristic(this.api.hap.Characteristic.On, true)
    this.lightColorService.getCharacteristic(this.api.hap.Characteristic.Hue)
      .onGet(this.getHue.bind(this))
    this.lightColorService.getCharacteristic(this.api.hap.Characteristic.Saturation)
      .onGet(this.getSaturation.bind(this))
    this.lightColorService.getCharacteristic(this.api.hap.Characteristic.Brightness)
      .onGet(this.getLuminance.bind(this))

    // Water Quality Service
    this.waterQualityService = this.config.experimental ?
      new api.hap.Service('Water Quality', WaterQualityService.UUID) :
      new api.hap.Service.AirQualitySensor('Water Quality', 'Water Quality')

    if (!this.config.experimental) {
      this.waterQualityService.getCharacteristic(this.api.hap.Characteristic.AirQuality).onGet(this.getWaterQuality.bind(this))
    }

    this.waterQualityService.setCharacteristic(api.hap.Characteristic.Name, 'Water Quality Sensor')
    this.waterQualityService.addCharacteristic(api.hap.Characteristic.ReceivedSignalStrengthIndication)
      .onGet(this.getRSSI.bind(this))
    this.waterQualityService.addCharacteristic(this.waterQualityCharacteristic)
      .onGet(this.getWaterQuality.bind(this))
    this.waterQualityService.addCharacteristic(this.conductivityCharacteristic)
      .onGet(this.getConductivity.bind(this))
    this.waterQualityService.addCharacteristic(this.freeChlorineCharacteristic)
      .onGet(this.getFreeChlorine.bind(this))
    this.waterQualityService.addCharacteristic(this.oxygenReductionPotentialCharacteristic)
      .onGet(this.getOrp.bind(this))
    this.waterQualityService.addCharacteristic(this.totalDissolvedSolidsCharacteristic)
      .onGet(this.getTDS.bind(this))
    this.waterQualityService.addCharacteristic(this.phCharacteristic)
      .onGet(this.getPh.bind(this))

    // Custom Alerts
    this.config.customAlerts.forEach(customAlert => {
      this.customServices.push(this.getCustomService(this.api.hap, customAlert))
    })

    log.info('Accessory finished initializing!')
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    const serviceList = [
      this.informationService,
      this.temperatureService,
      this.batteryService,
      this.waterQualityService
    ]
    if (this.config.filterAlerts) {
      serviceList.push(this.filterService)
    }
    if (this.config.chlorineAlerts) {
      serviceList.push(this.chlorineService)
    }
    if (this.config.qualityBulb) {
      serviceList.push(this.lightColorService)
    }
    this.customServices.forEach(custom => serviceList.push(custom))
    return serviceList
  }

  async pollForNewData(): Promise<void> {
    this.log.info('Polling iCare API')
    this.apiService.getDashboard().then(dash => {
      this.dashboard = dash!
      this.temperatureService.updateCharacteristic(this.api.hap.Characteristic.CurrentTemperature, this.getCurrentTemperature())
      this.batteryService.updateCharacteristic(this.api.hap.Characteristic.BatteryLevel, this.getBatteryLevel())
      this.batteryService.updateCharacteristic(this.api.hap.Characteristic.StatusLowBattery, this.getBatteryStatus())
      this.waterQualityService.updateCharacteristic(this.api.hap.Characteristic.ReceivedSignalStrengthIndication, this.getRSSI())
      this.waterQualityService.updateCharacteristic(this.waterQualityCharacteristic.displayName, this.getWaterQuality())
      if (!this.config.experimental) {
        this.waterQualityService.updateCharacteristic(this.api.hap.Characteristic.AirQuality, this.getWaterQuality())
      }
      this.waterQualityService.updateCharacteristic(this.conductivityCharacteristic.displayName, this.getConductivity())
      this.waterQualityService.updateCharacteristic(this.freeChlorineCharacteristic.displayName, this.getFreeChlorine())
      this.waterQualityService.updateCharacteristic(this.oxygenReductionPotentialCharacteristic.displayName, this.getOrp())
      this.waterQualityService.updateCharacteristic(this.totalDissolvedSolidsCharacteristic.displayName, this.getTDS())
      this.waterQualityService.updateCharacteristic(this.phCharacteristic.displayName, this.getPh())
    }).catch(this.log.error)
    this.apiService.getActions().then(actions => {
      if (actions) {
        this.actions = actions.filter(action => action.date_done === null)
        if (this.config.filterAlerts) {
          this.filterService.updateCharacteristic(this.api.hap.Characteristic.FilterChangeIndication, this.getFilterChangeIndicator())
        }
        if (this.config.chlorineAlerts) {
          this.chlorineService.updateCharacteristic(this.api.hap.Characteristic.FilterChangeIndication, this.getChlorineIndicator())
        }
        this.customServices.forEach(customService => {
          const customAlert = this.config.customAlerts.find(alert => alert.alertName === customService.displayName)!
          customService.updateCharacteristic(this.getCharacteristicForAlertType(customAlert.alertType),
            this.getValueForSensor(customAlert.sensor))
        })
      }
    }).catch(this.log.error)
  }

  /*
   * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
   * Typical this only ever happens at the pairing process.
   */
  identify(): void {
    this.log.info('Identify!')
  }

  getHue(): CharacteristicValue {
    const hue = this.dashboard?.computed_state.color.h || 0
    this.log.debug('iCare getHue -> %s', hue)
    return hue
  }

  getSaturation(): CharacteristicValue {
    const sat = (this.dashboard?.computed_state.color.s || 0) * 100
    this.log.debug('iCare getSaturation -> %s%', sat)
    return sat
  }

  getLuminance(): CharacteristicValue {
    const lum = (this.dashboard?.computed_state.color.l || 0) * 100
    this.log.debug('iCare getLuminance -> %s%', lum)
    return lum
  }

  getCurrentTemperature(): CharacteristicValue {
    const temp = this.dashboard?.temperature.value || 0
    this.log.debug('iCare getCurrentTemperature -> %s', temp)
    return temp
  }

  getBatteryLevel(): CharacteristicValue {
    const battery = this.dashboard?.battery.value || 0
    this.log.debug('iCare getBatteryLevel -> %s', battery)
    return battery
  }

  getBatteryStatus(): CharacteristicValue {
    const battery = (this.dashboard?.battery.value || 0) > 15 ?
      this.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL :
      this.api.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
    this.log.debug('iCare getBatteryStatus -> %s', battery)
    return battery
  }

  getConductivity(): CharacteristicValue {
    const conductivity = this.dashboard?.conductivity.value || 0
    this.log.debug('iCare getConductivity -> %s', conductivity)
    return conductivity
  }

  getFreeChlorine(): CharacteristicValue {
    const fc = this.dashboard?.free_chlore.value || 0
    this.log.debug('iCare getFreeChlorine -> %s', fc)
    return fc
  }

  getOrp(): CharacteristicValue {
    const orp = this.dashboard?.orp.value || 0
    this.log.debug('iCare getOrp -> %s', orp)
    return orp
  }

  getPh(): CharacteristicValue {
    const ph = this.dashboard?.ph.value || 0
    this.log.debug('iCare getPh -> %s', ph)
    return ph
  }

  getRSSI(): CharacteristicValue {
    const rssi = this.dashboard?.rssi.value || 0
    this.log.debug('iCare getRSSI -> %s', rssi)
    return rssi
  }

  getTDS(): CharacteristicValue {
    const tds = this.dashboard?.tds.value || 0
    this.log.debug('iCare getTDS -> %s', tds)
    return tds
  }

  getWaterQuality(): CharacteristicValue {
    const wq = this.dashboard?.computed_state.value || 0
    this.log.debug('iCare getWaterQuality -> %s', wq)
    return wq > 94 ? WaterQuality.EXCELLENT :
      wq > 84 ? WaterQuality.GOOD :
        wq > 74 ? WaterQuality.FAIR :
          wq > 64 ? WaterQuality.INFERIOR :
            WaterQuality.POOR
  }

  getFilterChangeIndicator(): CharacteristicValue {
    const filterAlert = this.actions.filter(action => action.action_type.name.includes('clean')).length === 0 ?
      this.api.hap.Characteristic.FilterChangeIndication.FILTER_OK :
      this.api.hap.Characteristic.FilterChangeIndication.CHANGE_FILTER
    this.log.debug('iCare getFilterChangeIndicator -> %s', filterAlert)
    return filterAlert
  }

  resetFilterIndication() {
    this.actions.filter(action => action.action_type.name.includes('clean'))
      .forEach(filterAlert => this.apiService.completeAction(filterAlert.id)
        .then(this.pollForNewData.bind(this)).catch(this.log.error))
  }

  getChlorineIndicator(): CharacteristicValue {
    if (!this.actions) {
      return false
    }
    const filterAlert = this.actions.filter(action => action.action_type.name === 'chlore').length === 0 ?
      this.api.hap.Characteristic.FilterChangeIndication.FILTER_OK :
      this.api.hap.Characteristic.FilterChangeIndication.CHANGE_FILTER
    this.log.debug('iCare getChlorineIndicator -> %s', filterAlert)
    return filterAlert
  }

  resetChlorineIndication() {
    if (!this.actions) {
      // eslint-disable-next-line quotes
      this.log.error("Can't reset Chlorine Indication")
    }
    this.actions.filter(action => action.action_type.name === 'chlore')
      .forEach(filterAlert => this.apiService.completeAction(filterAlert.id)
        .then(this.pollForNewData.bind(this)).catch(this.log.error))
  }

  private getCustomService(hap: HAP, customAlert: CustomAlert): Service {
    switch (customAlert.alertType) {
      case 'Light': return this.customLightAlert(hap, customAlert)
      case 'Contact': return this.customContactAlert(hap, customAlert)
      case 'Filter': return this.customFilterAlert(hap, customAlert)
      case 'Leak': return this.customLeakAlert(hap, customAlert)
      case 'Smoke': return this.customSmokeAlert(hap, customAlert)
      default: throw Error('Unknown Custom Service Type')
    }
  }

  private customLightAlert(hap: HAP, customAlert: CustomAlert): Service {
    const cla = new hap.Service.Lightbulb(customAlert.alertName, customAlert.alertName)
    cla.getCharacteristic(hap.Characteristic.On)
      .onGet(() => this.isCustomAlertIsTripped(customAlert))
    return cla
  }

  private customContactAlert(hap: HAP, customAlert: CustomAlert): Service {
    const cca = new hap.Service.ContactSensor(customAlert.alertName, customAlert.alertName)
    cca.getCharacteristic(hap.Characteristic.ContactSensorState)
      .onGet(() => this.isCustomAlertIsTripped(customAlert) ?
        hap.Characteristic.ContactSensorState.CONTACT_DETECTED :
        hap.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED)
    return cca
  }

  private customFilterAlert(hap: HAP, customAlert: CustomAlert): Service {
    const cfa = new hap.Service.FilterMaintenance(customAlert.alertName, customAlert.alertName)
    cfa.getCharacteristic(hap.Characteristic.FilterChangeIndication)
      .onGet(() => this.isCustomAlertIsTripped(customAlert) ?
        hap.Characteristic.FilterChangeIndication.CHANGE_FILTER :
        hap.Characteristic.FilterChangeIndication.FILTER_OK)
    return cfa
  }

  private customLeakAlert(hap: HAP, customAlert: CustomAlert): Service {
    const cla = new hap.Service.LeakSensor(customAlert.alertName, customAlert.alertName)
    cla.getCharacteristic(hap.Characteristic.LeakDetected)
      .onGet(() => this.isCustomAlertIsTripped(customAlert) ?
        hap.Characteristic.LeakDetected.LEAK_DETECTED :
        hap.Characteristic.LeakDetected.LEAK_NOT_DETECTED)
    return cla
  }

  private customSmokeAlert(hap: HAP, customAlert: CustomAlert): Service {
    const csa = new hap.Service.SmokeSensor(customAlert.alertName, customAlert.alertName)
    csa.getCharacteristic(hap.Characteristic.SmokeDetected)
      .onGet(() => this.isCustomAlertIsTripped(customAlert) ?
        hap.Characteristic.SmokeDetected.SMOKE_DETECTED :
        hap.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED)
    return csa
  }

  private isCustomAlertIsTripped(customAlert: CustomAlert): boolean {
    const actualValue = this.getValueForSensor(customAlert.sensor)
    if (customAlert.comparator === 'Less than') {
      return actualValue < customAlert.value
    }
    if (customAlert.comparator === 'More than') {
      return actualValue > customAlert.value
    }
    return actualValue === customAlert.value
  }

  private getValueForSensor(sensor: string): number {
    switch (sensor) {
      case 'ORP': return this.dashboard?.orp.value || 0
      case 'TDS': return this.dashboard?.tds.value || 0
      case 'pH': return this.dashboard?.ph.value || 0
      default: throw Error('Unknown Sensor Type')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getCharacteristicForAlertType(alertType: string): any {
    switch (alertType) {
      case 'Light': return this.api.hap.Characteristic.On
      case 'Contact': return this.api.hap.Characteristic.ContactSensorState
      case 'Filter': return this.api.hap.Characteristic.FilterChangeIndication
      case 'Leak': return this.api.hap.Characteristic.LeakDetected
      case 'Smoke': return this.api.hap.Characteristic.SmokeDetected
      default: throw Error('Unknown Alert Type')
    }
  }
}
