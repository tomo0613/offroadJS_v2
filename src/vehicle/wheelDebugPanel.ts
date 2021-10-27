import { RaycastVehicle } from 'cannon-es';

import { round } from '../utils';

const wheelInfoContainerElements: HTMLDivElement[] = [];
let initialized = false;

export default {
    init,
    update,
};

function init() {
    const wheelDebugPanel = document.createElement('aside');
    const frontLeftWheelInfoContainer = document.createElement('div');
    const frontRightWheelInfoContainer = document.createElement('div');
    const rearLeftWheelInfoContainer = document.createElement('div');
    const rearRightWheelInfoContainer = document.createElement('div');
    wheelInfoContainerElements.push(
        frontRightWheelInfoContainer,
        frontLeftWheelInfoContainer,
        rearRightWheelInfoContainer,
        rearLeftWheelInfoContainer,
    );
    wheelDebugPanel.style.position = 'fixed';
    wheelDebugPanel.style.top = '100px';
    wheelDebugPanel.style.padding = '20px';
    wheelDebugPanel.style.background = 'rgba(0, 0, 0, 0.7)';
    wheelDebugPanel.style.display = 'grid';
    wheelDebugPanel.style.gridGap = '10px';
    wheelDebugPanel.style.gridTemplateAreas = `
    "front-left front-right"
    "rear-left rear-right"
    `;
    frontLeftWheelInfoContainer.style.gridArea = 'front-left';
    frontLeftWheelInfoContainer.style.width = '180px';
    frontRightWheelInfoContainer.style.gridArea = 'front-right';
    frontRightWheelInfoContainer.style.width = '180px';
    rearLeftWheelInfoContainer.style.gridArea = 'rear-left';
    rearLeftWheelInfoContainer.style.width = '180px';
    rearRightWheelInfoContainer.style.gridArea = 'rear-right';
    rearRightWheelInfoContainer.style.width = '180px';

    wheelDebugPanel.appendChild(frontLeftWheelInfoContainer);
    wheelDebugPanel.appendChild(frontRightWheelInfoContainer);
    wheelDebugPanel.appendChild(rearLeftWheelInfoContainer);
    wheelDebugPanel.appendChild(rearRightWheelInfoContainer);
    document.body.appendChild(wheelDebugPanel);

    initialized = true;
}

function update(wheelInfos: RaycastVehicle['wheelInfos'], torqueDistribution: number[]) {
    if (!initialized) {
        init();
    }

    for (let i = 0; i < 4; i++) {
        const wheelInfo = wheelInfos[i];
        wheelInfoContainerElements[i].innerText = `
            sliding: ${wheelInfo.sliding ? '*' : ''}
            contact: ${wheelInfo.isInContact ? '*' : ''}
            torque: ${round(torqueDistribution[i])}%
            steering: ${round(radToDeg(wheelInfo.steering))}°
        `;
    }
}

function radToDeg(rad: number) {
    return rad * 180 / Math.PI;
}
