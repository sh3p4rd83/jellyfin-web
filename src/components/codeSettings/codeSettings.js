import template from './codeSettings.template.html';
import globalize from '../../scripts/globalize';
import ServerConnections from '../ServerConnections';
import skinManager from '../../scripts/themeManager';
import { appHost } from '../apphost';
import layoutManager from '../layoutManager';
import loading from '../loading/loading';
import toast from '../toast/toast';

function loadForm(context, user, userSettings) {
    context.querySelector('#chkEnableSecureCode').checked = userSettings.secureCode();

    loading.hide();
}

function saveUser(context, user, userSettingsInstance, apiClient) {
    user.Configuration.DisplayMissingEpisodes = context.querySelector('.chkDisplayMissingEpisodes').checked;

    if (appHost.supports('displaylanguage')) {
        userSettingsInstance.language(context.querySelector('#selectLanguage').value);
    }

    if (user.Id === apiClient.getCurrentUserId()) {
        skinManager.setTheme(userSettingsInstance.theme());
    }

    layoutManager.setLayout(context.querySelector('.selectLayout').value);
    return apiClient.updateUserConfiguration(user.Id, user.Configuration);
}

function save(instance, context, userId, userSettings, apiClient, enableSaveConfirmation) {
    loading.show();

    apiClient.getUser(userId).then(user => {
        saveUser(context, user, userSettings, apiClient).then(() => {
            loading.hide();
            if (enableSaveConfirmation) {
                toast(globalize.translate('SettingsSaved'));
            }
            Events.trigger(instance, 'saved');
        }, () => {
            loading.hide();
        });
    });
}

function onSubmit(e) {
    const self = this;
    const apiClient = ServerConnections.getApiClient(self.options.serverId);
    const userId = self.options.userId;
    const userSettings = self.options.userSettings;

    userSettings.setUserInfo(userId, apiClient).then(() => {
        const enableSaveConfirmation = self.options.enableSaveConfirmation;
        save(self, self.options.element, userId, userSettings, apiClient, enableSaveConfirmation);
    });

    // Disable default form submission
    if (e) {
        e.preventDefault();
    }
    return false;
}

function embed(options, self) {
    options.element.innerHTML = globalize.translateHtml(template, 'core');
    options.element.querySelector('form').addEventListener('submit', onSubmit.bind(self));
    if (options.enableSaveButton) {
        options.element.querySelector('.btnSave').classList.remove('hide');
    }
    self.loadData(options.autoFocus);
}

class CodeSettings {
    constructor(options) {
        this.options = options;
        embed(options, this);
    }

    loadData(autoFocus) {
        const self = this;
        const apiClient = ServerConnections.getApiClient(self.options.serverId);
        const userId = self.options.userId;
        const userSettings = self.options.userSettings;

        userSettings.setUserInfo(userId, apiClient).then(() => {
            loadForm(self.options.element, userSettings.getUser(), userSettings);
            if (autoFocus) {
                self.autoFocus();
            }
        });
    }
}

export default CodeSettings;
