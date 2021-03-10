import { IonContent, IonPage } from '@ionic/react'
import React from 'react'
import styled from 'styled-components'
import { Button } from '@workgrid/ui'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthenticationProvider'
import { useSpaces } from './SpacesProvider'

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
  const { currentSpaceId, spaces, onSpaceChange } = useSpaces()
  const { t } = useTranslation('authentication')

  return (
    <IonPage>
      <IonContent>
        <CenteredContent>
          <Container>
            <p>Current Space: {spaces.find(space => space.id === currentSpaceId)?.name}</p>
            {/* providing empty string for demonstration purposes until the actual screens to switch are in place. This wouldn't happen in practice */}
            <Button onClick={() => onSpaceChange('')}>Switch Space</Button>
            <Button onClick={signOut}>{t('signOutText')}</Button>
          </Container>
        </CenteredContent>
      </IonContent>
    </IonPage>
  )
}

export default Home
