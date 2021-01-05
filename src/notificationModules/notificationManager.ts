import ObjectPool from '../common/ObjectPool';
import { DialogEvent, dialogListener, mountDialogRoot } from './Dialog';
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
        popUpMessageContainer.appendChild(item.notificationElement);
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

let dialogModalMounted = false;

dialogListener.add(DialogEvent.didMount, () => {
    dialogModalMounted = true;
});
dialogListener.add(DialogEvent.willUnmount, () => {
    dialogModalMounted = false;
});

mountDialogRoot();

export function confirmDialog(message: string): Promise<boolean> {
    if (dialogModalMounted) {
        dialogListener.dispatch(DialogEvent.open, message);
    } else {
        const openDialogWhenMounted = () => {
            dialogListener.remove(DialogEvent.didMount, openDialogWhenMounted);
            dialogListener.dispatch(DialogEvent.open, message);
        };
        dialogListener.add(DialogEvent.didMount, openDialogWhenMounted);
    }

    return new Promise((resolve) => {
        dialogListener.add(DialogEvent.confirm, onConfirm);

        function onConfirm(confirmed: boolean) {
            dialogListener.remove(DialogEvent.confirm, onConfirm);

            resolve(confirmed);
        }
    });
}
