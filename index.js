import fetch from 'node-fetch';
import cron from 'node-cron';
import {
    createClient
} from 'redis';


import puppeteer from 'puppeteer';


cron.schedule('* * * * *', () => {
    openPuppeteer();
});

async function notify(rents) {

    for (var key in rents) {
        var rent = rents[key];
        const params = new URLSearchParams();
        params.append('message', rent.title +
            "\n" + rent.price + "\n" +
            rent.section_name + "\n" +
            rent.street_name + "\n" +
            "https://rent.591.com.tw/home/" + rent.post_id);
        if (rent.photo_list && rent.photo_list[0]) {
            params.append('imageFullsize', rent.photo_list[0])
            params.append('imageThumbnail', rent.photo_list[0])
        }

        const response = await fetch('https://notify-api.line.me/api/notify', {
            method: 'POST',
            body: params,
            headers: {
                'Authorization': 'Bearer kO3AdaV1d5Xq1GkRuu6bcDNjGsg1kNpBB4ymkN2zrAY'
            }
        });
        const data = await response.json();
    }



}
// notify()


async function getRentData(csrfToken, urlJumpIp, urlJumpIpByTxt, phpsessid, t591Token, xsrfToken, _591NewsSession) {

    var header = {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Google Chrome\";v=\"98\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-csrf-token": csrfToken,
        // "x-csrf-token": "5EfgitCl5snpMN3o0O5xhRWKXTevLBL29cXvJ6wy",
        "x-requested-with": "XMLHttpRequest",
        "cookie": "PHPSESSID=" + phpsessid + "; urlJumpIp=" + urlJumpIp + "; urlJumpIpByTxt=" + urlJumpIpByTxt + "; T591_TOKEN=" + t591Token + "; new_rent_list_kind_test=1; newUI=1; _ga=GA1.3.404010469.1645688503; _gid=GA1.3.608010385.1645688503; _gat=1; _ga=GA1.4.404010469.1645688503; _gid=GA1.4.608010385.1645688503; _dc_gtm_UA-97423186-1=1; XSRF-TOKEN=" + xsrfToken + "; 591_new_session=" + _591NewsSession + "; tw591__privacy_agree=0",
        "Referer": "https://rent.591.com.tw/?rentprice=15000,24000&section=44,47&searchtype=1&shape=2&showMore=1&order=posttime&orderType=desc",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }

    const response = await fetch("https://rent.591.com.tw/home/search/rsList?is_format_data=1&is_new_list=1&type=1&region=3&section=47,44&searchtype=1&rentprice=15000,25000&shape=2&showMore=1&order=posttime&orderType=desc", {
        "headers": header,
        "body": null,
        "method": "GET"
    });
    // console.log(header);
    const data = await response.json();
    console.log("top count is :: " + data.data.topData.length);
    console.log("normal count is :: " + data.data.data.length);

    getNewestRent(data.data.topData, data.data.data, function (newestTopRents, newestNormalRents) {
        notify(newestTopRents.concat(newestNormalRents));
    })
}

async function getNewestRent(topRents, normalRents, next) {
    // console.log(topRents);
    const client = createClient();
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    var newestTopRents = [];
    var newestNormalRents = [];
    for (var key in topRents) {
        var rent = topRents[key];
        const value = await client.get(rent.post_id);
        if (!value) {
            await client.set(rent.post_id, true);
            newestTopRents.push(rent);
        }
    }
    for (var key in normalRents) {
        var rent = normalRents[key];
        const value = await client.get(rent.post_id);
        if (!value) {
            await client.set(rent.post_id, true);
            newestNormalRents.push(rent);
        }
    }
    console.log(newestTopRents);
    console.log(newestNormalRents);
    next(newestTopRents, newestNormalRents);
}

async function openPuppeteer() {

    const browser = await puppeteer.launch({
        args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    // const client = await page.target().createCDPSession();
    // const cookies = (await client.send('Network.getAllCookies')).cookies;
    // console.log(cookies)
    // page.on('request', request => {
    //     if (request.url().indexOf("search/rsList") > -1) {
    //         console.log("request url: ", request);
    //     }
    // })
    // page.on('response', response => {
    //     if (response.url().indexOf("search/rsList") > -1) {
    //         console.log("response url: ", response.url());
    //     }

    //     // do something here
    // });

    await page.goto('https://rent.591.com.tw/?region=3', {
        waitUntil: 'networkidle2'
    });
    const cookies = await page.cookies()
    var phpsessid = "";
    var xsrfToken = "";
    var t591Token = ""
    var urlJumpIp = "";
    var _591NewsSession = "";
    var urlJumpIpByTxt = "";
    for (var key in cookies) {
        var cookie = cookies[key];
        if (cookie.name == '591_new_session') {
            _591NewsSession = cookie.value;
        }
        if (cookie.name == 'PHPSESSID') {
            phpsessid = cookie.value;
        }
        if (cookie.name == 'T591_TOKEN') {
            t591Token = cookie.value;
        }
        if (cookie.name == 'XSRF-TOKEN') {
            xsrfToken = cookie.value;
        }
        if (cookie.name == 'urlJumpIp') {
            urlJumpIp = cookie.value;
        }
        if (cookie.name == 'urlJumpIpByTxt') {
            urlJumpIpByTxt = cookie.value;
        }
    }
    const csrfToken = await page.$eval("head > meta[name='csrf-token']", element => element.content);
    await browser.close();
    getRentData(csrfToken, urlJumpIp, urlJumpIpByTxt, phpsessid, t591Token, xsrfToken, _591NewsSession)

}