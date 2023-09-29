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

function configureDisabledStatus(disabled) {
    browser.action.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
    browser.action.setBadgeText({text: disabled ? 'X' : ''});
    browser.declarativeNetRequest.updateEnabledRulesets(disabled ? {
        disableRulesetIds: ["minecraft-wiki-redirect"]
    } : {
        enableRulesetIds: ["minecraft-wiki-redirect"]
    });
    browser.storage.local.set({disabled: disabled});
}

browser.action.onClicked.addListener(async () => {
    if (!await hasPermissions()) {
        await setupPermissions();
        return;
    }
    const disabled = !(await browser.storage.local.get(["disabled"])).disabled;
    configureDisabledStatus(disabled);

    // if the user enables it, refresh all of their Fandom Minecraft Wiki tabs
    if (!disabled) {
        const tabs = await getAllTabsWithHostPermissions();
        tabs.forEach(tab => browser.tabs.reload(tab.id));
    }
});

(async function() {
    configureDisabledStatus((await browser.storage.local.get(["disabled"])).disabled || false);
})();
