import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import React from 'react'
import ExploreContainer from '../components/ExploreContainer'
import './Home.css'
import { useTranslation } from 'react-i18next'

const Home: React.FC = () => {
  const { t } = useTranslation('home')

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Blank</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">{t('title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ExploreContainer />
      </IonContent>
    </IonPage>
  )
}

export default Home
