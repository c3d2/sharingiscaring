Simple 1-click filesharing web app. The interface consists of an
upload form on top and recent downloads below.

__Installation__

    cd workdir
    npm install git://github.com/c3d2/sharingiscaring.git

__Running on a privileged port__

On Linux from Debian package *libcap2-bin*::

    setcap 'cap_net_bind_service=+ep' /usr/bin/node

__Usage__

    export PORT=80
    ./node_modules/.bin/sharingiscaring

Needs write access to file `files.json` and directory `files`.

It tries to keep its disk usage below 2 GB within 23 files. You can
adjust these limits in `files.js`.
