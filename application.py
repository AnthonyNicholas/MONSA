import os
import re
import requests
import random
from flask import Flask, jsonify, render_template, request, url_for
from flask_jsglue import JSGlue
import sys

from cs50 import SQL
from helpers import lookup

# configure application
app = Flask(__name__)
JSGlue(app)

# set up logging
import logging
logging.basicConfig(filename='debug.log',level=logging.INFO)

# ensure responses aren't cached
if app.config["DEBUG"]:
    @app.after_request
    def after_request(response):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Expires"] = 0
        response.headers["Pragma"] = "no-cache"
        return response

# configure CS50 Library to use SQLite database
db = SQL("sqlite:///bestNatureStripAddresses.db")

@app.route("/")
def mainpage():
    """Get addresses from DB and render gallery. """
    log("Hello World3")
    
    picItems = getListOfPics()
    
    return render_template("mainPage.html", key="AIzaSyCssINvVOAV0n5dZmZLtpgfmMqvCBhuJPo", picItems=picItems[1:], firstItem=picItems[0])
    
@app.route("/gallery")
def gallery():
    """Get addresses from DB and render gallery. """
    
    picItems = getListOfPics()
    
    return render_template("gallery.html", key="AIzaSyCssINvVOAV0n5dZmZLtpgfmMqvCBhuJPo", picItems=picItems[1:], firstItem=picItems[0])

@app.route("/update")
def update():
    """Find up to 10 places within view."""

    # ensure parameters are present
    if not request.args.get("sw"):
        raise RuntimeError("missing sw")
    if not request.args.get("ne"):
        raise RuntimeError("missing ne")

    # ensure parameters are in lat,lng format
    if not re.search("^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$", request.args.get("sw")):
        raise RuntimeError("invalid sw")
    if not re.search("^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$", request.args.get("ne")):
        raise RuntimeError("invalid ne")

    # explode southwest corner into two variables
    (sw_lat, sw_lng) = [float(s) for s in request.args.get("sw").split(",")]

    # explode northeast corner into two variables
    (ne_lat, ne_lng) = [float(s) for s in request.args.get("ne").split(",")]

    # find 10 cities within view, pseudorandomly chosen if more within view
    if (sw_lng <= ne_lng):

        # doesn't cross the antimeridian
        rows = db.execute("""SELECT * FROM natureStripRecords
            WHERE :sw_lat <= latitude AND latitude <= :ne_lat AND (:sw_lng <= longitude AND longitude <= :ne_lng)
            GROUP BY street, suburb, state
            ORDER BY RANDOM()
            LIMIT 10""",
            sw_lat=sw_lat, ne_lat=ne_lat, sw_lng=sw_lng, ne_lng=ne_lng)

    else:

        # crosses the antimeridian
        rows = db.execute("""SELECT * FROM natureStripRecords
            WHERE :sw_lat <= latitude AND latitude <= :ne_lat AND (:sw_lng <= longitude OR longitude <= :ne_lng)
            GROUP BY country_code, place_name, admin_code1
            ORDER BY RANDOM()
            LIMIT 10""",
            sw_lat=sw_lat, ne_lat=ne_lat, sw_lng=sw_lng, ne_lng=ne_lng)

    # output places as JSON
    return jsonify(rows)


@app.route("/map")
def map():
    """Render map."""
    return render_template("map.html", key=os.environ.get("API_KEY"))
    
    
@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/captureButton")
def captureButton():

    latLng = request.args.get("latLng") #string in form (xx,yy)
    latLng = latLng[1:-1]
    x,y = latLng.split(',')
    latitude = float(x)
    longitude = float(y)

    address = request.args.get("description") #string in form "1 Swift St, Northcote, Victoria"
    streetNameAndNumber,suburb,state = address.split(',')
    streetNameAndNumber.strip()
    street_num, street = streetNameAndNumber.split(" ", 1)
    street_num.strip()
    street.strip()
    suburb.strip()
    state.strip()
    country='Australia' #need to find a way to get country
    googSV_heading=request.args.get("heading") 
    artistStatement='hi there' #need to find a way to get country

    db.execute("""INSERT INTO natureStripRecords VALUES (:street_num, :street, :suburb, :state, :country, :latitude, :longitude, :googSV_heading, :artistStatement, :score)""", street_num=street_num, street=street, suburb=suburb, state=state, country=country, latitude=latitude, longitude=longitude, googSV_heading=googSV_heading, artistStatement=artistStatement, score=0)
    
    return render_template("map.html", key=os.environ.get("API_KEY"))

@app.route("/upVoteButton")
def upVoteButton():
    
    log("upvoting")
    id = int(request.args.get("id")) #dict

    picItems = getListOfPics()
    pic = getPicByID(picItems, id)
    newScore = int(pic['score'] + 1)
    db.execute("""UPDATE natureStripRecords SET score = :newScore WHERE id = :id""", newScore=newScore, id = id)
    picItems=getListOfPics()

    return render_template("gallery.html", key="AIzaSyCssINvVOAV0n5dZmZLtpgfmMqvCBhuJPo", picItems=picItems, firstItem=pic)

@app.route("/downVoteButton")
def downVoteButton():
    log("downvoting")
    id = int(request.args.get("id")) #dict
    log("id = " + str(id))
    picItems = getListOfPics()
    pic = getPicByID(picItems, id)
    newScore = int(pic['score'] - 1)
    log("newScore = " + str(newScore))
    db.execute("""UPDATE natureStripRecords SET score = :newScore WHERE id = :id""", newScore=newScore, id = id)
    picItems=getListOfPics()

    return render_template("gallery.html", key="AIzaSyCssINvVOAV0n5dZmZLtpgfmMqvCBhuJPo", picItems=picItems, firstItem=pic)

@app.route("/reloadGallery")
def reloadGallery():
    
    log("reloading gallery2")
    id = int(request.args.get("id")) #dict

    picItems = getListOfPics()
    pic = getPicByID(picItems, id)

    return render_template("gallery.html", key="AIzaSyCssINvVOAV0n5dZmZLtpgfmMqvCBhuJPo", picItems=picItems, firstItem=pic)



# Get list of pics from db sorted in score order

def getListOfPics():

    places = db.execute("""SELECT * FROM natureStripRecords
        ORDER BY score DESC
        LIMIT 20""")

    picItems=[]

    for row in places:
        picDetails={}
        address = row['street_num'] + " " + row['street'] + " " + row['suburb'] + " " +row['state'] + " " + row['country']
        latLong = str(row['latitude']) + ', ' + str(row ['longitude'])
        heading = str(row['googSV_heading'])
        picUrl = 'https://maps.googleapis.com/maps/api/streetview?size=640x300&location=' + latLong + '&fov=100&heading=' + heading + '&pitch=-5&key=AIzaSyCssINvVOAV0n5dZmZLtpgfmMqvCBhuJPo'
        
        picDetails['address'] = address 
        picDetails['picUrl'] = picUrl 
        picDetails['score'] = row['score']
        picDetails['id'] = row['id']
        picDetails['artistStatement'] = row['artistStatement']
        picItems.append(picDetails)
        
    return picItems

# Get pics with particular ID

def getPicByID(picItems, ID):

    for pic in picItems:
        # log(pic['id'])
        if int(pic['id']) == int(ID):
            return pic
    
    return None

# Use for logging - flask logging not working

def log(message):
    
    logging.info(message)
    
    return None