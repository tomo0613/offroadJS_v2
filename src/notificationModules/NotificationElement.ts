export class NotificationElement {
    notificationElement = document.createElement('div');
    private notificationElementBody = document.createElement('span');

    constructor() {
        this.notificationElement.classList.add('notificationElement', 'hidden');
        this.notificationElement.appendChild(this.notificationElementBody);
    }

    get hidden() {
        return this.notificationElement.classList.contains('hidden');
    }

    show() {
        this.notificationElement.classList.remove('hidden');
    }

    fadeOut() {
        this.notificationElement.classList.add('fade-out');
    }

    hide() {
        this.notificationElement.classList.remove('fade-out');
        this.notificationElement.classList.add('hidden');
    }

    setContent(content: string) {
        this.notificationElementBody.textContent = content;
    }
}
