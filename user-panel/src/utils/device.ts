import { UAParser } from 'ua-parser-js'

// Device + browser info for the login payload, matching the Angular UAParser usage:
// device_info = Desktop|Mobile|Tablet, browser_info = "<os.name> | <browser.name>".
export function getDeviceInfo(): { device_info: string; browser_info: string } {
  const r = new UAParser().getResult()
  const type = r.device.type
  let device = 'Desktop'
  if (type === 'mobile') device = 'Mobile'
  else if (type === 'tablet') device = 'Tablet'
  return { device_info: device, browser_info: `${r.os.name} | ${r.browser.name}` }
}

// True when the device is a phone (UAParser device.type === 'mobile'), used to pick
// the mobile vs desktop game URL — same check the Angular launchers used.
export function isMobile(): boolean {
  return new UAParser().getDevice().type === 'mobile'
}

// Dream-casino detail treats `device.type === undefined` as desktop (i.e. not a
// phone/tablet) — preserved exactly for its `desktop` payload flag.
export function isDesktopDevice(): boolean {
  return new UAParser().getDevice().type === undefined
}
