// Buffer polyfill — required by @ton/core (and TON Connect) in the browser.
// Must be imported before any module that touches Buffer.
import { Buffer } from 'buffer'

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}
