import {
    Auth,
    createLongLivedTokenAuth,
    getAuth,
    getUser,
    callService,
    createConnection,
    subscribeEntities,
    ERR_HASS_HOST_REQUIRED
} from "home-assistant-js-websocket";

import './secrets.js';

let unsubEntities;
var connection          = '';
var counter             = 0;
 
// Only check the ones we are interested in 
var entIds          = [
    'sensor.pws_temperature',
    'sensor.pws_temperature_indoor',
    'sensor.pws_humidity_indoor',
    'sensor.pws_humidity',
    'sensor.maximum_temperature_outside',
    'sensor.minimum_temperature_outside',
    'sensor.maximum_temperature_inside',
    'sensor.minimum_temperature_inside',
    'sensor.pws_rain',
    'sensor.pws_rainrate',
    'media_player.allemaal',
    'media_player.keuken',
    'media_player.woonkamer'
];

async function authenticate(){
    let auth;
    const storeAuth     = true;
    const authOptions   = storeAuth
    ? {
        async loadTokens() {
            try {
                return JSON.parse(localStorage.hassTokens);
            } catch (err) {
                return undefined;
            }
        },
        saveTokens: (tokens) => {
            localStorage.hassTokens = JSON.stringify(tokens);
        },
    }
    : {};

    try {
        auth            = await getAuth(authOptions);
    } catch (err) {
        if (err === ERR_HASS_HOST_REQUIRED) {
            authOptions.hassUrl = prompt(
                "What host to connect to?",
                "http://localhost:8123",
            );

            if (!authOptions.hassUrl) return;

            auth            = await getAuth(authOptions);
        } else {
            alert(`Unknown error: ${err}`);
            return;
        }
    }

    connection = await createConnection({ auth });
    
    for (const ev of ["disconnected", "ready", "reconnect-error"]) {
        connection.addEventListener(ev, () => console.log(`Event: ${ev}`));
    }

    // Clear url if we have been able to establish a connection
    if (location.search.includes("auth_callback=1")) {
        history.replaceState(null, "", location.pathname);
    }

    // To play from the console
    window.auth         = auth;
    window.connection   = connection;

    getUser(connection).then((user) => {
        console.log("Logged in as", user);
        window.user = user;
    });
}

function setMaxMinContent(selector, entity){
    document.querySelectorAll(selector).forEach(el => el.textContent   =   entity.state + '°');

    let time        = new Date(entity.last_changed);
    let h           = time.getHours();
    let m           = time.getMinutes();
    m               = addLeadingZeros(m);
    document.querySelectorAll(selector.replace('-temp', '-time')).forEach(el => el.textContent   =   `${h}:${m}`);  
}

function processEntity(entity, entities){
    let entId   = entity.entity_id;

    // Temperatures
    if( entId == 'sensor.pws_temperature'){
        document.querySelector(`#outside .tempwrapper .temp`).textContent = entity.state;

        checkTimedOut(entity, `#outside .tempwrapper .temp`);
    }else if( entId == 'sensor.pws_temperature_indoor'){
        document.querySelector(`#inside .tempwrapper .temp`).textContent = entity.state;

        checkTimedOut(entity, `#inside .tempwrapper .temp`);
    }

    // Humidity
    else if( entId == 'sensor.pws_humidity'){
        document.querySelector(`#outside .humwrapper .hum`).textContent = entity.state;
    }else if( entId == 'sensor.pws_humidity_indoor'){
        document.querySelector(`#inside .humwrapper .hum`).textContent = entity.state;
    }
    
    // Max Temps
    else if( entId == 'sensor.maximum_temperature_outside'){
        setMaxMinContent('#outside .max .max-temp', entity);
    }else if( entId == 'sensor.maximum_temperature_inside'){
        setMaxMinContent('#inside .max .max-temp', entity); 
    }
    
    // Min temps
    else if( entId == 'sensor.minimum_temperature_outside'){
        setMaxMinContent('#outside .min .min-temp', entity);
    }else if( entId == 'sensor.minimum_temperature_inside'){
        setMaxMinContent('#inside .min .min-temp', entity); 
    }
    
    // Rain
    else if( entId == 'sensor.pws_rain'){
        updateRain(entity.state, entities['sensor.pws_rainrate']);
    }else if( entId == 'sensor.pws_rainrate'){
        updateRain(entities['sensor.pws_rain'], entity.state);
    }

    // Only change the url if needed, otherwise it will reload
    else if( entId.includes( 'media_player' ) && document.querySelector('.mediaplayer iframe') == null){
        // we are playing or buffering and not playing before
        if((entity.state == 'playing' || entity.state == 'buffering')){
            console.log('Showing Media player');

            // hide main container
            document.querySelector('.container').style.display      = 'none';  

            let iframe      = document.createElement('iframe');
            iframe.name     = 'ha-main-window';
            iframe.onload   = hideTopBar;

            // Set the iframe url
            let url = 'http://192.168.0.200:8123/';
            if (entId == 'media_player.allemaal'){
                url   += 'dashboard-chromecast/0';
            }else if(entId == 'media_player.keuken'){
                url   += 'chromecast-keuken/0';
            }else if(entId == 'media_player.woonkamer'){
                url   += 'chromecast-woonkamer/0';
            }

            // Show the iframe
            document.querySelector('.mediaplayer').appendChild(iframe);

            iframe.src   = url;
        }
    }
}

// Display the received entities
function renderEntities(connection, entities) {
    let firstRun    = false;

    if(window.entities == undefined){
        window.entities = entities;
        firstRun        = true;
    }

    // Loop over the entities we are interested in
    let playing = false;

    Object.values(entities).forEach(entity => {
        // Only do something if needed
        if(entity.state != window.entities[entity.entity_id].state || firstRun){
            processEntity(entity, entities);
        }

        // Check if we are playing no matter if it is changed or not
        if( entity.entity_id.includes( 'media_player' ) && ( entity.state == 'playing' || entity.state == 'buffering')){
            playing = true;
        }
    });

    // Store the updated entities
    window.entities = entities;

    // Show main container again if we are not playing and there is an iframe
    if( !playing && document.querySelector('.mediaplayer iframe') != null ){
        console.log('Hiding Media player');

        // hide all
        document.querySelector('.mediaplayer').remove(); 

        document.querySelector('.container').style.display = 'block';   
    }
}
  
/**
 * Updates the date and time on the header
 */
function setDateTime() {
    const today     = new Date();
    let h           = today.getHours();
    let m           = today.getMinutes();
    m               = addLeadingZeros(m);

    let dateString  = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;

    if(document.getElementById('clock').innerHTML !=  h + ":" + m){
        document.getElementById('clock').innerHTML =  h + ":" + m;
    }

    if(document.getElementById('date').innerHTML !=  dateString){
        document.getElementById('date').innerHTML =  dateString;
    }
}

/**
 * Adds a zero to numbers below 10
 * 
 * @param {integer} i the number to check
 * 
 * @returns {string}    number with leading zeros if needed
 */
function addLeadingZeros(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10

    return i;
}

/**
 * Check if a device is not updated in a while
 * @param {object}  entity      The home assistant enity
 * @param {string}  selector    The queryselector
 */
function checkTimedOut(entity, selector){
    let date        = Date.parse(entity.last_changed);

    let minutes     = ( Date.now() - date ) / 1000 / 60;

    let timedOut    = false;

    if(minutes > 180){
        timedOut    = true;
    }

    if(timedOut){
        document.querySelector(selector).classList.add('timedout');
    }else{
        document.querySelector(selector).classList.remove('timedout');
    }
}

/**
 * Updates the display of the rain
 */
function updateRain(rain, rainRate){
    if(rain == 0){
        return;
    }

    let el  = document.getElementById('rain');

    let val = `<img src='rain.png' width='70px'>`;

    if(rainRate > 0){
        val += `${rainRate}mm/h`;
    }else if(rain > 0){
        val += `${rain}mm`;
    }else{
        val = ``;
    }

    if(el.innerHTML !=  val){
        el.innerHTML =  val;

        if(val == ''){
            el.style.display = 'none';
            document.getElementById('date').style.display = 'block';
        }else{
            el.style.display = 'block';
            document.getElementById('date').style.display = 'none';
        }
    }
}

/* Based on ethanny2 solution: https://gist.github.com/ethanny2/44d5ad69970596e96e0b48139b89154b */
function detectDoubleTap(doubleTapMs) {
    let timeout, lastTap = 0;

    return function detectDoubleTap(event) {
        const currentTime = new Date().getTime();
        const tapLength   = currentTime - lastTap;

        if (0 < tapLength && tapLength < doubleTapMs) {
            event.preventDefault();

            const doubleTap = new CustomEvent("doubletap", {
                bubbles: true,
                detail: event
            });

            event.target.dispatchEvent(doubleTap)
        } else {
            timeout = setTimeout(() => clearTimeout(timeout), doubleTapMs)
        }
        lastTap = currentTime
    }
}

window.setupEntitiesSubscription = async () => {
    if (unsubEntities) {
        unsubEntities();
        console.log("Sleeping");
        await new Promise((resolve) => setTimeout(resolve, 4000));
    }

    unsubEntities = subscribeEntities(
        connection, 
        (entities) => renderEntities(connection, entities),
        entIds
    );
};

// Update the time every minute
setDateTime();
setInterval(setDateTime, 60000);

if(typeof(HA_INSTANCE) != 'undefined'){
    console.log('Logging in with long live access token');

    await (async () => {
        const auth = createLongLivedTokenAuth(
            HA_INSTANCE,
            HA_SECRET,
        );

        connection = await createConnection({ auth });
    })();
}else{
    await authenticate();
}

setupEntitiesSubscription();

// initialize the new event
document.addEventListener('pointerup', detectDoubleTap(500));

// Listen to two taps on the screen
document.addEventListener('doubletap', (event) => {
    ['switch.woonkamer_lamp_switch_0', 'switch.smart_plug_3_socket_1', 'switch.smart_plug_2_socket_1'].forEach(id =>{
        callService(connection, "homeassistant", "toggle", {
            entity_id: id,
        });
    });
});

window.scrollTo(0, 0);

// Hide topbar when iframe is loaded
async function hideTopBar(event){
    let iframe  = event.target;
    await new Promise(r => setTimeout(r, 5000));

    try{
        iframe.contentWindow.document.querySelector("home-assistant").shadowRoot.querySelector("home-assistant-main").shadowRoot.querySelector("ha-panel-lovelace").shadowRoot.querySelector("hui-root").shadowRoot.querySelector(".header").remove();

        iframe.contentWindow.document.querySelector("home-assistant").shadowRoot.querySelector("home-assistant-main").shadowRoot.querySelector("ha-panel-lovelace").shadowRoot.querySelector("hui-root").shadowRoot.querySelector("#view").style.paddingTop='unset';

        document.querySelector("body > home-assistant").shadowRoot.querySelector("home-assistant-main").shadowRoot.querySelector("ha-drawer > ha-sidebar")
    }catch(err) {
        // Wait a minute
        await new Promise(r => setTimeout(r, 10000));

        counter++;

        if( counter < 10){
            hideTopBar(event);
        }else{
            console.log(err.message);
        }
    }
}