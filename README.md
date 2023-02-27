# AdguardHome Schedule Block Services

## Pre-requirements

While this can be installed in any server with crontab, I recommend installing this in a local network server or even better in the same adguardhome server host due to the basic authentication security used by AdguardHome.

- [AdguardHome compatible w adguard-home-api v0.2.0](https://github.com/AdguardTeam/AdGuardHome#api)
- [git](https://openwrt.org/packages/pkgdata/git)
- [node](https://openwrt.org/packages/pkgdata/node)
- [node-npm](https://openwrt.org/packages/pkgdata/node-npm)

## Installation

```
$ git clone https://github.com/MrcRjs/adguardhome-scheduled-block-service.git aghblock
$ cd aghblock && sudo make install
```

## Configuration

Once installation is complete you need to set your own configuration adding the following environment variables to your `.bash_profile` or `.profile`.

```
export AGH_SERVER="127.0.0.1:2023" # Your adguard home server ip and port
export AGH_USER="your_agh_username"
export AGH_PASS="your_agh_password"
```

Confirm your configuration works by getting the current services blocked status with:

```
$ aghblock status
```

## Schedule block

We'll use [crontab](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/crontab.html) as it is widely available for linux distributions including OpenWrt.

Edit your crontab file from a terminal in openwrt:

```
$ crontab -e
```

To block services during the weekdays Monday to Friday at 9am add:

```
0 09 * * 1-5 aghblock block facebook,youtube,instagram,tiktok
```

[crontab.guru](https://crontab.guru/#0_09_*_*_1-5) is a great resource to build / understand a cron schedule.

We add one more line to unblock services during the weekdays Monday to Friday at 5pm add:

```
0 17 * * 1-5 aghblock unblock facebook,youtube,instagram,tiktok
```

**Note** you can also update your crontab through the UI luci app by clicking on _System_ -> _Scheduled Tasks_ you can paste the same lines from the previous steps.
