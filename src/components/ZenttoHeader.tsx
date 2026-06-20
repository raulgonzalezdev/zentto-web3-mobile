import { IonHeader, IonTitle, IonToolbar } from '@ionic/react';

export default function ZenttoHeader({ title }: { title: string }) {
  return (
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>{title}</IonTitle>
      </IonToolbar>
    </IonHeader>
  );
}
