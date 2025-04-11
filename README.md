## Description
A completely custom webpage to show some Home Assistant sensor data full screen.

In this case the inside and outside temperature and humidity including the maximum and minimum temperatures.

It also displays a media player when one of the home assistant media players starts playing.

Double tab to open up a modal window to sun any switch, remote or selector

Define your specific settings in secrets.js

## Screenshots 
The main screen:
![main screen](https://github.com/Tsjippy/simpleScreen/blob/main/main.png?raw=true)

If a mediaplayer incorparated in Home Assistan starts playing:
![main screen](https://github.com/Tsjippy/simpleScreen/blob/main/media_player.png?raw=true)


## Installation
Download the files and place them in the \config\www folder of your Home Assistantant server.
Edit secrets.js and update it with your desired sensor ids, HA url and long live [Access token](https://developers.home-assistant.io/docs/auth_api/#long-lived-access-token)
