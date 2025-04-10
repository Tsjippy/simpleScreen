/*
Save this file as "secrets.js". Do not commit this file to a public repository as it contains the credentials to your Home Assistant instance.
 */

const HA_SECRET     = ""; // Access token
const HA_INSTANCE   = ""; // http://URL:PORT
const TITLE         = ''; // Webpage title

// The entities we want to receive updates for
var entIds          = {
    'outdoor_temp':         '',
    'outdoor_hum':          '',
    'max_temp_outside':     '',
    'min_temp_outside':     '',
    'indoor_temp':          '',
    'indoor_hum':           '',
    'max_temp_inside':      '',
    'min_temp_inside':      '',
    'rain':                 '',
    'rain_rate':            '',
    'custom':               '',
    'footer_1':             '',
    'footer_2':             '',
    'footer_3':             '',
};
