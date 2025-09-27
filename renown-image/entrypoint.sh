#!/bin/bash

# Display the splash screen
/bin/bash /splash_screen.sh

# Source some files
source /helpers/colors.sh
source /helpers/messages.sh

# Is debug mode enabled? Do you want to see more messages?
if [[ "${EGG_DEBUG}" == "1" ]]; then
    echo "Egg Debug Mode Enabled!"
fi

# Change Directory
cd /home/container

###################################
# HANDLE AUTO UPDATE / VALIDATION #
###################################

if [ -f /sections/auto_update_validate.sh ]; then
  Debug "/sections/auto_update_validate.sh exists and is found!"
  # Directly run the script without chmod
  source /sections/auto_update_validate.sh
else
  Error "/sections/auto_update_validate.sh does not exist or cannot be found." "1"
fi

#############################
# REPLACE STARTUP VARIABLES #
#############################

if [ -f /sections/replace_startup_variables.sh ]; then
  Debug "/sections/replace_startup_variables.sh exists and is found!"
  # Directly run the script without chmod
  source /sections/replace_startup_variables.sh
else
  Error "/sections/replace_startup_variables.sh does not exist or cannot be found." "1"
fi

# Fix for Rust not starting
Debug "Defining the Library Path..."
export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/home/container/.steam/sdk64"
cp /home/container/.steam/sdk64/steamclient.so /home/container


# Display Ending Splash Screen
/bin/bash /end_screen.sh

Debug "Grabbing the public IP address of the node"
RCON_IP=$(curl -sS ifconfig.me)

# Run the Server
node /wrapper.js "${MODIFIED_STARTUP}"