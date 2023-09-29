document.getElementById("enable-permissions").addEventListener("click", async () => {
    const result = await browser.permissions.request({
        origins: [
            "*://minecraftwiki.net/*",
            "*://minecraft.gamepedia.com/*",
            "*://minecraft.fandom.com/*"
        ]
    });

    if (!result) {
        window.alert("Permission request was declined.\nPlease try again.");
    }
});
document.getElementById("uninstall").addEventListener("click", () => {
    browser.management.uninstallSelf({
        showConfirmDialog: true,
    });
});
