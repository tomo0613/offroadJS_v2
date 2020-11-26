import ObjectPool from '../common/ObjectPool';
import { NotificationElement } from './NotificationElement';

const popUpMessageDuration = 1500;
const popUpMessageFadeOutDuration = 1000;
const popUpMessageContainer = document.createElement('div');
popUpMessageContainer.id = 'notificationElementContainer';
document.body.appendChild(popUpMessageContainer);
document.documentElement.style.setProperty('--fade-out-duration', `${popUpMessageFadeOutDuration / 1000}s`);

const notificationElementPool = new ObjectPool<NotificationElement>(1, {
    itemProvider() {
        return new NotificationElement();
    },
    itemActiveCheck(item) {
        const active = !item.hidden;

        return active;
    },
    itemActivator(item) {
        item.show();
        popUpMessageContainer.appendChild(item.domElement);
    },
    itemDeactivator(item) {
        item.hide();
    },
});

export function showNotification(content: string) {
    const notificationElement = notificationElementPool.obtain();
    notificationElement.setContent(content);

    window.setTimeout(() => {
        window.setTimeout(() => {
            notificationElementPool.release(notificationElement);
        }, popUpMessageFadeOutDuration);
        notificationElement.fadeOut();
    }, popUpMessageDuration);
}
