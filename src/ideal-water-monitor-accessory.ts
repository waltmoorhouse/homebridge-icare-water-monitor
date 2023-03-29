import {
  Service,
  CharacteristicValue,
  AccessoryPlugin,
  Logging,
  AccessoryConfig,
  API,
} from 'homebridge'

import {ConfigOptions, Dashboard} from './ideal-water.types'
import {IdealWaterService} from './ideal-water.service'

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class IdealWaterMonitorAccessory implements AccessoryPlugin {
  private readonly apiService: IdealWaterService
  private dashboard: Dashboard | undefined
  private readonly informationService: Service
  private readonly temperatureService: Service
  private readonly config: ConfigOptions
  private readonly name: string

  constructor(private readonly log: Logging, accessoryConfig: AccessoryConfig, private readonly api: API) {
    this.log = log
    this.config = accessoryConfig as unknown as ConfigOptions
    this.apiService = new IdealWaterService(this.config, log)
    this.apiService.getDashboard().then(dash => this.dashboard = dash!)
    this.name = this.config.name

    this.informationService = new api.hap.Service.AccessoryInformation()
      .setCharacteristic(api.hap.Characteristic.Manufacturer, 'Ideal Water Care')
      .setCharacteristic(api.hap.Characteristic.Model, 'iCare')
      .setCharacteristic(api.hap.Characteristic.ConfiguredName, 'iCare Water Monitor')

    // Temperature Service Setup
    this.temperatureService = new api.hap.Service.TemperatureSensor()
    this.temperatureService.setCharacteristic(api.hap.Characteristic.Name, this.config.name + ' Temperature')
    this.temperatureService.getCharacteristic(api.hap.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this))

    setInterval(this.pollForNewData.bind(this), 3600000)
    log.info('Accessory finished initializing!')
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.informationService,
      this.temperatureService,
      // TODO add more services here
    ]
  }

  async pollForNewData(): Promise<void> {
    this.log.info('Polling iCare API')
    this.apiService.getDashboard().then(dash => {
      this.dashboard = dash!
      this.temperatureService.updateCharacteristic(this.api.hap.Characteristic.CurrentTemperature, dash!.temperature.value)
      // TODO add more services here
    })
  }

  /*
   * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
   * Typical this only ever happens at the pairing process.
   */
  identify(): void {
    this.log('Identify!')
  }

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    const temp = this.dashboard!.temperature.value
    this.log.debug('iCare getCurrentTemperature -> %s', temp)
    return temp
  }
}
