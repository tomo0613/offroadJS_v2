export class NotificationElement {
    domElement = document.createElement('div');
    testText: string;
    private domElement_textContent = document.createElement('span');

    constructor() {
        this.domElement.classList.add('notificationElement', 'hidden');
        this.domElement.appendChild(this.domElement_textContent);
    }

    get hidden() {
        return this.domElement.classList.contains('hidden');
    }

    show() {
        this.domElement.classList.remove('hidden');
    }

    fadeOut() {
        this.domElement.classList.add('fade-out');
    }

    hide() {
        this.domElement.classList.remove('fade-out');
        this.domElement.classList.add('hidden');
    }

    setContent(content: string) {
        this.testText = content;
        this.domElement_textContent.textContent = content;
    }
}
