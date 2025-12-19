# TicTacToe_Web
## Тз представленно в файле documentation/ISSpecs.md
Ссылка на сайт: https://176.108.250.40/  
## Запуск
В этом нет необходимости, но еслы вы все таки решились на это, то надо сделать ряд действий.  
1) Поменять домен в файле /frontend/.env.production на ваш. Накладываемые на него требование изложены ниже  
2) 
```shell 
cd server && mkdir data && touch data/app.db && chmod 777 -R data && docker-compose up --build  
```
## Описание сети
Cеть контейнеров требует 2 публичных порта: 80(для http - редерект на https) и 443(для https).
Микросервисное взаимодействие осуществляется по docker network. 
Всего 3 контейнера: proxy, frontend, backend.  
 - proxy - nginx, который проксирует запросы на frontend и backend  
 - frontend - сайт написанный на реакт. Веб сервер - nginx
 - backend - сервер написанный на python - FastAPI. Использует SQLite через ORM - SQLAlchemy. Запускается через uvicorn.

Таким образом, доступ к фронтенду осуществляется через https://176.108.250.40/ а доступ к бекенду через https://176.108.250.40/api/  
## Стек технологий
 - frontend: React, TypeScript, TailwindCSS, React-router-dom, ...  
 - backend: Python, FastAPI, SQLAlchemy, SQLite, ...
## Описание проекта
Это можно посмотреть в файле documentation/ISSpecs.md