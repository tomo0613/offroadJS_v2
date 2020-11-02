import { Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Object3D } from 'three';

export function setMaterials(wheel: Object3D, chassis: Object3D) {
    const baseMaterial = new MeshLambertMaterial({ color: 0x777777 });
    const fenderMaterial = new MeshBasicMaterial({ color: 0x050505 });
    const grillMaterial = new MeshBasicMaterial({ color: 0x222222 });
    const chromeMaterial = new MeshPhongMaterial({ color: 0xCCCCCC });
    const glassMaterial = new MeshPhongMaterial({ color: 0xACCCD7 });
    const tailLightMaterial = new MeshPhongMaterial({ color: 0x550000 });
    const headLightMaterial = new MeshPhongMaterial({ color: 0xFFFFBB });

    const wheelMaterial = new MeshBasicMaterial();
    wheelMaterial.alphaTest = 0.5;
    wheelMaterial.skinning = true;

    wheel.traverse((childMesh: Mesh) => {
        if (childMesh.material) {
            wheelMaterial.map = (childMesh.material as MeshBasicMaterial).map;
            childMesh.material = wheelMaterial;
            childMesh.material.needsUpdate = true;
        }
    });

    chassis.traverse((childMesh: Mesh) => {
        if (childMesh.material) {
            childMesh.material = getChassisMaterialByPartName(childMesh.name);
        }
    });

    function getChassisMaterialByPartName(partName: string) {
        switch (partName) {
            case 'front_bumper':
            case 'rear_bumper':
            case 'front_fender':
            case 'rear_fender':
                return fenderMaterial;
            case 'grill':
                return grillMaterial;
            case 'brushGuard':
                return chromeMaterial;
            case 'glass':
                return glassMaterial;
            case 'tail_lights':
                return tailLightMaterial;
            case 'head_lights':
                return headLightMaterial;
            default:
                return baseMaterial;
        }
    }
}
