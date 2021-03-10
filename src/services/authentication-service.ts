import { IonicAuth, IonicAuthOptions } from '@ionic-enterprise/auth'
import { GlobalConfig } from '../workgrid-app'
import { Capacitor } from '@capacitor/core'

class CognitoAuthenticationService extends IonicAuth implements AuthenticationService {}

export interface AuthenticationService {
  isAuthenticated(): Promise<boolean>
  getAccessToken(): Promise<string | undefined>
  login(): Promise<void>
  logout(): Promise<void>
  clearStorage(): Promise<void>
}

export function authenticationServiceFactory(globalConfig: GlobalConfig): AuthenticationService {
  const cognitoDetails = globalConfig.cognito.userPools[0]

  const config: Pick<IonicAuthOptions, 'authConfig' | 'clientID' | 'discoveryUrl' | 'scope'> = {
    authConfig: 'cognito',
    clientID: cognitoDetails.clients['workgridclient'].clientId,
    discoveryUrl: `https://cognito-idp.${cognitoDetails.userPoolId.split('_')[0]}.amazonaws.com/${
      cognitoDetails.userPoolId
    }/.well-known/openid-configuration`,
    scope: 'openid com.workgrid.api/userclient.all'
  }

  const platform = Capacitor.getPlatform()

  switch (platform) {
    case 'web':
      return new CognitoAuthenticationService({
        ...config,
        platform: 'web',
        redirectUri: 'http://localhost:8100/login',
        logoutUrl: 'http://localhost:8100/login'
        // implicitLogin: 'CURRENT'
      })
    case 'ios':
    case 'android':
      return new CognitoAuthenticationService({
        ...config,
        platform: 'capacitor',
        redirectUri: 'com.workgrid.client://login',
        logoutUrl: 'com.workgrid.client://login',
        iosWebView: 'shared'
      })
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}
