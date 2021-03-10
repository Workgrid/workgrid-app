import { IonContent, IonPage } from '@ionic/react'
import React from 'react'
import styled from 'styled-components'
import { Button } from '@workgrid/ui'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthenticationProvider'

const HorizontallyCenteredContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const CenteredContent = styled(HorizontallyCenteredContainer)`
  justify-content: center;
  max-width: 100%;
  height: 100%;
  overflow-y: auto;
`

const Container = styled(HorizontallyCenteredContainer)`
  max-width: 320px;
`

const Home: React.FC = () => {
  const { signOut } = useAuth()
  const { t } = useTranslation('authentication')

  return (
    <IonPage>
      <IonContent>
        <CenteredContent>
          <Container>
            <Button onClick={signOut}>{t('signOutText')}</Button>
          </Container>
        </CenteredContent>
      </IonContent>
    </IonPage>
  )
}

export default Home
