#!/bin/sh
############################################################
#                                                          #
# Contents of file Copyright (c) Prelert Ltd 2006-2014     #
#                                                          #
#----------------------------------------------------------#
#----------------------------------------------------------#
# WARNING:                                                 #
# THIS FILE CONTAINS UNPUBLISHED PROPRIETARY               #
# SOURCE CODE WHICH IS THE PROPERTY OF PRELERT LTD AND     #
# PARENT OR SUBSIDIARY COMPANIES.                          #
# PLEASE READ THE FOLLOWING AND TAKE CAREFUL NOTE:         #
#                                                          #
# This source code is confidential and any person who      #
# receives a copy of it, or believes that they are viewing #
# it without permission is asked to notify Prelert Ltd     #
# on +44 (0)20 7953 7243 or email to legal@prelert.com.    #
# All intellectual property rights in this source code     #
# are owned by Prelert Ltd.  No part of this source code   #
# may be reproduced, adapted or transmitted in any form or #
# by any means, electronic, mechanical, photocopying,      #
# recording or otherwise.                                  #
#                                                          #
#----------------------------------------------------------#
#                                                          #
#                                                          #
############################################################

# This script requires that the following components be available from
# sub-directories under $PRELERT_TOOLS_HOME:
#
# kibana-src-3.0.1
#

BASE_KIBANA_VERSION=3.0.1
PRELERT_GUI_URL=dashboard

if [ -z "$PRELERT_TOOLS_HOME" ] ; then
    case `uname` in
        Darwin)
            PRELERT_TOOLS_HOME=/Volumes/tools
            ;;
        Linux)
            PRELERT_TOOLS_HOME=/export/tools
            ;;
        MINGW32*)
            PRELERT_TOOLS_HOME=/t
            ;;
        SunOS)
            PRELERT_TOOLS_HOME=/export/tools
            ;;
        *)
            echo "Unsupported operating system"
            exit 1
            ;;
    esac
fi

if [ -z "$KIBANA_SRC_HOME" ] ; then
    KIBANA_SRC_HOME="$PRELERT_TOOLS_HOME/javascript/kibana-src-$BASE_KIBANA_VERSION/src"
fi

if [ ! -d "$KIBANA_SRC_HOME" ] ; then
    echo "$KIBANA_SRC_HOME not found"
    exit 2
fi

if [ -z "$JETTY_HOME" ] ; then
    JETTY_HOME="$PRELERT_HOME/cots/jetty"
fi

INSTALL_DIR="$JETTY_HOME/webapps/$PRELERT_GUI_URL"

# Make the directory twice so that it ends up empty regardless of whether it
# already existed and what may or may not have been in it
mkdir -p "$INSTALL_DIR"
rm -rf "$INSTALL_DIR"
mkdir "$INSTALL_DIR"
if [ ! -d "$INSTALL_DIR" ] ; then
    echo "$INSTALL_DIR could not be created"
    exit 3
fi

echo "Copying base Kibana from $KIBANA_SRC_HOME"
(cd "$KIBANA_SRC_HOME" && tar cf - .) | (cd "$INSTALL_DIR" && tar xvf -)

echo "Overlaying Prelert files"
(cd engineAPI && tar cf - .) | (cd "$INSTALL_DIR" && tar xvf -)

