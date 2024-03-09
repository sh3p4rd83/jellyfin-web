import template from './codeSettings.template.html';
import globalize from '../../scripts/globalize';
import ServerConnections from '../ServerConnections';
import focusManager from '../focusManager';
import loading from '../loading/loading';
import toast from '../toast/toast';
import dom from '../../scripts/dom';

let isSaved = false;

function loadForm(context, user, userSettings) {
    context.querySelector('#chkEnableSecureCode').checked = userSettings.haveSecureCode();
    context.querySelector('#txtSecureCode').value = userSettings.haveSecureCode() ? userSettings.secureCode() : '';

    isSaved = userSettings.haveSecureCode();

    if (!context.querySelector('#chkEnableSecureCode').checked) {
        context.querySelector('#txtSecureCode').setAttribute('disabled', 'disabled');
    }

    if (userSettings.secureCode() !== '') {
        context.querySelector('#txtSecureCode').setAttribute('disabled', 'disabled');
    }

    if (!isSaved) {
        context.querySelector('#txtDeactivateSecureCode').setAttribute('disabled', 'disabled');
        context.querySelector('#deactivateSecureCode').setAttribute('disabled', 'disabled');
    }

    onCheckboxChange({
        target: context.querySelector('#txtSecureCode')
    });

    loading.hide();
}

function onCheckboxChange(e) {
    const view = dom.parentWithClass(e.target, 'secureCodeSettings');

    if (view.querySelector('#chkEnableSecureCode').checked ) {
        if (view.querySelector('#txtSecureCode').value === '') {
            view.querySelector('#txtSecureCode').removeAttribute('disabled');
        }
        if (isSaved) {
            view.querySelector('#chkEnableSecureCode').setAttribute('disabled', 'disabled');
        }
    } else {
        view.querySelector('#txtSecureCode').setAttribute('disabled', 'disabled');
        view.querySelector('#chkEnableSecureCode').removeAttribute('disabled');
    }
}

function onCheckDeactivation() {
    const view = dom.parentWithClass(this, 'secureCodeSettings');
    const self = this;
    const userSettingsInstance = self.userSettings;

    if (view.querySelector('#txtDeactivateSecureCode').value !== userSettingsInstance.secureCode()) {
        toast(globalize.translate('secureCodeDoesNotMatch'));
    } else {
        isSaved = false;
        view.querySelector('#chkEnableSecureCode').removeAttribute('disabled');
        view.querySelector('#txtSecureCode').setAttribute('disabled', 'disabled');
        view.querySelector('#txtSecureCode').value = '';
        view.querySelector('#chkEnableSecureCode').checked = false;
        view.querySelector('#txtDeactivateSecureCode').value = '';
    }
}

function saveUser(context, user, userSettingsInstance, apiClient) {
    const isSecureCodeEnabled = context.querySelector('#chkEnableSecureCode').checked;
    userSettingsInstance.haveSecureCode(isSecureCodeEnabled);

    if (isSecureCodeEnabled) {
        userSettingsInstance.secureCode((context.querySelector('#txtSecureCode').value).replace(/\W+/g, ''));
    }

    isSaved = isSecureCodeEnabled;

    return apiClient.updateUserConfiguration(user.Id, user.Configuration);
}

function correctPassword(context) {
    const secureCode = context.querySelector('#txtSecureCode').value;
    return secureCode.length >= 4 && secureCode.search(/\W+/g) === -1;
}

function save(instance, context, userId, userSettings, apiClient, enableSaveConfirmation) {
    loading.show();
    if (context.querySelector('#chkEnableSecureCode').checked && !correctPassword(context)) {
        toast(globalize.translate('incorrectPassword'));
        loading.hide();
    } else {
        apiClient.getUser(userId).then(user => {
            saveUser(context, user, userSettings, apiClient).then(() => {
                loading.hide();
                if (enableSaveConfirmation) {
                    toast(globalize.translate('SettingsSaved'));
                }
                if (context.querySelector('#chkEnableSecureCode').checked) {
                    context.querySelector('#chkEnableSecureCode').setAttribute('disabled', 'disabled');
                    context.querySelector('#txtSecureCode').setAttribute('disabled', 'disabled');
                    context.querySelector('#txtDeactivateSecureCode').removeAttribute('disabled');
                    context.querySelector('#deactivateSecureCode').removeAttribute('disabled');
                } else {
                    context.querySelector('#txtDeactivateSecureCode').setAttribute('disabled', 'disabled');
                    context.querySelector('#deactivateSecureCode').setAttribute('disabled', 'disabled');
                }
                Events.trigger(instance, 'saved');
            }, () => {
                loading.hide();
            });
        });
    }
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
    options.element.classList.add('secureCodeSettings');
    options.element.innerHTML = globalize.translateHtml(template, 'core');
    options.element.querySelector('#deactivateSecureCode').userSettings = options.userSettings;

    options.element.querySelector('#chkEnableSecureCode').addEventListener('change', onCheckboxChange);
    options.element.querySelector('#deactivateSecureCode').addEventListener('click', onCheckDeactivation);

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
        const context = self.options.element;

        return apiClient.getUser(userId).then(user => {
            return userSettings.setUserInfo(userId, apiClient).then(() => {
                self.dataLoaded = true;
                loadForm(context, user, userSettings);
                if (autoFocus) {
                    focusManager.autoFocus(context);
                }
            });
        });
    }
}

export default CodeSettings;
