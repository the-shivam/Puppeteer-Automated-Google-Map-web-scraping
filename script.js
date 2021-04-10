const fs = require('fs');
const pup = require("puppeteer");
let pin = process.argv[2];
let search1 = process.argv[3];
let finalData = [];
let count = 0;
if ((pin.toString()).length != 6) {
    console.log("Wrong PIN!! Enter a valid PIN number");
    return;
}
async function main() {
    let browser = await pup.launch({
        headless: false,
        defaultViewport: false,
        args: ["--start-maximized"]
    });
    let pages = await browser.pages();
    let tab = pages[0];
    await tab.goto("https://www.google.co.in/maps");
    await tab.type("#searchboxinput", pin);
    await tab.click("#searchbox-searchbutton", { waitUntil: 'load', timeout: 0 });
    await tab.waitForSelector(".section-hero-header-title-description-container", { visible: true });
    await delay(2000);
    await tab.click("#gs_taif50", { waitUntil: 'load', timeout: 0 });
    await tab.keyboard.down("Control");
    await tab.keyboard.press("A");
    await tab.keyboard.up("Control");
    await tab.type("#gs_taif50", search1 + " near me");
    await tab.click("#searchbox-searchbutton", { waitUntil: 'load', timeout: 0 });
    await tab.waitForSelector(".place-result-container-place-link", { visible: true });
    await tab.click("#searchbox", { waitUntil: 'load', timeout: 0 });
    for (let i = 1; i <= 25; i++) {
        await tab.keyboard.press("Tab");
        await tab.keyboard.press("ArrowDown");
        await delay(500);
    }
    let hrefs = await tab.$$(".place-result-container-place-link");
    let links = [];
    for (let i of hrefs) {
        links.push(await tab.evaluate(function (ele) {
            return ele.getAttribute("href");
        }, i)
        );
    }

    for (let j = 0; j < 10; j++) {
        let subans = {};
        await tab.goto(links[j], { waitUntil: 'load', timeout: 0 });
        await tab.waitForSelector(".section-hero-header-title-title.gm2-headline-5", { visible: true });
        let elename = await tab.$$(".section-hero-header-title-title.gm2-headline-5");
        subans["Name"] = await (await elename[0].getProperty('textContent')).jsonValue();
        let elerating = await tab.$(".section-star-display");
        subans["Rating"] = await (await elerating.getProperty('textContent')).jsonValue();
        let elemadd = await tab.$$(".ugiz4pqJLAG__primary-text.gm2-body-2");
        subans["Address"] = await (await elemadd[0].getProperty('textContent')).jsonValue();
        if (elemadd.length > 4) {
            let txtweb = await (await elemadd[1].getProperty('textContent')).jsonValue();
            subans["Website"] = txtweb;
            let txt = await (await elemadd[2].getProperty('textContent')).jsonValue();
            subans["Mob"] = txt;
            let elemadd2 = await tab.$$(".cX2WmPgCkHi__section-info-text");
            subans["Timing"] = await (await elemadd2[1].getProperty('textContent')).jsonValue();
        }
        else {
            let txt = await (await elemadd[1].getProperty('textContent')).jsonValue();
            if (txt.charAt(0) == "O") {
                subans["Timing"] = txt;
            }
            else if (Number.isInteger(txt)) {
                subans["Mob"] = txt;
            }
        }
        tab.click(".gm2-button-alt.jqnFjrOWMVU__button-blue");
        await tab.waitForSelector(".section-review-text", { visible: true });
        let elereview = await tab.$$(".section-review-text");
        let review = [];
        let counter = 0;
        for (let i = 0; i < elereview.length; i++) {
            if (counter == 5) {
                break;
            }
            let txt = await (await elereview[i].getProperty('textContent')).jsonValue();
            if (txt.charAt(0) != "T") {
                counter++;
                review.push(txt);
            }
        }
        subans["Reviews"] = review;
        finalData.push(subans);
    }


    fs.writeFileSync("finalData.json", JSON.stringify(finalData));
    console.log(finalData);
    browser.close();
}

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}


main();