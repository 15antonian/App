import Button from '@components/Button';
import TestToolRow from '@components/TestToolRow';
import useLocalize from '@hooks/useLocalize';
import softKillApp from '@libs/softKillApp';

export default function SoftKillTestToolRow() {
    const {translate} = useLocalize();

    return (
        <TestToolRow title={translate('initialSettingsPage.troubleshoot.softKillTheApp')}>
            <Button
                small
                text={translate('initialSettingsPage.troubleshoot.kill')}
                onPress={softKillApp}
            />
        </TestToolRow>
    );
}
