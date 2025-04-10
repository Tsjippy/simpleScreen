/*
Save this file as "secrets.js". Do not commit this file to a public repository as it contains the credentials to your Home Assistant instance.
 */

const HA_SECRET     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhYTEzZDI5ZjNjNTA0MmE5YjgwMzZkZWNhZjg1OGFjMiIsImlhdCI6MTcyOTY4MjY3NywiZXhwIjoyMDQ1MDQyNjc3fQ.BxHG5_Zwwg-sJpYouFzIBNSO5vo9cfb_8xB9Hw4vRxY";
const HA_INSTANCE   = "http://192.168.0.200:8123";
const TITLE         = '';

// The entities we want to receive updates for
var entIds          = {
    'outdoor_temp':         'sensor.pws_temperature',
    'outdoor_hum':          'sensor.pws_humidity',
    'max_temp_outside':     'sensor.maximum_temperature_outside',
    'min_temp_outside':     'sensor.minimum_temperature_outside',
    'indoor_temp':          'sensor.pws_temperature_indoor',
    'indoor_hum':           'sensor.pws_humidity_indoor',
    'max_temp_inside':      'sensor.maximum_temperature_inside',
    'min_temp_inside':      'sensor.minimum_temperature_inside',
    'rain':                 'sensor.pws_rain',
    'rain_rate':            'sensor.pws_rainrate',
    'custom':               'binary_sensor.nepa'
};
