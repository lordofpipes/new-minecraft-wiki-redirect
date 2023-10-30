const PERMISSIONS = {
        origins: [
        "*://minecraftwiki.net/*",
        "*://minecraft.gamepedia.com/*",
        "*://minecraft.fandom.com/*"
    ]
};
const PERMS_DECLINED_MESSAGE = "Permission request was declined.\nPlease try again.";

const permissionRequestButtons = document.getElementsByClassName("permissions-request");

for (const elem of permissionRequestButtons) {
    elem.addEventListener("click", permissionsRequest);
}

async function permissionsRequest(event) {
    event.stopPropagation();
    const result = await browser.permissions.request(PERMISSIONS);

    if (result) {
        document.body.classList.add("permissions-granted");
    } else {
        window.alert(PERMS_DECLINED_MESSAGE);
    }
}

document.getElementById("uninstall").addEventListener("click", () => {
    browser.management.uninstallSelf({ showConfirmDialog: true });
});

const redirectToggle = document.querySelector("input[name='redirect']");

redirectToggle.addEventListener("change", () => {
    browser.runtime.sendMessage({ action: "change-redirect-state", state: !redirectToggle.checked });
});

browser.runtime.onMessage.addListener((message) => {
    if (message.action === "change-redirect-state") {
        redirectToggle.checked = message.state;
    }
});

async function setupSettingsUI() {
    const hasPermissions = await browser.permissions.contains(PERMISSIONS);

    if (hasPermissions) {
        document.body.classList.add("permissions-granted");
    } else {
        document.body.classList.remove("permissions-granted");
    }
    const redirectEnabled = !(await browser.storage.local.get(["disabled"])).disabled

    redirectToggle.checked = redirectEnabled;
}

const projectsPromos = document.getElementById("project-promos");
const projectsPromosToggle = document.querySelector("input[name='project-promos']");

async function setProjectsPromoStatus(status) {
    projectsPromosToggle.checked = status;
    projectsPromos.style.display = status ? "block" : "none";
    await browser.storage.local.set({ projectPromos: status })
}

projectsPromosToggle.addEventListener("change", async () => {
    await setProjectsPromoStatus(projectsPromosToggle.checked);
});

async function setupPromosToggle() {
    let projectsEnabled = (await browser.storage.local.get(["projectPromos"])).projectPromos;
    if (projectsEnabled == null) projectsEnabled = true;

    await setProjectsPromoStatus(projectsEnabled);
}

setupSettingsUI();
setupPromosToggle();
