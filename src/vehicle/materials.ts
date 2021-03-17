import { Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Object3D } from 'three';

export function setMaterials(wheel: Object3D, chassis: Object3D) {
    const materials = {
        baseMaterial: new MeshLambertMaterial({ color: 0x777777 }),
        fenderMaterial: new MeshBasicMaterial({ color: 0x050505 }),
        grillMaterial: new MeshBasicMaterial({ color: 0x222222 }),
        chromeMaterial: new MeshPhongMaterial({ color: 0xCCCCCC }),
        glassMaterial: new MeshPhongMaterial({ color: 0xACCCD7 }),
        tailLightMaterial: new MeshPhongMaterial({ color: 0x550000 }),
        headLightMaterial: new MeshPhongMaterial({ color: 0xFFFFBB }),
        wheelMaterial: new MeshBasicMaterial({ alphaTest: 0.5, skinning: true }),
    };

    wheel.traverse((childMesh: Mesh) => {
        if (childMesh.material) {
            materials.wheelMaterial.map = (childMesh.material as MeshBasicMaterial).map;
            childMesh.material = materials.wheelMaterial;
            childMesh.material.needsUpdate = true;
        }
    });

    chassis.traverse((childMesh: Mesh) => {
        if (childMesh.material) {
            childMesh.material = getChassisMaterialByPartName(childMesh.name);
        }
    });

    return materials;

    function getChassisMaterialByPartName(partName: string) {
        switch (partName) {
            case 'front_bumper':
            case 'rear_bumper':
            case 'front_fender':
            case 'rear_fender':
                return materials.fenderMaterial;
            case 'grill':
                return materials.grillMaterial;
            case 'brushGuard':
                return materials.chromeMaterial;
            case 'glass':
                return materials.glassMaterial;
            case 'tail_lights':
                return materials.tailLightMaterial;
            case 'head_lights':
                return materials.headLightMaterial;
            default:
                return materials.baseMaterial;
        }
    }
}
