import {Logging} from 'homebridge'
import axios from 'axios'
import {ConfigOptions, Dashboard} from './ideal-water.types'


export class IdealWaterService {
  private readonly HOST = 'https://app.ondilo.com/api/v2'

  constructor(private readonly config: ConfigOptions,
              private readonly log: Logging) {}

  public async getDashboard(): Promise<Dashboard | void> {
    const myHeaders = {
      'Authorization': this.config.authToken,
      'Accept': 'application/json'
    }

    const requestOptions = {
      headers: myHeaders,
    }

    this.log('Attempting to get Dashboard.')
    return axios.get(`${this.HOST}/pools/${this.config.userId}/datas/dashboard`, requestOptions)
      .then(response => response.data as Promise<Dashboard>)
      .catch(error => {
        this.log.error(error)
      })
  }
}
