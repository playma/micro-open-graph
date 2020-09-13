const { parse } = require('url')
const { send } = require('micro')
const got = require('got');
const cache = require('memory-cache')

const metascraper = require('metascraper').load([
  require('metascraper-author')(),
  require('metascraper-date')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-logo')(),
  require('metascraper-clearbit-logo')(),
  require('metascraper-logo-favicon')(),
  require('metascraper-publisher')(),
  require('metascraper-title')(),
	require('metascraper-url')(),
	require('metascraper-logo-favicon')(),
	require('metascraper-amazon')(),
	require('metascraper-youtube')(),
	require('metascraper-soundcloud')(),
	require('metascraper-video-provider')()
])


const TWENTY_FOUR_HOURS = 86400000

function format_result(result, format) {
  switch (format) {
    case 'json':
      return JSON.stringify({
        'url': result['url'],
        'title': result['title'],
        'description': result['description'],
        'image': result['image']
      });
    case 'html':
    default:
      return `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta property="og:url" content="${result['url']}">
            <meta property="og:title" content="${result['title']}">
            <meta property="og:description" content="${result['description']}">
            <meta property="og:image" content="${result['image']}">
          </head>
        </html>`
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')

  let { query: { url, format } } = parse(req.url, true)
  if (!url) return send(res, 401, { message: 'Please supply an URL to be scraped in the url query parameter.' })

  url = encodeURI(url);
  const cachedResult = cache.get(url)
  if (cachedResult && cachedResult['image']) {
    return send(res, 200, format_result(cachedResult, format));
  }

  let statusCode, data
  try {
    const { body: html } = await got(url);
    data = await metascraper({ url, html })
    statusCode = 200
  } catch (err) {
    console.log(err)
    statusCode = 401
    data = { message: `Scraping the open graph data from "${url}" failed.`, suggestion: 'Make sure your URL is correct and the webpage has open graph data, meta tags or twitter card data.' }
  }

  send(res, statusCode, format_result(data, format))
  // Cache results for 24 hours
  cache.put(url, data, TWENTY_FOUR_HOURS)
}
