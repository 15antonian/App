import lodashIsObject from 'lodash/isObject';
import type {ViewStyle} from 'react-native';
import type {TNode} from 'react-native-render-html';
import parseAttribute from './parseAttribute';

/**
 * Extract width, height, and style overrides from a tnode's HTML attributes.
 * Returns separate style objects for the node itself and its parent container.
 */
function parseStyles(tnode: TNode): {nodeStyles: ViewStyle; parentNodeStyles: ViewStyle} {
    const nodeStyles: ViewStyle = {};
    const parentNodeStyles: ViewStyle = {};

    const parsedHeight = parseAttribute(tnode.attributes.height);
    if (typeof parsedHeight === 'number') {
        nodeStyles.height = parsedHeight;
    }
    const parsedWidth = parseAttribute(tnode.attributes.width);
    if (typeof parsedWidth === 'number') {
        nodeStyles.width = parsedWidth;
    }

    const parsedStyle = parseAttribute(tnode.attributes.style);
    if (lodashIsObject(parsedStyle)) {
        if ('parent' in parsedStyle && lodashIsObject(parsedStyle.parent)) {
            Object.assign(parentNodeStyles, parsedStyle.parent);
        }
        if ('data' in parsedStyle && lodashIsObject(parsedStyle.data)) {
            Object.assign(nodeStyles, parsedStyle.data);
        }
    }

    // After all attribute merges, convert a numeric width+height pair into a responsive
    // aspect-ratio triple so the chart scales uniformly as the viewport narrows.
    // This mirrors styles.expenseViewImageSmall: maxWidth+maxHeight cap the intrinsic size
    // while aspectRatio drives height from whatever width the container resolves to.
    // Computing here (after style.data merge) ensures backend-provided style overrides
    // are reflected before the ratio is derived.
    const finalWidth = nodeStyles.width;
    const finalHeight = nodeStyles.height;
    if (typeof finalWidth === 'number' && typeof finalHeight === 'number' && finalHeight > 0) {
        nodeStyles.maxWidth = finalWidth;
        nodeStyles.maxHeight = finalHeight;
        nodeStyles.aspectRatio = finalWidth / finalHeight;
        nodeStyles.height = 'auto';
        delete nodeStyles.width;
    }

    return {nodeStyles, parentNodeStyles};
}

export default parseStyles;
