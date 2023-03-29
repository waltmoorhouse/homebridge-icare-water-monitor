import { API } from 'homebridge';

import {PLATFORM_NAME} from './settings'
import {IdealWaterMonitorAccessory} from './ideal-water-monitor-accessory'

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerAccessory(PLATFORM_NAME, IdealWaterMonitorAccessory);
};
