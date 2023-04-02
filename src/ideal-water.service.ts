import {Logging} from 'homebridge'
import axios from 'axios'
import {Action, ConfigOptions, Dashboard} from './ideal-water.types'


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

  public async getActions(): Promise<Array<Action> | void> {
    const myHeaders = {
      'Authorization': this.config.authToken,
      'Accept': 'application/json'
    }

    const requestOptions = {
      headers: myHeaders,
    }

    const today = new Date()
    const dateString = today.getFullYear() + '-' +this.pad(today.getMonth() + 1) + '-' + this.pad(today.getDate())

    this.log(`Attempting to get Suggested Actions for ${dateString}.`)
    return axios.get(`${this.HOST}/pools/${this.config.userId}/actions?from=${dateString}`, requestOptions)
      .then(response => response.data as Promise<Array<Action>>)
      .catch(error => {
        this.log.error(error)
      })
  }

  public async completeAction(id: number): Promise<Action | void> {
    this.log(`Attempting to  Complete Action ${id}.`)
    const config = {
      method: 'put',
      maxBodyLength: Infinity,
      url: `https://app.ondilo.com/api/v2/actions/${id}`,
      headers: {
        'Authorization': this.config.authToken,
      }
    }

    return axios(config)
  }

  private pad(val: number) {
    if (val < 10) {
      return `0${val}`
    }
    return `${val}`
  }
}
