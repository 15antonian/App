import React from 'react';
import TopBar from '@components/Navigation/TopBar';
import type {SearchQueryJSON} from '@components/Search/types';
import useSearchPageTitle from '@hooks/useSearchPageTitle';

type SearchPageHeaderWideProps = {
    queryJSON: SearchQueryJSON;
};

function SearchPageHeaderWide({queryJSON}: SearchPageHeaderWideProps) {
    const title = useSearchPageTitle(queryJSON);

    return (
        <TopBar
            shouldShowLoadingBar={false}
            breadcrumbLabel={title}
            shouldDisplaySearch={false}
            shouldDisplayHelpButton
        />
    );
}

export default SearchPageHeaderWide;
