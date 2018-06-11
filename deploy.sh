#!/bin/sh
# apt install python-pip
# export LC_ALL="en_US.UTF-8"
# export LC_CTYPE="en_US.UTF-8"
# dpkg-reconfigure locales
# python -m pip install "django<2" django-sslserver baidu-aip

zip -r nlp_chat_bot.zip .
scp -i ~/Downloads/kp-nj7tubox nlp_chat_bot.zip root@139.198.188.74:~
ssh -i ~/Downloads/kp-nj7tubox root@139.198.188.74 "rm -rf nlp_chat_bot; unzip nlp_chat_bot.zip -d nlp_chat_bot; cd nlp_chat_bot; nohup python manage.py runsslserver 0.0.0.0:8000 &"
