export type OTPAlgorithm = 'SHA1' | 'SHA256' | 'SHA512'

export interface Account {
  id: string
  issuer: string
  account: string
  secret: string
  algorithm: OTPAlgorithm
  period: number
  digits: number
}
