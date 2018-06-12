#!/bin/sh
# apt install python-pip
# export LC_ALL="en_US.UTF-8"
# export LC_CTYPE="en_US.UTF-8"
# dpkg-reconfigure locales
# python -m pip install "django<2" django-sslserver baidu-aip
# scp -i ~/Downloads/kp-nj7tubox app.key app.pem root@139.198.188.74:~

zip -r nlp_chat_bot.zip nlp_chat_bot static manage.py
scp -i ~/Downloads/kp-nj7tubox nlp_chat_bot.zip root@139.198.188.74:~
ssh -i ~/Downloads/kp-nj7tubox root@139.198.188.74 "kill `ps auxw | grep runsslserver | awk  '{print $2}'`; rm -rf nlp_chat_bot; unzip nlp_chat_bot.zip -d nlp_chat_bot; cd nlp_chat_bot; nohup python manage.py runsslserver 0.0.0.0:443 --certificate ../app.pem --key ../app.key &"
