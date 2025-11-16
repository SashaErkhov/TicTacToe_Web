# Описание

## Наименование

**"База данных веб-платформы OurPaintHUB для регистрации пользователей и их взаимодействия друг с другом, обмена файлами
и управления обучающими материалами"**
## Предметная область
База данных веб-платформы OurPaintHUB будет предназначена для хранения информации о пользователях, их друзьях, файлах и
документации, а также обучающих материалах. Система будет обеспечивать регистрацию, обмен файлами, социальное взаимодействие и
управление доступом к контенту, включая видеоматериалы от администраторов.

# Данные
## Для каждого элемента данных - ограничения
### Таблица users

- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- email: VARCHAR(255), NOT NULL, UNIQUE, CHECK(тут выражения для мыла) - email должен содержать @
- password: TEXT, NOT NULL, CHECK(Проверка на соответствие шифрованию sha256) 
- registration_date: TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP
### Таблица user_profile
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- user_id: INTEGER, NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE
- name: VARCHAR(255), NOT NULL, CHECK(    name <> '' AND name !~ '\d' AND name ~ '^[A-ZА-Я][a-zа-я]+$') - имя не пустое и нет цифр
- avatar: PATH, NULL
- bio: TEXT, NULL
- date_of_birth: DATE, NULL, СHECK (date_of_birth <= CURRENT_DATE - INTERVAL '7 years') - минимально 8 лет
### Таблица role
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- user_id: INTEGER, NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE
- role: VARCHAR(255), NOT NULL, CHECK(role IN ('admin','user')) - допустимые роли
### Таблица projects
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- user_id: INTEGER, NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE
- private: BOOLEAN, NOT NULL, DEFAULT TRUE
### Таблица project_meta
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- project_id: INTEGER, NOT NULL, FOREIGN KEY -> projects(id), ON DELETE CASCADE
- project_name: VARCHAR(255), NOT NULL, CHECK(project_name <> '')
- path: PATH, NOT NULL
- weight: DECIMAL, NULL, CHECK(weight >= 0) - вес не может быть отрицательным
- type: VARCHAR(16), NULL, CHECK(type IN ('ourp','json','pdf', 'tiff', 'jpg', 'md', 'txt', 'png', 'jpeg', 'svg', 'bmp'))
### Таблица project_changes
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- project_id: INTEGER, NOT NULL, FOREIGN KEY -> projects(id), ON DELETE CASCADE
- changer_id: INTEGER, NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE
- description: TEXT, NULL
### Таблица shared
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- project_id: INTEGER, NOT NULL, FOREIGN KEY -> projects(id), ON DELETE CASCADE
- receiver_id: INTEGER, NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE
- comment: TEXT, NULL
### Таблица Friendship
- user1: INTEGER, NOT NULL, PRIMARY KEY -> users(id), ON DELETE CASCADE
- user2: INTEGER, NOT NULL, PRIMARY KEY -> users(id), ON DELETE CASCADE
- status: VARCHAR(20) DEFAULT 'sent', CHECK(status IN ('sent', 'accepted', 'blocked'))
### Таблица entity_logs
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- time: TIME, NOT NULL
- action: VARCHAR(20), NOT NULL, CHECK(action IN ('add', 'change','remove'))
- id_user: BIGINT, NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE
- type: VARCHAR(255), NOT NULL, CHECK(type IN (*тут все таблички*))
- id_entity: BIGINT, NOT NULL
### Таблица media_files
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- path: PATH, NOT NULL
- type: VARCHAR(255), NOT NULL, CHECK(type IN ('image','video','md'))
### Таблица media_meta
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- admin_id: INTEGER, NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE
- media_id: INTEGER, NOT NULL, FOREIGN KEY -> media_files(id), ON DELETE CASCADE
- description: TEXT, NULL
- name: VARCHAR(255), NOT NULL
### Таблица documentation
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- type: VARCHAR(255), NOT NULL, CHECK(type IN ('guide','reference','api'))
- admin: INTEGER, NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE
- text: TEXT, NULL
### Таблица FAQ
- id: INTEGER, PRIMARY KEY, AUTOINCREMENT, NOT NULL
- text_question: TEXT, NOT NULL, CHECK(text_question <> '')
- answered: BOOLEAN, NOT NULL, DEFAULT FALSE
- answer_text: TEXT, NULL
- admin_id: INTEGER, NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE
- user_id: INTEGER, NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE

## Общие ограничения целостности
- Все внешние ключи (FOREIGN KEY) должны ссылаться на существующие записи.
- Нельзя создать проект, если пользователь-владелец не существует.
- Нельзя создать запись в логах для несуществующего пользователя или проекта.
- При удалении родительской записи должны выполняться каскадные действия или блокировки в зависимости от бизнес-логики (ON DELETE CASCADE или ON DELETE RESTRICT).
- Поле email в таблице Users должно быть уникальным.
- ID во всех таблицах уникальны и автогенерируются.
- Одинаковые пары пользователей в friendship запрещены (user1, user2 уникальны как пара).
- Поля, участвующие в связях (user_id, project_id, receiver_id, changer_id, admin_id и др.), не могут быть NULL.
- Поля, критичные для бизнес-логики (email, password, project_name, role, type для документации и медиафайлов) не могут быть NULL.
- В Friendship пользователь не может быть другом сам себе (user1 != user2).
- В shared проект не может быть передан самому владельцу (receiver_id != project.owner).
- Поле type для медиафайлов и документации должно содержать только допустимые значения.
- При удалении пользователя должны удаляться все его проекты, роли, профили, связи дружбы, записи логов и переданные проекты.
- При удалении проекта должны удаляться все изменения (project_changes), метаданные (project_meta), записи об обмене (shared).
- В таблице entity_logs действия можно записывать только для существующих пользователей и существующих сущностей (проектов, медиафайлов, документации).
# Пользовательские роли

## Для каждой роли - наименование, ответственность, количество пользователей в этой роли?
Роль Администратор.
Ответсвенность:
 - Добавление и редактирование обучающих текстовых и видео материалов. 
 - Модерация пользовательского контента.
 - Поддержка обратной связи в разделе FAQ.
 - Регулирование правами доступа.
 - Блокировка, разблокировка, удаление пользователей. 
Количество пользователей: 2

Роль Пользователь.
Ответсвенность:
 - Регистрация и ведение профиля.
 - Добавление файлов для обмена.
 - Доступ к обучающим материалам.
 - Доступ к приложению.
 - Социальное взаимодейтсвие.
 - Управление проектами.
 - Получение поддержки в разделе FAQ.
Количество пользователей: не ограничено.


# UI / API

* Аутентификация и профиль
 - POST /auth/register — регистрация пользователя.
 - POST /auth/login — авторизация (получение токена).
 - POST /auth/logout — выход.
 - GET /users/me — получение данных о себе.
 - DELETE /users/me — удаление профиля.
* Социальное взаимодействие
 - POST /friends/{id} — добавить в друзья.
 - DELETE /friends/{id} — удалить из друзей.
 - GET /friends/request - заявки
 - GET /friends/declined - непринятые
 - GET /friends/accepted - приятные
 - GET /friends — список друзей.
* Проекты и обмен файлами
 - GET /projects/{id} — получить информацию о проекте.
 - PUT /projects/{id} — редактировать проект.
 - DELETE /projects/{id} — удалить проект.
 - GET /projects/{id}/files — список файлов проекта.
 - POST /projects/{id}/files/{file} — скачать файл.
 - DELETE /projects/{id}/files/{file_id} — удалить файл.
 - GET /projects/shared — проекты, которыми поделились с пользователем.
* Обучающие материалы
 - GET /materials — список материалов (фильтр: тип = текст/видео).
 - GET /materials/{id} — просмотр материала.
 - DELETE /materials/{id} (только админ) — удалить материал.

* FAQ и поддержка
 - GET /faq — список вопросов и ответов.
* Администрирование
 - GET /admin/users — список всех пользователей.
 - PUT /admin/users/{id}/role — назначить/сменить роль.
 - DELETE /admin/users/{id} — удалить пользователя.
 - GET /admin/logs — просмотр логов действий.

# Технологии разработки
## Язык программирования
Мы будем использовать Python для бэкэнд части, а конкретнее фреймворк Django. Для фронтэнд разработки воспользуемся 
React
## СУБД
- PostgreSQL
# Тестирование
- pytest — основной фреймворк для тестирования.
- pytest-django — интеграция pytest с Django.
- pytest-cov — измерение покрытия кода тестами.
- factory_boy — создание тестовых данных (фабрики моделей).
- requests или httpx — тестирование API.
- django.test.Client / APIClient (DRF) — для тестирования эндпоинтов REST API.
- Jest — тестирование компонентов и функций.
- pytest-postgresql — временная PostgreSQL для тестов.