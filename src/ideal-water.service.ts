import {Logger} from 'homebridge'
import axios from 'axios'
import {Action, ConfigOptions, Dashboard, LoginResponse, UserResponse} from './ideal-water.types'


export class IdealWaterService {
  private readonly BASE_URL = 'https://app.ondilo.com/api/v2'
  private userId = ''
  private authToken = ''
  private poolId = ''

  constructor(private readonly config: ConfigOptions,
              private readonly log: Logger) {}

  public async login(): Promise<void> {
    const axConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${this.BASE_URL}/authentication/login`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        'email': this.config.email,
        'password': this.config.password,
        'locale': this.config.locale,
      }),
    }

    return axios(axConfig)
      .then((response) => {
        const login = response.data as LoginResponse
        this.authToken = login.token
        this.userId = `${login.userId}`
        this.log.info('Auth Token Acquired')
        return this.getPoolId()
      })
  }

  public async getPoolId(): Promise<void> {
    if (!this.authToken || this.authToken === '') {
      return Promise.reject('Invalid Auth token')
    }
    const axConfig = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://app.ondilo.com/api/v2/users/'+this.userId,
      headers: {
        'Accept': 'application/json',
        'Authorization': this.authToken,
      }
    }

    return axios(axConfig)
      .then((response) => {
        const user = response.data as UserResponse
        this.poolId = String(user.pools[0].id)
        this.log.info('Acquired Pool ID: '+ this.poolId)
      })
  }

  public async getDashboard(): Promise<Dashboard | void> {
    if (!this.authToken || this.authToken === '') {
      return Promise.reject('Invalid Auth token')
    }
    const myHeaders = {
      'Authorization': this.authToken,
      'Accept': 'application/json'
    }

    const requestOptions = {
      headers: myHeaders,
    }

    return axios.get(`${this.BASE_URL}/pools/${this.poolId}/datas/dashboard`, requestOptions)
      .then(response => this.checkFor401(response).data as Dashboard)
  }

  public async getActions(): Promise<Array<Action> | void> {
    const today = new Date()
    const dateString = today.getFullYear() + '-' +this.pad(today.getMonth() + 1) + '-' + this.pad(today.getDate())
    this.log.debug(`Attempting to get Suggested Actions for ${dateString}.`)

    if (!this.authToken || this.authToken === '') {
      return Promise.reject('Invalid Auth token')
    }
    const myHeaders = {
      'Authorization': this.authToken,
      'Accept': 'application/json'
    }

    const requestOptions = {
      headers: myHeaders,
    }

    return axios.get(`${this.BASE_URL}/pools/${this.poolId}/actions?from=${dateString}`, requestOptions)
      .then(response => this.checkFor401(response).data as Array<Action>)
  }

  public async completeAction(id: number): Promise<Action | void> {
    this.log.debug(`Attempting to  Complete Action ${id}.`)
    if (!this.authToken || this.authToken === '') {
      return Promise.reject('Invalid Auth token')
    }
    const config = {
      method: 'put',
      maxBodyLength: Infinity,
      url: `https://app.ondilo.com/api/v2/actions/${id}`,
      headers: {
        'Authorization': this.authToken,
      }
    }

    return axios(config)
      .then(response => this.checkFor401(response).data as Action)
  }

  private pad(val: number) {
    if (val < 10) {
      return `0${val}`
    }
    return `${val}`
  }

  private checkFor401(response: axios.AxiosResponse): axios.AxiosResponse {
    if (response.status === 401) {
      this.login().then(() => this.log.debug('Logging back in after 401'))
    }
    return response
  }
}
