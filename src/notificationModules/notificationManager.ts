import ObjectPool from '../common/ObjectPool';
import { PopUpMessage } from './popUpMessage';
import { PopUpWindow } from './popUpWindow';

export const popUpWindow = new PopUpWindow();
const popUpMessageDuration = 1500;
const popUpMessageFadeOutDuration = 1000;
const popUpMessageContainer = document.createElement('div');
popUpMessageContainer.id = 'popUpMessage_container';
document.body.appendChild(popUpMessageContainer);
document.documentElement.style.setProperty('--fade-out-duration', `${popUpMessageFadeOutDuration / 1000}s`);

const popUpMessagePool = new ObjectPool<PopUpMessage>(1, {
    itemProvider() {
        return new PopUpMessage();
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

export function showPopUpMessage(content: string) {
    const popUpMessage = popUpMessagePool.obtain();
    popUpMessage.setContent(content);

    window.setTimeout(() => {
        window.setTimeout(() => {
            popUpMessagePool.release(popUpMessage);
        }, popUpMessageFadeOutDuration);
        popUpMessage.fadeOut();
    }, popUpMessageDuration);
}
