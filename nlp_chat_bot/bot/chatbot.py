#!/usr/bin/python
# coding:utf-8
from aip import AipSpeech

from nlp_chat_bot.config.config import getConfig

APP_ID = getConfig("baidu_aip", "APP_ID")
API_KEY = getConfig("baidu_aip", "API_KEY")
SECRET_KEY = getConfig("baidu_aip", "SECRET_KEY")

client = AipSpeech(APP_ID, API_KEY, SECRET_KEY)


def generate_voice_file(message):
    result = client.synthesis(message, 'zh', 1, {
        'vol': 5,
        'per': 4,
    })
    if not isinstance(result, dict):
        with open('static/output.wav', 'wb') as f:
            f.write(result)
    return result


def get_file_content(filePath):
    with open(filePath, 'rb') as fp:
        return fp.read()


def transfer_voice():
    result_from_aip = client.asr(get_file_content("input.wav"), 'wav', 16000, {'dev_pid': 1537, })
    import json
    result_dict = json.loads(json.dumps(result_from_aip, encoding="UTF-8", ensure_ascii=False))

    if not result_dict.has_key('result'):
        print "无法识别语音"
        return ""
    voice = result_dict['result'][0].encode('utf-8')
    print "检测到语音内容为：" + voice
    return voice

# generate_voice_file("我透你妈")
# print transfer_voice()
