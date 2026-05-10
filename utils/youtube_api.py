import re

def detect_platform(url):

    if "youtube.com" in url or "youtu.be" in url:
        return "youtube"

    elif "facebook.com" in url:
        return "facebook"

    elif "instagram.com" in url:
        return "instagram"

    return "unknown"


def fetch_youtube_comments():

    return [
        "Amazing video",
        "You are stupid",
        "Very helpful tutorial",
        "Worst explanation ever",
        "Nice content"
    ]


def fetch_facebook_comments():

    return [
        "Nice post",
        "Terrible content",
        "You are an idiot",
        "Very informative",
        "Loved this"
    ]


def fetch_instagram_comments():

    return [
        "Beautiful photo",
        "So stupid",
        "Great content",
        "Worst page ever",
        "Awesome"
    ]


def fetch_comments(url):

    platform = detect_platform(url)

    if platform == "youtube":
        return fetch_youtube_comments()

    elif platform == "facebook":
        return fetch_facebook_comments()

    elif platform == "instagram":
        return fetch_instagram_comments()

    else:
        return []