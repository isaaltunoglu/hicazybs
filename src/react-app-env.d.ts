/// <reference types="react-scripts" />

// Fix: react-icons v5 IconType returns ReactNode instead of ReactElement,
// which is incompatible with Chakra UI v2's As/icon prop types.
// This override makes IconType compatible by augmenting react-icons' module.
declare module 'react-icons/lib' {
    import { ComponentType, SVGAttributes } from 'react';
    export interface IconBaseProps extends SVGAttributes<SVGElement> {
        children?: React.ReactNode;
        size?: string | number;
        color?: string;
        title?: string;
    }
    export type IconType = ComponentType<IconBaseProps>;
}
