const puppeteer = require('puppeteer');
const jsonfile = require('jsonfile')
const fs = require('fs')
function waitFor2FA(page) {
   return new Promise(function (resolve, reject) {
      (function waitForURL() {
         if (page.url() === 'https://takeout.google.com/') {
            console.log("MET!")
            return resolve()
         }
         else {
            console.log(page.url())
            setTimeout(waitForURL, 3000);
         }
      })();
   });
}

(async () => {
   const browser = await puppeteer.launch({ headless: false })
   const page = await browser.newPage()
   const cookiesFilePath = 'PATH_TO_COOKIE'
   const previousSession = fs.existsSync(cookiesFilePath)
   if (previousSession) {
      // If file exist load the cookies
      const cookiesArr = require(`${cookiesFilePath}`)
      if (cookiesArr.length !== 0) {
         for (let cookie of cookiesArr) {
            // await page.setCookie(cookie)
         }
         console.log('Session has been loaded in the browser')
      }
   }
   await page.setViewport({ width: 1280, height: 800 })
   await page.goto('https://takeout.google.com/')

   await page.waitForSelector('input[type="email"]')
   await page.type('input[type="email"]', "EMAIL")
   await page.click('#identifierNext')

   await page.waitForSelector('input[type="password"]', { visible: true })
   await page.type('input[type="password"]', "PASSWORD")
   await page.click('#passwordNext')

   await waitFor2FA(page)

   await page.waitForSelector('button[aria-label="Deselect all"]')
   await page.click('button[aria-label="Deselect all"]')

   // We need location history only.
   await page.evaluate(() => {
      // Add more for other data
      document.querySelector('input[type="checkbox"][name="Location History"]').click()
      document.querySelector('button[aria-label="Next step"]').click()
   })
   await page.waitForSelector('button[jsname="DU7EXd"]', { visible: true })

   // Make archive
   await page.evaluate(() => {
      document.querySelector('button[jsname="DU7EXd"]').click()
   })
   await page.waitForNavigation({ timeout: 0 })
   await page.evaluate(() => {
      // Click the first download button i.e. the latest one (just archived)
      document.querySelector('.WpHeLc').click()
   })

   // Save Session Cookies
   const cookiesObject = await page.cookies()
   console.log(cookiesObject)
   // Write cookies to temp file to be used in other profile pages
   jsonfile.writeFile(cookiesFilePath, cookiesObject, { spaces: 2 },
      function (err) {
         if (err) {
            console.log('The file could not be written.', err)
         }
         console.log('Session has been successfully saved')
      })

})()
