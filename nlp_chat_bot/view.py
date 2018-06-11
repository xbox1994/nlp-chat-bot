#!/usr/bin/python
# coding:utf-8
import json
import urllib2

from django.http import HttpResponse
from django.shortcuts import render

from nlp_chat_bot.bot.chatbot import transfer_voice, generate_voice_file
from nlp_chat_bot.config.config import getConfig


def hello(request):
    context = {'hello': 'Hello World!'}
    return render(request, 'bot.html', context)


def chat(request):
    if request.method == 'POST':
        request.encoding = 'utf-8'

        handle_uploaded_file(request.FILES['audioData'], str(request.FILES['audioData']))

        message = transfer_voice()
        if message == "":
            return generate_voice_and_send("无法识别，请再试一遍吧")
        print "发送的语音为：" + message

        data = {
            "reqType": 0,
            "perception": {
                "inputText": {
                    "text": message
                }
            },
            "userInfo": {
                "apiKey": getConfig("tuling", "apiKey"),
                "userId": "xxx"
            }
        }
        json_data = json.dumps(data).encode('utf-8')
        json_length = len(json_data)

        requrl = "http://openapi.tuling123.com/openapi/api/v2"

        request = urllib2.Request(url=requrl, data=json_data)
        request.add_header("Content-Type", "application/json")
        request.add_header("Content-Length", json_length)
        res_data = urllib2.urlopen(request)
        result_str = res_data.read().decode('utf-8')
        json_resp = json.loads(result_str)
        json_resp = json_resp['results'][0]['values']['text'].encode('utf-8')
        print "机器人返回：" + json_resp

        response = generate_voice_and_send(json_resp)
        return response
    return HttpResponse("Failed")


def generate_voice_and_send(json_resp):
    generate_voice_file(json_resp)
    response = HttpResponse("success")
    # read = open("output.wav", 'rb').read()
    # response.write(read)
    # response['Content-Type'] = 'audio/wav'
    # response['Content-Length'] = os.path.getsize("output.wav")
    return response


def handle_uploaded_file(file, filename):
    with open('input.wav', 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)


def whatisthis(s):
    if isinstance(s, str):
        print "ordinary string"
    elif isinstance(s, unicode):
        print "unicode string"
    else:
        print "not a string"
