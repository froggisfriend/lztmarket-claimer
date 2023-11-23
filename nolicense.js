
const child_process = require("child_process")
const crypto = require("crypto")
const fs = require("fs")
const os = require('os')
const process = require("process")
const fetch = require('node-fetch')
if (!fs.existsSync("config.json")) {
    fs.writeFileSync("config.json", JSON.stringify({
        host_name: "lzt.market",
        api_key: "CHANGE_ME",
        platform: "uplay",
        min_price: 0,
        max_price: 3,
        order: "cheapest",
        email_access: "autoreg",
        webhook: {
            enabled: false,
            username: "hacker",
            url: "WEBHOOK_LINK"
        },
        custom_search: {
            r6_level_min: 50,
            r6_level_max: 1000,
        },
        idealslife:
        {
            auto_add: true,
            owner: "your_tag#0001"
        }

    }, null, "    "))
}
if (!fs.existsSync("accounts.txt")) {
    fs.writeFileSync("accounts.txt", "");
}

let config = JSON.parse(fs.readFileSync("config.json").toString());
let order = "";
switch (config.order) {
    case "cheapest":
        order = "price_to_up"
        break;
    case "expensive":
        order = "price_to_down";
        break;
}
if (config.api_key == "CHANGE_ME") {
    console.log("api key is still default go change it")
    process.exit();
}
if (config.webhook.enabled && config.webhook.url == "WEBHOOK_LINK") {
    console.log("webhook url is still default go change it")
    process.exit();

}

var boughtaccounts = [];
function isSuitableAccount(account) {
    let price = account.price;
    let state = account.item_state;
    let title = account.title;
    let description = account.description;
    let seller = account.seller;
    let seller_username = seller.username;
    let seller_id = seller.user_id;
    /* known ham MARKETS */
    if (seller_id == 7152343 || seller_id == 6051432 || seller_id == 4817764 || seller_id == 5266654 || seller_id == 5101948 || seller_id == 5744173 || seller_id == 7213518 || seller_id == 5997047 || seller_id == 6800587 || seller_id == 5007669 || seller_id == 6193310 || seller_id == 4903063) {
        return false;
    }
    console.log(title);

    if (title.search("ban") != -1 || description.search("ban") != -1 || title.search("запрет") != -1 || description.search("запрет") != -1) {
        console.log("skipping over possible banned account %d\n", account.item_id);
        return false;
    }
    if (boughtaccounts[account.item_id] == true) {
        return false;
    }
    return state == "active";
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function webhook_post(options) {
    /*
     node doesnt let me do ``` inside of a string interpolation so i have to use hex (what the black) 
    */
    let data = JSON.stringify({
        username: config.webhook.username,
        content: `Frog2Fast ;)\n||\x60\x60\x60${options.text}\x60\x60\x60||`
    });
    await fetch(config.webhook.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data,
    })
}
function csgo_parse_rank(id) {
    switch (id) {
        case 1:
            return "silver 1";
            break;
        case 2:
            return "silver 2";
            break;
        case 3:
            return "silver 3";
            break;
        case 4:
            return "silver 4";
            break;
        case 5:
            return "silver 5";
            break;
        case 6:
            return "silver 6";
            break;
        case 7:
            return "gold nova 1";
            break;
        case 8:
            return "gold nova 2";
            break;
        case 9:
            return "gold nova 3";
            break;
        case 10:
            return "gold nova 4";
            break;
        case 11:
            return "master guardian 1";
            break;
        case 13:
            return "master guardian 2";
            break;
        case 14:
            return "distinguished master guardian";
            break;
        case 15:
            return "legendary eagle";
            break;
        case 16:
            return "legendary eagle master";
            break;
        case 17:
            return "supreme master first class";
            break;
        case 18:
            return "global elite";
            break;
        default:
            return `unknown rank ${id}`;
            break;
    }
}
function get_kyo_username(input) {
    let x = input.split("\n");
    for (var i = 0; i < x.length; i++) {
        let line = x[i];
        if (line.search(`playername`) != -1) {
            line = line.replace(`<div class="playername"><b>`, "");
            line = line.replace(`</b></div>`, "");
            return line;
        }
    }
}
/* aids i could not find a function in 30 seconds that did this lol */
function getTime() {
    let date = new Date(Date.now());
    let o = "";
    o += date.toLocaleDateString();
    o += " ";
    o += date.toLocaleTimeString();
    return o;
}
async function getubisoftinfo(creds) {
    let b = await fetch("https://public-ubiservices.ubi.com/v3/profiles/sessions", {
        "headers": {
            "Content-Type": "application/json",
            "Ubi-RequestedPlatformType": "uplay",
            "Ubi-AppId": "f35adcb5-1911-440c-b1c9-48fdc1701c68",
            "Authorization": `Basic ${Buffer.from(creds).toString("base64")}`
        },
        "referrer": "https://connect.ubisoft.com/",
        "body": "{\"rememberMe\":true}",
        "method": "POST",
        "mode": "cors"
    });
    let json = await b.json();

    return json
}

async function GKStatus(info) {
    let k = await fetch(`https://public-ubiservices.ubi.com/v3/users/${info.userId}/initialProfiles`, {
        "headers": {
            "Authorization": `Ubi_v1 t=${info.ticket}`,
            "Ubi-AppId": "c5393f10-7ac7-4b4f-90fa-21f8f3451a04",
            "Ubi-SessionId": info.sessionId,
        },
    });
    let json = await k.json();
    let profiles = json["profiles"]
    var GKStatus = "Can Add GK"
    if (profiles.length == 0) {
        GKStatus = "Can Add GK";
    } else {
        for (var i = 0; i < profiles.length; i++) {
            let profile = profiles[i];
            if (profile.platformType == "xbl") {
                GKStatus = "Can Not Add GK";
            }
        }
    }
    return GKStatus
}
async function buyAccount(account) {
    if (boughtaccounts[account.id]) {
        console.log(`Already purchased this account ${account.id}`)
        return;
    }
    let response;
    try {
        response = await fetch(`https://api.${config.host_name}/${account.id}/fast-buy?price=${account.price}&buy_without_validation=1`, {
            headers: {
                "Authorization": `Bearer ${config.api_key}`
            }
        });
    } catch { }
    if (response == null) {
        console.log("something fucked up\n");
        return;
    }
    boughtaccounts[account.id] = true;
    var item;
    try { item = await response.json() } catch { }
    if (item != null) {
        let log = "";
        let dont_drop_check_in_dead_grandma_boa = false;
        try {
            let acc = item.item;
            log += `account login: ${acc.loginData.login}:${acc.loginData.password}`;
            if (acc.emailLoginData != null) {
                log += ` | mail: ${acc.emailLoginData.login}:${acc.emailLoginData.password}`;
            }
            if (acc.uplay_account_r6_level != null) {
                log += ` | r6 level ${acc.uplay_account_r6_level}`;
            }
            if (config.platform == "uplay") {
                let info = await getubisoftinfo(`${acc.loginData.login}:${acc.loginData.password}`)
                log += ` | username: ${info.nameOnPlatform}`
                log += ` | ${await GKStatus(info)}`;
            }
            if (acc.steam_csgo_win_count != null) {
                log += ` | csgo comp win count ${acc.steam_csgo_win_count}`;
            }
            if (acc.steam_csgo_wingman_rank_id != null) {
                log += ` | csgo wingman rank ${csgo_parse_rank(acc.steam_csgo_wingman_rank_id)}`;
            }
            if (acc.account_csgo_rank_id != null) {
                log += ` | csgo comp rank ${csgo_parse_rank(acc.account_csgo_rank_id)}`;
            }
        } catch (nigger) {
            dont_drop_check_in_dead_grandma_boa = true;
        }
        if (!dont_drop_check_in_dead_grandma_boa) {
            let acc = item.item;
            if (config.idealslife.enabled && acc.uplay_account_r6_level != null) {
                let discord = encodeURIComponent(config.idealslife.owner);
                let email = encodeURIComponent(acc.loginData.login);
                let password = encodeURIComponent(acc.loginData.password);
                let body = `fowner=${discord}&femail=${email}&fpass=${password}`;
                let res = await fetch("https://ideals.life/add", {
                    "method": "POST",
                    "headers": {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    "body": body
                })
                let text = await res.text();
                log += ` | https://ideals.life/profile/uplay/${get_kyo_username(text)}`;
            }
            log += ` | cost: $${account.price}`;
            log += ` | bought at: ${getTime()}`;
            console.log(`bought account | ${log}\n`);
            fs.appendFileSync("accounts.txt", `${log}\n`);
            if (config.webhook.enabled) {
                console.log("post...")
                await webhook_post({
                    text: log
                })
            }

        }
    }
}
function getExtraOptions() {
    let built = "";
    for (let index in config.custom_search) {
        let value = config.custom_search[index];
        built += `&${index}=${value}`;
    }
    return built;
}
let searchCount = 0;
async function mainThread() {
    while (true) {
        await sleep(6000);
        searchCount += 1;
        let force_cache = false;
        /*
        if (searchCount % 4 == 3) {
            force_cache = true;
        }
        */
        let starttime = Date.now();
        var response;

        try {
            if (force_cache) {
                response = await fetch(`https://api.${config.host_name}/${config.platform}?currency=usd&t=${Date.now().toString()}&pmin=${config.min_price}&pmax=${config.max_price}&order_by=${order}&email_type[]=${config.email_access}${getExtraOptions()}`, {
                    headers: {
                        "Authorization": `Bearer ${config.api_key}`
                    }
                });
            } else {
                response = await fetch(`https://api.${config.host_name}/${config.platform}?currency=usd&pmin=${config.min_price}&pmax=${config.max_price}&order_by=${order}&email_type[]=${config.email_access}${getExtraOptions()}`, {
                    headers: {
                        "Authorization": `Bearer ${config.api_key}`
                    }
                });

            }
        } catch (jews) {
            console.log(`ran into a error while trying search (ratelimit?)${searchCount}\n`)
            continue;
        }
        console.log(`request took ${Date.now() - starttime} ms.`)
        var json;
        try {
            json = await response.json();
            if (json.error != null) {
                console.log(json.error_description);
                process.exit();
                break;
            }

        } catch (nigger) {

        }
        if (json != null && response != null) {
            if (json.items != null) {
                let suitable = [];
                json.items.forEach(account => {
                    if (isSuitableAccount(account)) {
                        let acc = { title: account.title, description: account.description, id: account.item_id, price: account.price, seller_name: account.seller.username, seller_id: account.seller.user_id };
                        suitable.push(acc);
                    }
                });
                if (suitable.length == 0) {
                    console.log(`no accounts were found. ${searchCount}\n`)
                } else {
                    console.log(`found ${suitable.length} accounts for sale, autobuying.${searchCount}\n`);

                    for (var i = 0; i < suitable.length; i++) {
                        await sleep(3000);
                        console.log(`buying ${suitable[i].id} | $${suitable[i].price} | ${suitable[i].title}`)
                        buyAccount(suitable[i]);
                    }
                }
            }
        }
    }
}
async function main() {
    mainThread();
}
main();
