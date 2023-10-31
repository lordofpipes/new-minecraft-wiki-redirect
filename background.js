async function hasPermissions() {
    return await browser.permissions.contains({
        origins: [
            "*://minecraftwiki.net/*",
            "*://minecraft.gamepedia.com/*",
            "*://minecraft.fandom.com/*"
        ]
    });
}

async function setupPermissions() {
    let createData = {
        url: "settings.html",
    };
    let creating = browser.tabs.create(createData);
}

browser.runtime.onInstalled.addListener(async (event) => {
    // disable the blurb in the preferences page if the user updated from an older version that did not have it
    if (event.reason === "update" && event.previousVersion === "1.0.0" || event.previousVersion === "1.1.0")
        await browser.storage.local.set({projectPromos: false});

    if (!await hasPermissions())
        await setupPermissions();
});

async function getAllTabsWithHostPermissions() {
    const tabs = await browser.tabs.query({});

    const selectedTabs = [];

    for (const tab of tabs) {
        try {
            if (tab.url && await browser.permissions.contains({ origins: [tab.url] })) {
                selectedTabs.push(tab);
            }
        } catch {
            // ignore special tabs like about:blank
        }
    }

    return selectedTabs;
}

async function configureDisabledStatus(disabled) {
    browser.action.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
    browser.action.setBadgeText({text: disabled ? 'X' : ''});
    browser.declarativeNetRequest.updateEnabledRulesets(disabled ? {
        disableRulesetIds: ["minecraft-wiki-redirect"]
    } : {
        enableRulesetIds: ["minecraft-wiki-redirect"]
    });
    browser.storage.local.set({disabled: disabled});

    // if the user enables it, refresh all of their Fandom Minecraft Wiki tabs
    if (!disabled) {
        const tabs = await getAllTabsWithHostPermissions();
        tabs.forEach(tab => browser.tabs.reload(tab.id));
    }
}

browser.runtime.onMessage.addListener(async (message) => {
    if (message.action === "change-redirect-state") {
        await configureDisabledStatus(message.state);
    }
});

browser.action.onClicked.addListener(async () => {
    const oldState = (await browser.storage.local.get(["disabled"])).disabled;
    let newState = !oldState;
    if (!await hasPermissions()) {
        newState = false;
        await setupPermissions();
    }

    await configureDisabledStatus(newState);
    try {
        await browser.runtime.sendMessage({ action: "change-redirect-state", state: !newState });
    } catch (err) {
        // preference page is not open
    }

});

(async () => {
    configureDisabledStatus((await browser.storage.local.get(["disabled"])).disabled || false);
})();
