import feedparser
import urllib.parse


def lookup(geo):
    """Looks up articles for geo."""

    # check cache for geo
    if geo in lookup.cache:
        return lookup.cache[geo]

    # For australian data - google news requires name in form geo=castlemaine%2C%20vic rather than postcode.
    # print("LINK IS: " + "http://news.google.com.au/news/section?cf=all&pz=1&geo={}%2C%20australia&output=rss".format(urllib.parse.quote(geo, safe="%")))

    # get feed from Google
    feed = feedparser.parse("http://news.google.com.au/news/section?cf=all&pz=1&geo={}%2C%20australia&output=rss".format(urllib.parse.quote(geo, safe="%")))

    # if no items in feed, get feed from Onion
    if not feed["items"]:
        feed = feedparser.parse("http://www.theonion.com/feeds/rss")

    # cache results
    lookup.cache[geo] = [{"link": item["link"], "title": item["title"]} for item in feed["items"]]

    # return results
    return lookup.cache[geo]

# initialize cache
lookup.cache = {}
