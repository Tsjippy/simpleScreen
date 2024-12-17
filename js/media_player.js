import {
    callService
} from "home-assistant-js-websocket";

var progressTimer;

// function to show the screen
export function showMediaPlayer(entity){
    console.log(entity)

    let mediaplayer = document.querySelector('#mediaplayer');
    mediaplayer.classList.remove('hidden');

    // Store the device we are playing on
    mediaplayer.dataset.player_id   = entity.entity_id;

    console.log('Showing Media player');

    // Hide main container
    document.querySelector('.container').classList.add('hidden');

    // Background image
    if(entity.attributes.entity_picture != undefined){
        mediaplayer.style.backgroundImage               = `url("${entity.attributes.entity_picture}")`; //https://i.scdn.co/image/ab67616d0000b273c1fe6f334de756c96d708d95
    }else if(entity.attributes.app_name == 'Spotify'){
        mediaplayer.style.backgroundImage               = `url(images/spotify.png)`; 
    }else if(entity.attributes.app_name == 'Youtube'){
        mediaplayer.style.backgroundImage               = `url(images/youtube.png)`; 
    }

    // Title
    mediaplayer.querySelector(`.title`).textContent     = entity.attributes.media_title;

    // Volume
    mediaplayer.querySelector('#volume-slider').value   = entity.attributes.volume_level;

    // Playback controls
    if(entity.state == 'playing' || entity.state == 'buffering'){
        mediaplayer.querySelector(`#pause`).classList.remove('hidden');
        mediaplayer.querySelector(`#play`).classList.add('hidden');
    }else{
        mediaplayer.querySelector(`#pause`).classList.add('hidden');
        mediaplayer.querySelector(`#play`).classList.remove('hidden');
    }

    // Seek control

    // We do not get a progress update every time, so do it manualy until the next update
    if(progressTimer != ''){
        clearInterval(progressTimer);
    }

    mediaplayer.querySelector(`#progress`).max          = entity.attributes.media_duration;
    mediaplayer.querySelector(`#progress`).value        = entity.attributes.media_position;

    if(entity.state == 'playing'){
        progressTimer   = setInterval((ev) => mediaplayer.querySelector(`#progress`).value = parseFloat(mediaplayer.querySelector(`#progress`).value) + 0.1, 100);
    }
}

// Listen to controls
document.addEventListener('click', (event) => {
    let target              = event.target;
    let parent              = target.closest('span');
    let mediaControlWrapper = target.closest(`#mediaplayer`);
    if(mediaControlWrapper == null){
        return;
    }
    let domain              = target.dataset.domain;
    if(domain == undefined){
        domain  = "media_player";
    }
    
    // The entity id of the device we run the action for
    let playerId    = mediaControlWrapper.dataset.player_id;   

    let action;

    let data        = {
        entity_id: playerId
    }

    if(target.id    == 'volume-slider'){
        action                  = 'volume_set';

        data['volume_level']    = Math.min(target.value, 0.9); 
    }else if(parent != null){
        action  = parent.dataset.action;
    }else{
        action  = target.dataset.action;
    }

    if(action == 'volume_mute'){
        console.log(parent);
        if(parent.querySelector('img').src.includes('volume-mute.png')){
            console.log(parent);
            data['is_volume_muted'] = true;
            parent.querySelector('img').src = 'images/volume-muted.png'
        }else{
            console.log(parent);
            data['is_volume_muted'] = false;
            parent.querySelector('img').src = 'images/volume-mute.png'
        }
    }else if(action == 'media_seek'){
        data['seek_position']   = target.value;
    }

    callService(connection, domain, action, data);
});