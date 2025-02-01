import 'dotenv/config'
import { AuthError } from './errors'

/**
 * DEBUG is a boolean that indicates whether the program should run in debug mode.
 * @remarks
 * At the moment this only affects the logging level.
 * @defaultValue false
 */
const DEBUG: boolean = process.env.DEBUG === 'true' || false
/**
 * DEBUG_BROWSER is a boolean that says whether the browser should launch with a visible window.
 * @defaultValue false
 */
const DEBUG_BROWSER: boolean = process.env.DEBUG_BROWSER === 'true' || false

const SECONDS_BETWEEN_CHECKS: number = parseInt(process.env.SECONDS_BETWEEN_CHECKS || '180' /* default 2 minutes */)
const SECONDS_BEFORE_RESTART_ON_ERROR: number = parseInt(process.env.SECONDS_BEFORE_RESTART_ON_ERROR || '1200' /* default 20 minutes */)
const SECONDS_TIMEOUT: number = parseInt(process.env.SECONDS_TIMEOUT || '30' /* default 0.5 minute */)

const KOS_USERNAME = { get: (): string => process.env.KOS_USERNAME ?? (() => { throw new AuthError('KOS_USERNAME not set') })() }
const KOS_PASSWORD = { get: (): string => process.env.KOS_PASSWORD ?? (() => { throw new AuthError('KOS_PASSWORD not set') })() }

export { DEBUG, DEBUG_BROWSER, SECONDS_BETWEEN_CHECKS, SECONDS_BEFORE_RESTART_ON_ERROR, SECONDS_TIMEOUT, KOS_USERNAME, KOS_PASSWORD};