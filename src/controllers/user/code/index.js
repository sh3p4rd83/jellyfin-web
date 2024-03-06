import CodeSettings from '../../../components/codeSettings/codeSettings';
import * as userSettings from '../../../scripts/settings/userSettings';
import autoFocuser from '../../../components/autoFocuser';

const UserSettings = userSettings.UserSettings;

export default function (view, params) {
    let settingsInstance;

    const userId = params.userId || ApiClient.getCurrentUserId();
    const currentSettings = userId === ApiClient.getCurrentUserId() ? userSettings : new UserSettings();

    view.addEventListener('viewshow', function () {
        if (settingsInstance) {
            settingsInstance.loadData();
        } else {
            settingsInstance = new CodeSettings({
                serverId: ApiClient.serverId(),
                userId: userId,
                element: view.querySelector('.secureCodeSettingsContainer'),
                userSettings: currentSettings,
                enableSaveButton: true,
                enableSaveConfirmation: true,
                autoFocus: autoFocuser.isEnabled()
            });
        }
    });

    view.addEventListener('viewdestroy', function () {
        if (settingsInstance) {
            settingsInstance.destroy();
            settingsInstance = null;
        }
    });
}
