#!/bin/bash

################################
# STEAMCMD DOWNLOAD GAME FILES #
################################

source /helpers/messages.sh

Debug "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-="
Debug "Inside /helpers/steamcmd.sh file!"

Info "Sourcing SteamCMD Script..."

# We need to delete the steamapps directory in order to prevent the following error:
# Error! App '1512690' state is 0x486 after update job.
# Ref: https://www.reddit.com/r/playark/comments/3smnog/error_app_376030_state_is_0x486_after_update_job/
function Delete_SteamApps_Directory() {
    Debug "Deleting SteamApps Folder as a precaution..."
    rm -rf /home/container/steamapps
}

# Validate when downloading
function SteamCMD_Validate() {
	Debug "Inside Function: SteamCMD_Validate()"

    
    if [[ "${GAME_VERSION}" == *"beta"* ]]; then
        Delete_SteamApps_Directory
        Info "Downloading Beta Files - Validation On!"
        ./steamcmd/steamcmd.sh +force_install_dir /home/container +login anonymous +app_update 1512690 -beta beta validate +quit
    else
        Delete_SteamApps_Directory
        Info "Downloading Default Files - Validation On!"
        ./steamcmd/steamcmd.sh +force_install_dir /home/container +login anonymous +app_update 1512690 -beta public validate +quit
    fi
}

# Don't validate while downloading
function SteamCMD_No_Validation() {
	Debug "Inside Function: SteamCMD_No_Validation()"

    if [[ "${GAME_VERSION}" == *"beta"* ]]; then
        Info "Downloading Beta Files - Validation Off!"		
        ./steamcmd/steamcmd.sh +force_install_dir /home/container +login anonymous +app_update 1512690 -beta beta +quit
    else
        Info "Downloading Default Files - Validation Off!"
        ./steamcmd/steamcmd.sh +force_install_dir /home/container +login anonymous +app_update 1512690 -beta public +quit
    fi
}
