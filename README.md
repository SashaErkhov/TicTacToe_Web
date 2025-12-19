# TicTacToe_Web
## Тз представленно в файле documentation/ISSpecs.md
Ссылка на сайт: http://176.108.250.40/  
## Запуск
В этом нет необходимости, но еслы вы все таки решились на это, то надо сделать ряд действий.  
1) Поменять домен в файле /frontend/.env.production на ваш. Накладываемые на него требование изложены ниже  
2) 
```shell 
cd server && mkdir data && touch data/app.db && chmod 777 -R data && docker-compose up --build  
```
## Описание сети
Cеть контейнеров требует 1 публичный порт: 80. Для http. 
Микросервисное взаимодействие осуществляется по docker network. 
Всего 3 контейнера: proxy, frontend, backend.  
 - proxy - nginx, который проксирует запросы на frontend и backend  
 - frontend - сайт написанный на реакт. Веб сервер - nginx
 - backend - сервер написанный на python - FastAPI. Использует SQLite через ORM - SQLAlchemy. Запускается через uvicorn.

Таким образом, доступ к фронтенду осуществляется через http://176.108.250.40/ а доступ к бекенду через http://176.108.250.40/api/  
## Стек технологий
 - frontend: React, TypeScript, TailwindCSS, React-router-dom, ...  
 - backend: Python, FastAPI, SQLAlchemy, SQLite, ...
## Описание проекта
Это можно посмотреть в файле documentation/ISSpecs.md