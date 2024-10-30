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

//import handle_subscribe_entities from 

import './secrets.js';

let unsubEntities;
var connection      = 'hello';

async function authenticate(){
    let auth;
    const storeAuth = true;
    const authOptions = storeAuth
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

        authenticated   = true;
    } catch (err) {
        if (err === ERR_HASS_HOST_REQUIRED) {
            authOptions.hassUrl = prompt(
                "What host to connect to?",
                "http://localhost:8123",
            );

            if (!authOptions.hassUrl) return;

            auth            = await getAuth(authOptions);

            authenticated   = true;
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
    window.auth = auth;
    window.connection = connection;
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

// Display the received entities
function renderEntities(connection, entities) {
    window.entities = entities;

    let rain        = -1;
    let rainRate    = -1;
    Object.keys(entities).sort().forEach((entId) => {      
        // Temperatures
        if( entId == 'sensor.pws_temperature'){
            document.querySelector(`#outside .tempwrapper .temp`).textContent = entities[entId].state;

            checkTimedOut(entities[entId], `#outside .tempwrapper .temp`);
        }else if( entId == 'sensor.pws_temperature_indoor'){
            document.querySelector(`#inside .tempwrapper .temp`).textContent = entities[entId].state;

            checkTimedOut(entities[entId], `#inside .tempwrapper .temp`);
        }

        // Humidity
        else if( entId == 'sensor.pws_humidity'){
            document.querySelector(`#outside .humwrapper .hum`).textContent = entities[entId].state;
        }else if( entId == 'sensor.pws_humidity_indoor'){
            document.querySelector(`#inside .humwrapper .hum`).textContent = entities[entId].state;
        }
        
        // Max Temps
        else if( entId == 'sensor.maximum_temperature_outside'){
            setMaxMinContent('#outside .max .max-temp', entities[entId]);
        }else if( entId == 'sensor.maximum_temperature_inside'){
            setMaxMinContent('#inside .max .max-temp', entities[entId]); 
        }
        
        // Min temps
        else if( entId == 'sensor.minimum_temperature_outside'){
            setMaxMinContent('#outside .min .min-temp', entities[entId]);
        }else if( entId == 'sensor.minimum_temperature_inside'){
            setMaxMinContent('#inside .min .min-temp', entities[entId]); 
        }
        
        // Rain
        else if( entId == 'sensor.pws_rain'){
            rain        = entities[entId].state;
        }else if( entId == 'sensor.pws_rainrate'){
            rainRate    = entities[entId].state;
        }
        
        /* if (
            ["switch", "light", "input_boolean"].includes(
            entId.split(".", 1)[0],
            )
        ) {
            const button = document.createElement("button");
            button.innerHTML = "toggle";
            button.onclick = () =>
            callService(connection, "homeassistant", "toggle", {
                entity_id: entId,
            });
            tdState.appendChild(button);
        }
        tr.appendChild(tdState);

        root.appendChild(tr); */
    });

    if( rain > 0 && rainRate > -1){
        updateRain(rain, rainRate);
    }
}
  
/**
 * Updates the date and time on the header
 */
function setDateTime() {
    const today     = new Date();
    let h           = today.getHours();
    let m           = today.getMinutes();
    let s           = today.getSeconds();
    m               = addLeadingZeros(m);
    s               = addLeadingZeros(s);

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

    if(minutes > 15){
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
    }else if(device.Rain > 0){
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

    unsubEntities = subscribeEntities(connection, (entities) =>
        renderEntities(connection, entities),
    );
};


/* console.log(connection)

test = await websocket_api.websocket_command(
    {
        "id": 1,
        "type": "subscribe_entities",
        "entity_ids": [
          "light.my_light"
        ]
      }
);

console.log(test); */

setDateTime();

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

// put the addEventListener on some tag
document.addEventListener('doubletap', (event) => {
    callService(connection, "homeassistant", "toggle", {
        entity_id: 'switch.woonkamer_lamp_switch_0',
    });
});