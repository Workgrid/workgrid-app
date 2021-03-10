export interface GlobalConfig {
  cognito: {
    userPools: [
      {
        appDomain: string
        userPoolId: string
        clients: {
          workgridclient: {
            clientId: string
          }
        }
      }
    ]
  }
  apiHost: string
}
