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

document.addEventListener('click', async ev =>{
    let target  = ev.target;
    let domain  = target.dataset.domain;
    let action  = target.dataset.action;
    let id      = target.dataset.id;

    if(target.closest('.modal-close') != undefined){
        document.getElementById('popup').classList.add('hidden');

        closeModal();
    }else if(target.matches(`.tablink`)){
        let curActive   = document.querySelector(`.tablink.active`);
        document.querySelector(`#${curActive.dataset.target}`).classList.add('hidden');
        curActive.classList.remove('active');
        target.classList.add('active');
        document.querySelector(`#${target.dataset.target}`).classList.remove('hidden');
    }

    if(action != undefined){

        callService(window.connection, domain, action, {
            entity_id: id,
        });

        if(action == 'turn_on'){
            target.dataset.action = 'turn_off';
        }else if(action == 'turn_off'){
            target.dataset.action = 'turn_on';
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        closeModal();
    }
});

document.addEventListener('change', ev =>{
    let target  = ev.target;

    let selectedOption  = target.options[target.selectedIndex];

    console.log(selectedOption);

    let domain  = selectedOption.dataset.domain;
    let action  = selectedOption.dataset.action;
    let id      = selectedOption.dataset.id;

    callService(window.connection, domain, action, {
        entity_id: id,
    });
});

function closeModal(){
    document.getElementById('popup').classList.add('hidden');
}