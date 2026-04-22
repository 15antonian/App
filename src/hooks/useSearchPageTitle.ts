import type {SearchQueryJSON} from '@components/Search/types';
import CONST from '@src/CONST';
import type {TranslationPaths} from '@src/languages/types';
import useLocalize from './useLocalize';
import useSearchTypeMenuSections from './useSearchTypeMenuSections';

/**
 * Returns the localized title for the Search page (used for both the header breadcrumb
 * and the browser document title) based on the active search type / sub-tab.
 * Defaults to "Spend" so the top-level `/search` tab reads as "Spend".
 */
function useSearchPageTitle(queryJSON: SearchQueryJSON | undefined): string {
    const {translate} = useLocalize();
    const {typeMenuSections, activeItemIndex} = useSearchTypeMenuSections(queryJSON);
    const selectedItem = typeMenuSections.flatMap((section) => section.menuItems).at(activeItemIndex);

    if (activeItemIndex >= 0 && selectedItem) {
        return translate(selectedItem.translationPath as TranslationPaths);
    }

    const type = queryJSON?.type;
    if (type === CONST.SEARCH.DATA_TYPES.TASK) {
        return translate('common.tasks');
    }
    if (type === CONST.SEARCH.DATA_TYPES.TRIP) {
        return translate('travel.trips');
    }
    if (type === CONST.SEARCH.DATA_TYPES.INVOICE) {
        return translate('workspace.common.invoices');
    }
    if (type === CONST.SEARCH.DATA_TYPES.CHAT) {
        return translate('common.chats');
    }
    return translate('common.spend');
}

export default useSearchPageTitle;
