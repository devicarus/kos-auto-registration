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
 * DEBUG_HEADLESS is a boolean that says whether the browser should be launched in headless mode.
 * @defaultValue true
 */
const DEBUG_HEADLESS: boolean = process.env.DEBUG_HEADLESS === 'false' || true

const SECONDS_BETWEEN_CHECKS: number = parseInt(process.env.SECONDS_BETWEEN_CHECKS || '180' /* default 2 minutes */)
const SECONDS_BEFORE_RESTART_ON_ERROR: number = parseInt(process.env.SECONDS_BEFORE_RESTART_ON_ERROR || '1200' /* default 20 minutes */)

const KOS_USERNAME = { get: (): string => process.env.KOS_USERNAME ?? (() => { throw new AuthError('KOS_USERNAME not set') })() }
const KOS_PASSWORD = { get: (): string => process.env.KOS_PASSWORD ?? (() => { throw new AuthError('KOS_PASSWORD not set') })() }

export { DEBUG, DEBUG_HEADLESS, SECONDS_BETWEEN_CHECKS, SECONDS_BEFORE_RESTART_ON_ERROR, KOS_USERNAME, KOS_PASSWORD};