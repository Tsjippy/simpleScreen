import {
    callService
} from "home-assistant-js-websocket";

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

// initialize the new event
document.addEventListener('pointerup', detectDoubleTap(500));

// Listen to two taps on the screen and turn change the lights
document.addEventListener('doubletap', () => {
    document.getElementById('popup').classList.remove('hidden');
});

document.addEventListener('click', ev =>{
    let target  = ev.target;
    let action;

    if(target.dataset.action == 'all-on'){
        action  = 'turn_on';
    }else if(target.dataset.action == 'all-off'){
        action  = 'turn_off';
    }else if(target.closest('.modal-close') != undefined){
        document.getElementById('popup').classList.add('hidden');
    }

    if(action){
        ['switch.woonkamer_lamp_switch_0', 'switch.smart_plug_3_socket_1', 'switch.smart_plug_2_socket_1'].forEach(id =>{
            callService(connection, "homeassistant", action, {
                entity_id: id,
            });
        });
    }
})